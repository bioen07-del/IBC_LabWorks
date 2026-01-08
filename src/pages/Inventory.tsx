import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/database.types'
import { Plus, Package, AlertTriangle, Search, Filter, QrCode } from 'lucide-react'
import { QRCodeModal } from '@/components/ui/QRCodeModal'

type InventoryItem = Database['public']['Tables']['inventory_items']['Row']
type Location = Database['public']['Tables']['locations']['Row']

const categoryLabels: Record<string, string> = {
  media: 'Среды',
  serum: 'Сыворотки',
  reagent: 'Реагенты',
  consumable: 'Расходники',
  additive: 'Добавки'
}

const statusLabels: Record<string, string> = {
  active: 'Активен',
  quarantined: 'Карантин',
  expired: 'Просрочен',
  depleted: 'Израсходован',
  disposed: 'Утилизирован'
}

const statusColors: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800',
  quarantined: 'bg-amber-100 text-amber-800',
  expired: 'bg-red-100 text-red-800',
  depleted: 'bg-slate-100 text-slate-600',
  disposed: 'bg-slate-100 text-slate-600'
}

export function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [qrModal, setQrModal] = useState<{ code: string; name: string } | null>(null)

  const [formData, setFormData] = useState({
    item_code: '',
    item_name: '',
    item_category: 'reagent' as Database['public']['Enums']['inventory_category'],
    item_type: '',
    supplier: '',
    lot_number: '',
    batch_code: '',
    catalog_number: '',
    quantity: 0,
    quantity_remaining: 0,
    unit: 'ml',
    receipt_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    storage_conditions: '',
    storage_location_id: null as number | null
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    const [{ data: itemsData }, { data: locationsData }] = await Promise.all([
      supabase.from('inventory_items').select('*').order('expiry_date', { ascending: true }),
      supabase.from('locations').select('*').eq('status', 'active')
    ])
    setItems(itemsData || [])
    setLocations(locationsData || [])
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      ...formData,
      quantity: Number(formData.quantity),
      quantity_remaining: editingItem ? Number(formData.quantity_remaining) : Number(formData.quantity),
      storage_location_id: formData.storage_location_id || null
    }

    if (editingItem) {
      await supabase.from('inventory_items').update(payload).eq('id', editingItem.id)
    } else {
      await supabase.from('inventory_items').insert(payload)
    }
    setShowModal(false)
    setEditingItem(null)
    resetForm()
    fetchData()
  }

  function resetForm() {
    setFormData({
      item_code: '',
      item_name: '',
      item_category: 'reagent',
      item_type: '',
      supplier: '',
      lot_number: '',
      batch_code: '',
      catalog_number: '',
      quantity: 0,
      quantity_remaining: 0,
      unit: 'ml',
      receipt_date: new Date().toISOString().split('T')[0],
      expiry_date: '',
      storage_conditions: '',
      storage_location_id: null
    })
  }

  function openEdit(item: InventoryItem) {
    setEditingItem(item)
    setFormData({
      item_code: item.item_code,
      item_name: item.item_name,
      item_category: item.item_category,
      item_type: item.item_type || '',
      supplier: item.supplier || '',
      lot_number: item.lot_number || '',
      batch_code: item.batch_code || '',
      catalog_number: item.catalog_number || '',
      quantity: item.quantity,
      quantity_remaining: item.quantity_remaining,
      unit: item.unit,
      receipt_date: item.receipt_date.split('T')[0],
      expiry_date: item.expiry_date.split('T')[0],
      storage_conditions: item.storage_conditions || '',
      storage_location_id: item.storage_location_id
    })
    setShowModal(true)
  }

  const filteredItems = items.filter(item => {
    const matchesSearch = item.item_name.toLowerCase().includes(search.toLowerCase()) ||
      item.item_code.toLowerCase().includes(search.toLowerCase()) ||
      (item.lot_number && item.lot_number.toLowerCase().includes(search.toLowerCase()))
    const matchesCategory = !categoryFilter || item.item_category === categoryFilter
    return matchesSearch && matchesCategory
  })

  // FEFO indicator
  function getDaysUntilExpiry(expiryDate: string): number {
    const today = new Date()
    const expiry = new Date(expiryDate)
    return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Инвентарь</h1>
          <p className="text-slate-500">Управление материалами и реагентами (FEFO)</p>
        </div>
        <button
          onClick={() => { resetForm(); setEditingItem(null); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          Добавить материал
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Поиск по названию, коду или лоту..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded-lg"
        >
          <option value="">Все категории</option>
          {Object.entries(categoryLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Загрузка...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Код</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Название</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Категория</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">LOT</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Остаток</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Срок годности</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">FEFO</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Статус</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredItems.map((item, idx) => {
                const daysUntilExpiry = getDaysUntilExpiry(item.expiry_date)
                const isFirst = idx === 0 || item.item_category !== filteredItems[idx - 1]?.item_category
                return (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">{item.item_code}</span>
                        <button
                          onClick={() => setQrModal({ code: item.item_code, name: item.item_name })}
                          className="text-slate-400 hover:text-emerald-600"
                          title="QR-код"
                        >
                          <QrCode className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{item.item_name}</div>
                      {item.supplier && <div className="text-xs text-slate-500">{item.supplier}</div>}
                    </td>
                    <td className="px-4 py-3 text-sm">{categoryLabels[item.item_category]}</td>
                    <td className="px-4 py-3 text-sm font-mono">{item.lot_number || '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      {item.quantity_remaining} / {item.quantity} {item.unit}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {new Date(item.expiry_date).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="px-4 py-3">
                      {daysUntilExpiry <= 0 ? (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Просрочен</span>
                      ) : daysUntilExpiry <= 7 ? (
                        <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {daysUntilExpiry}д
                        </span>
                      ) : daysUntilExpiry <= 30 ? (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">{daysUntilExpiry}д</span>
                      ) : (
                        <span className="text-sm text-slate-500">{daysUntilExpiry}д</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${statusColors[item.status]}`}>
                        {statusLabels[item.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openEdit(item)}
                        className="text-emerald-600 hover:text-emerald-800 text-sm"
                      >
                        Редактировать
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filteredItems.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p>Материалы не найдены</p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingItem ? 'Редактировать материал' : 'Добавить материал'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Код материала *</label>
                  <input
                    type="text"
                    required
                    value={formData.item_code}
                    onChange={(e) => setFormData({...formData, item_code: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder="DMEM-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Категория *</label>
                  <select
                    required
                    value={formData.item_category}
                    onChange={(e) => setFormData({...formData, item_category: e.target.value as any})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Название *</label>
                <input
                  type="text"
                  required
                  value={formData.item_name}
                  onChange={(e) => setFormData({...formData, item_name: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  placeholder="DMEM High Glucose"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Поставщик</label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder="Sigma-Aldrich"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">LOT номер</label>
                  <input
                    type="text"
                    value={formData.lot_number}
                    onChange={(e) => setFormData({...formData, lot_number: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder="ABC12345"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Каталожный номер</label>
                  <input
                    type="text"
                    value={formData.catalog_number}
                    onChange={(e) => setFormData({...formData, catalog_number: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder="D5796"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Количество *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                {editingItem && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Остаток</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.quantity_remaining}
                      onChange={(e) => setFormData({...formData, quantity_remaining: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1">Единица *</label>
                  <select
                    required
                    value={formData.unit}
                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="ml">мл</option>
                    <option value="L">л</option>
                    <option value="mg">мг</option>
                    <option value="g">г</option>
                    <option value="pcs">шт</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Дата поступления *</label>
                  <input
                    type="date"
                    required
                    value={formData.receipt_date}
                    onChange={(e) => setFormData({...formData, receipt_date: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Срок годности *</label>
                  <input
                    type="date"
                    required
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Условия хранения</label>
                  <input
                    type="text"
                    value={formData.storage_conditions}
                    onChange={(e) => setFormData({...formData, storage_conditions: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder="+2...+8°C"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Локация хранения</label>
                  <select
                    value={formData.storage_location_id || ''}
                    onChange={(e) => setFormData({...formData, storage_location_id: e.target.value ? parseInt(e.target.value) : null})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="">Не указана</option>
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.location_name} ({loc.location_code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingItem(null) }}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  {editingItem ? 'Сохранить' : 'Добавить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={!!qrModal}
        onClose={() => setQrModal(null)}
        code={qrModal?.code || ''}
        title="QR-код материала"
        subtitle={qrModal?.name}
      />
    </div>
  )
}
