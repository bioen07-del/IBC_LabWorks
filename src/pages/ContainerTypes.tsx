import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Search, FlaskConical, Beaker, Snowflake, Box, CheckCircle, XCircle, X, Pencil, Trash2 } from 'lucide-react'

interface ContainerType {
  id: number;
  type_code: string;
  type_name: string;
  category: string;
  manufacturer: string | null;
  catalog_number: string | null;
  volume_ml: number | null;
  surface_area_cm2: number | null;
  is_active: boolean;
}

const categoryIcons: Record<string, React.ReactNode> = {
  flask: <FlaskConical className="h-5 w-5" />,
  plate: <Beaker className="h-5 w-5" />,
  cryovial: <Snowflake className="h-5 w-5" />,
  bag: <Box className="h-5 w-5" />,
  bioreactor: <FlaskConical className="h-5 w-5" />,
}

const categoryLabels: Record<string, string> = {
  flask: 'Флакон',
  plate: 'Планшет',
  cryovial: 'Криовиала',
  bag: 'Пакет',
  bioreactor: 'Биореактор',
}

const categoryColors: Record<string, string> = {
  flask: 'bg-emerald-100 text-emerald-600',
  plate: 'bg-blue-100 text-blue-600',
  cryovial: 'bg-cyan-100 text-cyan-600',
  bag: 'bg-amber-100 text-amber-600',
  bioreactor: 'bg-purple-100 text-purple-600',
}

export function ContainerTypesPage() {
  const [types, setTypes] = useState<ContainerType[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    type_code: '',
    type_name: '',
    category: 'flask',
    manufacturer: '',
    catalog_number: '',
    volume_ml: '',
    surface_area_cm2: ''
  })

  useEffect(() => {
    loadTypes()
  }, [])

  async function loadTypes() {
    const { data } = await supabase.from('container_types').select('*').order('type_name')
    setTypes((data || []) as ContainerType[])
    setLoading(false)
  }

  const generateCode = () => `CT-${Date.now().toString(36).toUpperCase()}`

  const handleSave = async () => {
    try {
      const payload = {
        type_code: formData.type_code || generateCode(),
        type_name: formData.type_name,
        category: formData.category as any,
        manufacturer: formData.manufacturer || null,
        catalog_number: formData.catalog_number || null,
        volume_ml: formData.volume_ml ? parseFloat(formData.volume_ml) : null,
        surface_area_cm2: formData.surface_area_cm2 ? parseFloat(formData.surface_area_cm2) : null,
        is_active: true
      }

      let error
      if (editingId) {
        const result = await supabase.from('container_types').update(payload).eq('id', editingId)
        error = result.error
      } else {
        const result = await supabase.from('container_types').insert(payload)
        error = result.error
      }

      if (error) {
        console.error('Save error:', error)
        alert(`Ошибка сохранения: ${error.message}`)
        return
      }

      closeModal()
      await loadTypes()
    } catch (error) {
      console.error('Unexpected error:', error)
      alert('Неожиданная ошибка при сохранении')
    }
  }

  const handleEdit = (item: ContainerType) => {
    setEditingId(item.id)
    setFormData({
      type_code: item.type_code,
      type_name: item.type_name,
      category: item.category,
      manufacturer: item.manufacturer || '',
      catalog_number: item.catalog_number || '',
      volume_ml: item.volume_ml?.toString() || '',
      surface_area_cm2: item.surface_area_cm2?.toString() || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить тип контейнера?')) return

    try {
      const { error } = await supabase.from('container_types').delete().eq('id', id)

      if (error) {
        console.error('Delete error:', error)
        alert(`Ошибка удаления: ${error.message}`)
        return
      }

      await loadTypes()
    } catch (error) {
      console.error('Unexpected error:', error)
      alert('Неожиданная ошибка при удалении')
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingId(null)
    setFormData({ type_code: '', type_name: '', category: 'flask', manufacturer: '', catalog_number: '', volume_ml: '', surface_area_cm2: '' })
  }

  const filteredTypes = types.filter(t => {
    const matchesSearch = t.type_name.toLowerCase().includes(search.toLowerCase()) || t.type_code.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Типы контейнеров</h1>
          <p className="text-slate-500 mt-1">Справочник типов культуральной посуды</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Добавить тип
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Поиск типов..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2">
            <option value="all">Все категории</option>
            {Object.entries(categoryLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {filteredTypes.map(type => (
              <div key={type.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${categoryColors[type.category] || 'bg-gray-100'}`}>
                    {categoryIcons[type.category] || <Box className="h-5 w-5" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-slate-500">{type.type_code}</span>
                      {type.is_active ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-slate-300" />}
                    </div>
                    <h3 className="font-medium text-slate-900">{type.type_name}</h3>
                    <div className="text-sm text-slate-500 mt-1">
                      {categoryLabels[type.category] || type.category}
                      {type.manufacturer && ` • ${type.manufacturer}`}
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-slate-100 flex gap-4 text-sm text-slate-600">
                  {type.volume_ml && <span>Объём: {type.volume_ml} мл</span>}
                  {type.surface_area_cm2 && <span>Площадь: {type.surface_area_cm2} см²</span>}
                </div>

                {type.catalog_number && <div className="mt-2 text-xs text-slate-400">Кат. №: {type.catalog_number}</div>}
                <div className="flex justify-end gap-1 mt-2">
                  <button onClick={() => handleEdit(type)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(type.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
            {filteredTypes.length === 0 && <div className="col-span-3 text-center py-8 text-slate-500">Типы не найдены</div>}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{editingId ? 'Редактировать' : 'Новый тип контейнера'}</h2>
              <button onClick={closeModal}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Код</label>
                <input type="text" value={formData.type_code} onChange={e => setFormData({...formData, type_code: e.target.value})} placeholder="Авто" className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Название *</label>
                <input type="text" value={formData.type_name} onChange={e => setFormData({...formData, type_name: e.target.value})} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Категория</label>
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full border rounded px-3 py-2">
                  {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Производитель</label>
                  <input type="text" value={formData.manufacturer} onChange={e => setFormData({...formData, manufacturer: e.target.value})} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Каталожный №</label>
                  <input type="text" value={formData.catalog_number} onChange={e => setFormData({...formData, catalog_number: e.target.value})} className="w-full border rounded px-3 py-2" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Объём (мл)</label>
                  <input type="number" value={formData.volume_ml} onChange={e => setFormData({...formData, volume_ml: e.target.value})} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Площадь (см²)</label>
                  <input type="number" value={formData.surface_area_cm2} onChange={e => setFormData({...formData, surface_area_cm2: e.target.value})} className="w-full border rounded px-3 py-2" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={closeModal} className="px-4 py-2 border rounded hover:bg-gray-50">Отмена</button>
              <button onClick={handleSave} disabled={!formData.type_name} className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50">{editingId ? 'Сохранить' : 'Создать'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
