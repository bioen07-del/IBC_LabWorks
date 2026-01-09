import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Plus, 
  Search, 
  Microscope,
  AlertCircle,
  CheckCircle,
  Wrench,
  QrCode,
  X,
  Pencil,
  Trash2
} from 'lucide-react'

interface Equipment {
  id: number;
  equipment_code: string;
  equipment_name: string;
  equipment_type: string;
  status: string;
  location_id: number | null;
  calibration_valid_until: string | null;
  locations?: { location_name: string } | null;
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
  freezer: 'Морозильник',
  other: 'Другое',
}

export function EquipmentPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    equipment_code: '',
    equipment_name: '',
    equipment_type: 'other',
    status: 'operational',
    location_id: '',
    calibration_valid_until: ''
  })

  useEffect(() => {
    loadEquipment()
    loadLocations()
  }, [])

  async function loadEquipment() {
    setLoading(true)
    const { data } = await supabase
      .from('equipment')
      .select('*, locations(location_name)')
      .order('equipment_code', { ascending: true })
    setEquipment((data || []) as Equipment[])
    setLoading(false)
  }

  async function loadLocations() {
    const { data } = await supabase.from('locations').select('id, location_name')
    setLocations(data || [])
  }

  const generateCode = () => {
    return `EQ-${Date.now().toString(36).toUpperCase()}`
  }

  const handleSave = async () => {
    const payload = {
      equipment_code: formData.equipment_code || generateCode(),
      equipment_name: formData.equipment_name,
      equipment_type: formData.equipment_type as any,
      status: formData.status as any,
      location_id: formData.location_id ? parseInt(formData.location_id) : null,
      calibration_valid_until: formData.calibration_valid_until || null
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
      calibration_valid_until: item.calibration_valid_until || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить оборудование?')) return
    await supabase.from('equipment').delete().eq('id', id)
    loadEquipment()
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingId(null)
    setFormData({ equipment_code: '', equipment_name: '', equipment_type: 'other', status: 'operational', location_id: '', calibration_valid_until: '' })
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
          <p className="text-slate-500 mt-1">Управление лабораторным оборудованием</p>
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
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Код</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Название</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Тип</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Локация</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Статус</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Калибровка</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {equipment.map((item) => {
                const status = statusConfig[item.status] || statusConfig.operational
                const days = daysUntilCalibration(item.calibration_valid_until)
                const StatusIcon = status.icon

                return (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-emerald-600">{item.equipment_code}</td>
                    <td className="px-6 py-4 text-slate-700">{item.equipment_name}</td>
                    <td className="px-6 py-4 text-slate-700">{typeLabels[item.equipment_type] || item.equipment_type}</td>
                    <td className="px-6 py-4 text-slate-500">{item.locations?.location_name || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {days !== null ? (
                        <span className={`text-sm ${days <= 30 ? 'text-amber-600 font-medium' : 'text-slate-500'}`}>
                          {days <= 0 ? 'Просрочена!' : `${days} дн.`}
                        </span>
                      ) : <span className="text-slate-400">-</span>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{editingId ? 'Редактировать' : 'Новое оборудование'}</h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Код</label>
                <input
                  type="text"
                  value={formData.equipment_code}
                  onChange={e => setFormData({...formData, equipment_code: e.target.value})}
                  placeholder="Авто-генерация"
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Название *</label>
                <input
                  type="text"
                  value={formData.equipment_name}
                  onChange={e => setFormData({...formData, equipment_name: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Тип</label>
                  <select
                    value={formData.equipment_type}
                    onChange={e => setFormData({...formData, equipment_type: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                  >
                    {Object.entries(typeLabels).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Статус</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                  >
                    {Object.entries(statusConfig).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Локация</label>
                <select
                  value={formData.location_id}
                  onChange={e => setFormData({...formData, location_id: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">-- Не выбрано --</option>
                  {locations.map(l => (
                    <option key={l.id} value={l.id}>{l.location_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Калибровка до</label>
                <input
                  type="date"
                  value={formData.calibration_valid_until}
                  onChange={e => setFormData({...formData, calibration_valid_until: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={closeModal} className="px-4 py-2 border rounded hover:bg-gray-50">
                Отмена
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.equipment_name}
                className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50"
              >
                {editingId ? 'Сохранить' : 'Создать'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
