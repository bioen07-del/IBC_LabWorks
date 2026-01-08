import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Plus, Search, MapPin, Thermometer, Building2, 
  ChevronRight, ChevronDown, Snowflake, X
} from 'lucide-react'

interface Location {
  id: number;
  location_code: string;
  location_name: string;
  location_type: string;
  status: string;
  parent_location_id: number | null;
  is_clean_room: boolean;
  temperature_min: number | null;
  temperature_max: number | null;
  children?: Location[];
}

const typeIcons: Record<string, React.ReactNode> = {
  room: <Building2 className="h-4 w-4" />,
  incubator: <Thermometer className="h-4 w-4" />,
  freezer: <Snowflake className="h-4 w-4" />,
  refrigerator: <Thermometer className="h-4 w-4" />,
  shelf: <MapPin className="h-4 w-4" />,
  rack: <MapPin className="h-4 w-4" />,
}

const typeLabels: Record<string, string> = {
  room: 'Помещение',
  incubator: 'Инкубатор',
  freezer: 'Морозильник',
  refrigerator: 'Холодильник',
  shelf: 'Полка',
  rack: 'Стеллаж',
}

const statusColors: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  maintenance: 'bg-amber-100 text-amber-700',
  restricted: 'bg-red-100 text-red-700',
}

const statusLabels: Record<string, string> = {
  active: 'Активна',
  maintenance: 'Обслуживание',
  restricted: 'Ограничен',
}

function LocationNode({ location, level = 0 }: { location: Location; level?: number }) {
  const [expanded, setExpanded] = useState(level < 2)
  const hasChildren = location.children && location.children.length > 0

  return (
    <div>
      <div 
        className={`flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg cursor-pointer ${level > 0 ? 'ml-6' : ''}`}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        {hasChildren ? (
          expanded ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />
        ) : <div className="w-4" />}
        
        <div className="flex items-center gap-2 text-slate-600">
          {typeIcons[location.location_type] || <MapPin className="h-4 w-4" />}
        </div>
        
        <div className="flex-1">
          <div className="font-medium text-slate-900">{location.location_name}</div>
          <div className="text-sm text-slate-500">{location.location_code} • {typeLabels[location.location_type] || location.location_type}</div>
        </div>

        {location.is_clean_room && (
          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">Чистая зона</span>
        )}

        {location.temperature_min !== null && location.temperature_max !== null && (
          <span className="text-sm text-slate-500">{location.temperature_min}°C — {location.temperature_max}°C</span>
        )}

        <span className={`px-2 py-1 text-xs font-medium rounded ${statusColors[location.status] || 'bg-gray-100'}`}>
          {statusLabels[location.status] || location.status}
        </span>
      </div>

      {expanded && hasChildren && (
        <div className="border-l-2 border-slate-100 ml-5">
          {location.children!.map(child => (
            <LocationNode key={child.id} location={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [allLocations, setAllLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    location_code: '',
    location_name: '',
    location_type: 'room',
    status: 'active',
    parent_location_id: '',
    is_clean_room: false,
    temperature_min: '',
    temperature_max: ''
  })

  useEffect(() => {
    loadLocations()
  }, [])

  async function loadLocations() {
    const { data } = await supabase.from('locations').select('*').order('location_code')
    
    const all = (data || []) as Location[]
    setAllLocations(all)

    // Build hierarchy
    const map = new Map<number, Location>()
    const roots: Location[] = []

    all.forEach(loc => map.set(loc.id, { ...loc, children: [] }))
    all.forEach(loc => {
      const node = map.get(loc.id)!
      if (loc.parent_location_id) {
        const parent = map.get(loc.parent_location_id)
        if (parent) parent.children!.push(node)
      } else {
        roots.push(node)
      }
    })

    setLocations(roots)
    setLoading(false)
  }

  const generateCode = () => `LOC-${Date.now().toString(36).toUpperCase()}`

  const handleCreate = async () => {
    await supabase.from('locations').insert({
      location_code: formData.location_code || generateCode(),
      location_name: formData.location_name,
      location_type: formData.location_type as any,
      status: formData.status as any,
      parent_location_id: formData.parent_location_id ? parseInt(formData.parent_location_id) : null,
      is_clean_room: formData.is_clean_room,
      temperature_min: formData.temperature_min ? parseFloat(formData.temperature_min) : null,
      temperature_max: formData.temperature_max ? parseFloat(formData.temperature_max) : null
    })
    setShowModal(false)
    setFormData({ location_code: '', location_name: '', location_type: 'room', status: 'active', parent_location_id: '', is_clean_room: false, temperature_min: '', temperature_max: '' })
    loadLocations()
  }

  const filteredLocations = search
    ? locations.filter(l => l.location_name.toLowerCase().includes(search.toLowerCase()) || l.location_code.toLowerCase().includes(search.toLowerCase()))
    : locations

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Локации</h1>
          <p className="text-slate-500 mt-1">Иерархия помещений и мест хранения</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Добавить локацию
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Поиск локаций..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredLocations.length === 0 ? (
            <div className="text-center py-12 text-slate-500">Локации не найдены</div>
          ) : (
            <div className="space-y-1">
              {filteredLocations.map(location => (
                <LocationNode key={location.id} location={location} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Новая локация</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Код</label>
                <input type="text" value={formData.location_code} onChange={e => setFormData({...formData, location_code: e.target.value})} placeholder="Авто" className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Название *</label>
                <input type="text" value={formData.location_name} onChange={e => setFormData({...formData, location_name: e.target.value})} className="w-full border rounded px-3 py-2" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Тип</label>
                  <select value={formData.location_type} onChange={e => setFormData({...formData, location_type: e.target.value})} className="w-full border rounded px-3 py-2">
                    {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Статус</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full border rounded px-3 py-2">
                    {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Родительская локация</label>
                <select value={formData.parent_location_id} onChange={e => setFormData({...formData, parent_location_id: e.target.value})} className="w-full border rounded px-3 py-2">
                  <option value="">-- Корневая --</option>
                  {allLocations.map(l => <option key={l.id} value={l.id}>{l.location_name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Мин. темп. (°C)</label>
                  <input type="number" value={formData.temperature_min} onChange={e => setFormData({...formData, temperature_min: e.target.value})} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Макс. темп. (°C)</label>
                  <input type="number" value={formData.temperature_max} onChange={e => setFormData({...formData, temperature_max: e.target.value})} className="w-full border rounded px-3 py-2" />
                </div>
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={formData.is_clean_room} onChange={e => setFormData({...formData, is_clean_room: e.target.checked})} />
                <span className="text-sm">Чистая зона</span>
              </label>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded hover:bg-gray-50">Отмена</button>
              <button onClick={handleCreate} disabled={!formData.location_name} className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50">Создать</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
