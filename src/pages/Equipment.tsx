import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Plus, Search, Microscope, AlertCircle, CheckCircle, Wrench,
  X, Pencil, Trash2, ChevronDown, ChevronRight, Layers, MapPin
} from 'lucide-react'

interface StorageZone {
  id: number;
  zone_code: string;
  zone_name: string;
  equipment_id: number;
  zone_type: string;
  position: string | null;
  temperature_min: number | null;
  temperature_max: number | null;
  capacity: number;
  current_occupancy: number;
  status: string;
}

interface Equipment {
  id: number;
  equipment_code: string;
  equipment_name: string;
  equipment_type: string;
  status: string;
  location_id: number | null;
  serial_number: string | null;
  manufacturer: string | null;
  model: string | null;
  last_calibration_date: string | null;
  calibration_valid_until: string | null;
  calibration_frequency_days: number | null;
  maintenance_notes: string | null;
  locations?: { location_name: string } | null;
  storage_zones?: StorageZone[];
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  operational: { label: 'Работает', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  maintenance: { label: 'На обслуживании', color: 'bg-amber-100 text-amber-700', icon: Wrench },
  calibration_due: { label: 'Требуется калибровка', color: 'bg-red-100 text-red-700', icon: AlertCircle },
  retired: { label: 'Списано', color: 'bg-slate-100 text-slate-700', icon: Microscope },
}

const typeLabels: Record<string, string> = {
  incubator: 'Инкубатор',
  laminar_hood: 'Ламинарный бокс',
  centrifuge: 'Центрифуга',
  microscope: 'Микроскоп',
  freezer: 'Морозильник/Холодильник',
  other: 'Другое',
}

const hasStorageZones = (type: string) => ['incubator', 'freezer'].includes(type)

export function EquipmentPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showZoneModal, setShowZoneModal] = useState(false)
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    equipment_code: '',
    equipment_name: '',
    equipment_type: 'other',
    status: 'operational',
    location_id: '',
    serial_number: '',
    manufacturer: '',
    model: '',
    last_calibration_date: '',
    calibration_valid_until: '',
    calibration_frequency_days: '',
    maintenance_notes: ''
  })
  const [zoneForm, setZoneForm] = useState({
    zone_code: '',
    zone_name: '',
    zone_type: 'shelf',
    position: '',
    temperature_min: '',
    temperature_max: '',
    capacity: '100'
  })

  useEffect(() => {
    loadEquipment()
    loadLocations()
  }, [])

  async function loadEquipment() {
    setLoading(true)
    const { data: eq } = await supabase
      .from('equipment')
      .select('*, locations(location_name)')
      .order('equipment_code', { ascending: true })
    
    const { data: zones } = await (supabase as any).from('storage_zones').select('*')
    
    const zoneMap: Record<number, StorageZone[]> = {}
    zones?.forEach(z => {
      if (!zoneMap[z.equipment_id]) zoneMap[z.equipment_id] = []
      zoneMap[z.equipment_id].push(z)
    })

    setEquipment((eq || []).map(e => ({ ...e, storage_zones: zoneMap[e.id] || [] })))
    setLoading(false)
  }

  async function loadLocations() {
    const { data } = await supabase.from('locations').select('id, location_name, location_code')
    setLocations(data || [])
  }

  const generateCode = () => `EQ-${Date.now().toString(36).toUpperCase()}`

  const handleSave = async () => {
    const payload = {
      equipment_code: formData.equipment_code || generateCode(),
      equipment_name: formData.equipment_name,
      equipment_type: formData.equipment_type as any,
      status: formData.status as any,
      location_id: formData.location_id ? parseInt(formData.location_id) : null,
      serial_number: formData.serial_number || null,
      manufacturer: formData.manufacturer || null,
      model: formData.model || null,
      last_calibration_date: formData.last_calibration_date || null,
      calibration_valid_until: formData.calibration_valid_until || null,
      calibration_frequency_days: formData.calibration_frequency_days ? parseInt(formData.calibration_frequency_days) : null,
      maintenance_notes: formData.maintenance_notes || null
    }
    if (editingId) {
      await supabase.from('equipment').update(payload).eq('id', editingId)
    } else {
      await supabase.from('equipment').insert(payload)
    }
    closeModal()
    loadEquipment()
  }

  const handleEdit = (item: Equipment) => {
    setEditingId(item.id)
    setFormData({
      equipment_code: item.equipment_code,
      equipment_name: item.equipment_name,
      equipment_type: item.equipment_type,
      status: item.status,
      location_id: item.location_id?.toString() || '',
      serial_number: item.serial_number || '',
      manufacturer: item.manufacturer || '',
      model: item.model || '',
      last_calibration_date: item.last_calibration_date || '',
      calibration_valid_until: item.calibration_valid_until || '',
      calibration_frequency_days: item.calibration_frequency_days?.toString() || '',
      maintenance_notes: item.maintenance_notes || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить оборудование? Все зоны хранения будут удалены.')) return
    await supabase.from('equipment').delete().eq('id', id)
    loadEquipment()
  }

  const handleAddZone = (eq: Equipment) => {
    setSelectedEquipment(eq)
    setZoneForm({
      zone_code: `${eq.equipment_code}-Z${(eq.storage_zones?.length || 0) + 1}`,
      zone_name: '',
      zone_type: 'shelf',
      position: '',
      temperature_min: '',
      temperature_max: '',
      capacity: '100'
    })
    setShowZoneModal(true)
  }

  const handleSaveZone = async () => {
    if (!selectedEquipment) return
    await (supabase as any).from('storage_zones').insert({
      zone_code: zoneForm.zone_code,
      zone_name: zoneForm.zone_name,
      equipment_id: selectedEquipment.id,
      zone_type: zoneForm.zone_type,
      position: zoneForm.position || null,
      temperature_min: zoneForm.temperature_min ? parseFloat(zoneForm.temperature_min) : null,
      temperature_max: zoneForm.temperature_max ? parseFloat(zoneForm.temperature_max) : null,
      capacity: parseInt(zoneForm.capacity) || 100,
      current_occupancy: 0,
      status: 'active'
    })
    setShowZoneModal(false)
    loadEquipment()
  }

  const handleDeleteZone = async (zoneId: number) => {
    if (!confirm('Удалить зону хранения?')) return
    await (supabase as any).from('storage_zones').delete().eq('id', zoneId)
    loadEquipment()
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingId(null)
    setFormData({ equipment_code: '', equipment_name: '', equipment_type: 'other', status: 'operational', location_id: '', serial_number: '', manufacturer: '', model: '', last_calibration_date: '', calibration_valid_until: '', calibration_frequency_days: '', maintenance_notes: '' })
  }

  function daysUntilCalibration(validUntil: string | null) {
    if (!validUntil) return null
    const today = new Date()
    const dueDate = new Date(validUntil)
    return Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Оборудование</h1>
          <p className="text-slate-500 mt-1">Управление оборудованием и зонами хранения</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Добавить оборудование
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Загрузка...</div>
        ) : equipment.length === 0 ? (
          <div className="p-8 text-center">
            <Microscope className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500">Оборудование не найдено</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {equipment.map((item) => {
              const status = statusConfig[item.status] || statusConfig.operational
              const days = daysUntilCalibration(item.calibration_valid_until)
              const StatusIcon = status.icon
              const isExpanded = expandedId === item.id
              const canHaveZones = hasStorageZones(item.equipment_type)
              const zones = item.storage_zones || []

              return (
                <div key={item.id}>
                  <div className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      {canHaveZones ? (
                        <button 
                          onClick={() => setExpandedId(isExpanded ? null : item.id)}
                          className="p-1 hover:bg-slate-200 rounded"
                        >
                          {isExpanded ? <ChevronDown className="h-5 w-5 text-slate-400" /> : <ChevronRight className="h-5 w-5 text-slate-400" />}
                        </button>
                      ) : <div className="w-7" />}

                      <div className="flex-1 grid grid-cols-6 gap-4 items-center">
                        <div>
                          <div className="font-medium text-emerald-600">{item.equipment_code}</div>
                          <div className="text-sm text-slate-500">{typeLabels[item.equipment_type] || item.equipment_type}</div>
                        </div>
                        <div className="col-span-2">
                          <div className="text-slate-900">{item.equipment_name}</div>
                          <div className="text-xs text-slate-500">{item.manufacturer} {item.model}</div>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-slate-500">
                          <MapPin className="h-4 w-4" />
                          {item.locations?.location_name || '—'}
                        </div>
                        <div>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          {days !== null ? (
                            <span className={`text-sm ${days <= 30 ? 'text-amber-600 font-medium' : 'text-slate-500'}`}>
                              {days <= 0 ? 'Калибровка!' : `${days} дн.`}
                            </span>
                          ) : <span className="text-slate-400 text-sm">—</span>}
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleEdit(item)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Storage Zones */}
                  {isExpanded && canHaveZones && (
                    <div className="bg-slate-50 border-t border-slate-100 p-4 pl-14">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <Layers className="h-4 w-4" />
                          Зоны хранения ({zones.length})
                        </h4>
                        <button 
                          onClick={() => handleAddZone(item)}
                          className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                        >
                          <Plus className="h-4 w-4" /> Добавить зону
                        </button>
                      </div>
                      {zones.length === 0 ? (
                        <p className="text-sm text-slate-500">Зоны хранения не созданы</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {zones.map(zone => (
                            <div key={zone.id} className="bg-white border border-slate-200 rounded-lg p-3">
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="font-medium text-slate-900">{zone.zone_name}</div>
                                  <div className="text-xs text-slate-500">{zone.zone_code} • {zone.position || zone.zone_type}</div>
                                </div>
                                <button onClick={() => handleDeleteZone(zone.id)} className="p-1 text-slate-400 hover:text-red-600">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              <div className="mt-2 flex items-center justify-between text-xs">
                                <span className="text-slate-500">
                                  {zone.temperature_min}°C — {zone.temperature_max}°C
                                </span>
                                <span className="text-slate-600">
                                  {zone.current_occupancy}/{zone.capacity}
                                </span>
                              </div>
                              <div className="mt-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-emerald-500 rounded-full"
                                  style={{ width: `${Math.min(100, (zone.current_occupancy / zone.capacity) * 100)}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Equipment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{editingId ? 'Редактировать' : 'Новое оборудование'}</h2>
              <button onClick={closeModal}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Код</label>
                  <input type="text" value={formData.equipment_code} onChange={e => setFormData({...formData, equipment_code: e.target.value})} placeholder="Авто" className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Тип</label>
                  <select value={formData.equipment_type} onChange={e => setFormData({...formData, equipment_type: e.target.value})} className="w-full border rounded px-3 py-2">
                    {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Название *</label>
                <input type="text" value={formData.equipment_name} onChange={e => setFormData({...formData, equipment_name: e.target.value})} placeholder="CO2-инкубатор №1" className="w-full border rounded px-3 py-2" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Производитель</label>
                  <input type="text" value={formData.manufacturer} onChange={e => setFormData({...formData, manufacturer: e.target.value})} placeholder="Thermo Fisher" className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Модель</label>
                  <input type="text" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} className="w-full border rounded px-3 py-2" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Серийный номер</label>
                  <input type="text" value={formData.serial_number} onChange={e => setFormData({...formData, serial_number: e.target.value})} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Статус</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full border rounded px-3 py-2">
                    {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Помещение (где установлено)</label>
                <select value={formData.location_id} onChange={e => setFormData({...formData, location_id: e.target.value})} className="w-full border rounded px-3 py-2">
                  <option value="">-- Не выбрано --</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.location_name} ({l.location_code})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Калибровка до</label>
                  <input type="date" value={formData.calibration_valid_until} onChange={e => setFormData({...formData, calibration_valid_until: e.target.value})} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Период калибровки (дней)</label>
                  <input type="number" value={formData.calibration_frequency_days} onChange={e => setFormData({...formData, calibration_frequency_days: e.target.value})} placeholder="180" className="w-full border rounded px-3 py-2" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Заметки</label>
                <textarea value={formData.maintenance_notes} onChange={e => setFormData({...formData, maintenance_notes: e.target.value})} rows={2} className="w-full border rounded px-3 py-2" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={closeModal} className="px-4 py-2 border rounded hover:bg-gray-50">Отмена</button>
              <button onClick={handleSave} disabled={!formData.equipment_name} className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50">{editingId ? 'Сохранить' : 'Создать'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Zone Modal */}
      {showZoneModal && selectedEquipment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Новая зона хранения</h2>
              <button onClick={() => setShowZoneModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-slate-500 mb-4">Оборудование: {selectedEquipment.equipment_name}</p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Код зоны</label>
                  <input type="text" value={zoneForm.zone_code} onChange={e => setZoneForm({...zoneForm, zone_code: e.target.value})} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Тип</label>
                  <select value={zoneForm.zone_type} onChange={e => setZoneForm({...zoneForm, zone_type: e.target.value})} className="w-full border rounded px-3 py-2">
                    <option value="shelf">Полка</option>
                    <option value="rack">Стеллаж/Канистра</option>
                    <option value="drawer">Ящик</option>
                    <option value="section">Секция</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Название *</label>
                <input type="text" value={zoneForm.zone_name} onChange={e => setZoneForm({...zoneForm, zone_name: e.target.value})} placeholder="Полка 1" className="w-full border rounded px-3 py-2" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Позиция</label>
                  <input type="text" value={zoneForm.position} onChange={e => setZoneForm({...zoneForm, position: e.target.value})} placeholder="Top, A1, etc." className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Вместимость</label>
                  <input type="number" value={zoneForm.capacity} onChange={e => setZoneForm({...zoneForm, capacity: e.target.value})} className="w-full border rounded px-3 py-2" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Мин. темп. (°C)</label>
                  <input type="number" value={zoneForm.temperature_min} onChange={e => setZoneForm({...zoneForm, temperature_min: e.target.value})} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Макс. темп. (°C)</label>
                  <input type="number" value={zoneForm.temperature_max} onChange={e => setZoneForm({...zoneForm, temperature_max: e.target.value})} className="w-full border rounded px-3 py-2" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowZoneModal(false)} className="px-4 py-2 border rounded hover:bg-gray-50">Отмена</button>
              <button onClick={handleSaveZone} disabled={!zoneForm.zone_name} className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50">Создать</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
