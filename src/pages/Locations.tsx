import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Plus, Search, Building2, X, Pencil, Trash2, Shield
} from 'lucide-react'

interface Location {
  id: number;
  location_code: string;
  location_name: string;
  location_type: string;
  status: string;
  is_clean_room: boolean;
  clean_room_class: string | null;
  temperature_min: number | null;
  temperature_max: number | null;
  capacity: number | null;
  current_occupancy: number | null;
  equipment_count?: number;
}

const statusColors: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  maintenance: 'bg-amber-100 text-amber-700',
  restricted: 'bg-red-100 text-red-700',
}

const statusLabels: Record<string, string> = {
  active: 'Активно',
  maintenance: 'Обслуживание',
  restricted: 'Ограничен доступ',
}

const cleanRoomClasses = ['ISO 5', 'ISO 6', 'ISO 7', 'ISO 8']

export function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    location_code: '',
    location_name: '',
    status: 'active',
    is_clean_room: false,
    clean_room_class: '',
    temperature_min: '',
    temperature_max: '',
    capacity: '',
    current_occupancy: '0'
  })

  useEffect(() => {
    loadLocations()
  }, [])

  async function loadLocations() {
    // Загружаем локации с подсчётом оборудования
    const { data: locs } = await supabase.from('locations').select('*').order('location_code')
    const { data: eqCounts } = await supabase.from('equipment').select('location_id')
    
    const countMap: Record<number, number> = {}
    eqCounts?.forEach(e => {
      if (e.location_id) countMap[e.location_id] = (countMap[e.location_id] || 0) + 1
    })

    setLocations((locs || []).map(l => ({ ...l, equipment_count: countMap[l.id] || 0 })) as any)
    setLoading(false)
  }

  const generateCode = () => `ROOM-${String(locations.length + 1).padStart(3, '0')}`

  const handleSave = async () => {
    const payload = {
      location_code: formData.location_code || generateCode(),
      location_name: formData.location_name,
      location_type: 'room',
      status: formData.status as any,
      is_clean_room: formData.is_clean_room,
      clean_room_class: formData.clean_room_class || null,
      temperature_min: formData.temperature_min ? parseFloat(formData.temperature_min) : 18,
      temperature_max: formData.temperature_max ? parseFloat(formData.temperature_max) : 25,
      capacity: formData.capacity ? parseInt(formData.capacity) : 10,
      current_occupancy: formData.current_occupancy ? parseInt(formData.current_occupancy) : 0
    }
    if (editingId) {
      await supabase.from('locations').update(payload as any).eq('id', editingId)
    } else {
      await supabase.from('locations').insert(payload as any)
    }
    closeModal()
    loadLocations()
  }

  const handleEdit = (loc: Location) => {
    setEditingId(loc.id)
    setFormData({
      location_code: loc.location_code,
      location_name: loc.location_name,
      status: loc.status,
      is_clean_room: loc.is_clean_room,
      clean_room_class: loc.clean_room_class || '',
      temperature_min: loc.temperature_min?.toString() || '',
      temperature_max: loc.temperature_max?.toString() || '',
      capacity: loc.capacity?.toString() || '',
      current_occupancy: loc.current_occupancy?.toString() || '0'
    })
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить помещение? Все привязанное оборудование потеряет привязку.')) return
    await supabase.from('locations').delete().eq('id', id)
    loadLocations()
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingId(null)
    setFormData({ location_code: '', location_name: '', status: 'active', is_clean_room: false, clean_room_class: '', temperature_min: '', temperature_max: '', capacity: '', current_occupancy: '0' })
  }

  const filteredLocations = search
    ? locations.filter(l => l.location_name.toLowerCase().includes(search.toLowerCase()) || l.location_code.toLowerCase().includes(search.toLowerCase()))
    : locations

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Помещения</h1>
          <p className="text-slate-500 mt-1">Управление производственными помещениями и классами чистоты</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Добавить помещение
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Поиск помещений..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredLocations.length === 0 ? (
          <div className="text-center py-12 text-slate-500">Помещения не найдены</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {filteredLocations.map(loc => (
              <div key={loc.id} className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${loc.is_clean_room ? 'bg-blue-100' : 'bg-slate-100'}`}>
                      <Building2 className={`h-5 w-5 ${loc.is_clean_room ? 'text-blue-600' : 'text-slate-600'}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{loc.location_name}</h3>
                      <p className="text-sm text-slate-500">{loc.location_code}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(loc)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(loc.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${statusColors[loc.status] || 'bg-gray-100'}`}>
                      {statusLabels[loc.status] || loc.status}
                    </span>
                    {loc.clean_room_class && (
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        {loc.clean_room_class}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm text-slate-500 pt-2 border-t border-slate-100">
                    <span>Оборудование: <strong className="text-slate-700">{loc.equipment_count || 0}</strong></span>
                    <span>{loc.temperature_min}°C — {loc.temperature_max}°C</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{editingId ? 'Редактировать помещение' : 'Новое помещение'}</h2>
              <button onClick={closeModal}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Код</label>
                <input type="text" value={formData.location_code} onChange={e => setFormData({...formData, location_code: e.target.value})} placeholder="Авто" className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Название помещения *</label>
                <input type="text" value={formData.location_name} onChange={e => setFormData({...formData, location_name: e.target.value})} placeholder="Чистая комната А" className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Статус</label>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full border rounded px-3 py-2">
                  {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Мин. темп. (°C)</label>
                  <input type="number" value={formData.temperature_min} onChange={e => setFormData({...formData, temperature_min: e.target.value})} placeholder="18" className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Макс. темп. (°C)</label>
                  <input type="number" value={formData.temperature_max} onChange={e => setFormData({...formData, temperature_max: e.target.value})} placeholder="25" className="w-full border rounded px-3 py-2" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Вместимость (ед. оборудования)</label>
                <input type="number" value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})} placeholder="10" className="w-full border rounded px-3 py-2" />
              </div>
              <div className="p-3 bg-blue-50 rounded-lg space-y-3">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.is_clean_room} onChange={e => setFormData({...formData, is_clean_room: e.target.checked, clean_room_class: e.target.checked ? formData.clean_room_class : ''})} className="w-4 h-4" />
                  <span className="text-sm font-medium text-blue-800">Чистое помещение (GMP)</span>
                </label>
                {formData.is_clean_room && (
                  <div>
                    <label className="block text-sm font-medium mb-1 text-blue-800">Класс чистоты</label>
                    <select value={formData.clean_room_class} onChange={e => setFormData({...formData, clean_room_class: e.target.value})} className="w-full border border-blue-200 rounded px-3 py-2 bg-white">
                      <option value="">Выберите класс</option>
                      {cleanRoomClasses.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={closeModal} className="px-4 py-2 border rounded hover:bg-gray-50">Отмена</button>
              <button onClick={handleSave} disabled={!formData.location_name} className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50">{editingId ? 'Сохранить' : 'Создать'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
