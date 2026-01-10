import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Snowflake, Package } from 'lucide-react'

type Container = {
  id: number
  container_code: string
  status: string
}

type Location = {
  id: number
  location_code: string
  location_name: string
}

type Props = {
  cultureId: number
  onDataChange: (data: BankingData) => void
}

type BankingData = {
  bank_type: 'mcb' | 'wcb'
  vial_count: number
  source_containers: number[]
  location_id: number | null
  cryopreservation_media: string
  freezing_rate: string
  storage_temperature: string
}

export function BankingForm({ cultureId, onDataChange }: Props) {
  const [containers, setContainers] = useState<Container[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  
  const [bankType, setBankType] = useState<'mcb' | 'wcb'>('wcb')
  const [vialCount, setVialCount] = useState(10)
  const [selectedContainers, setSelectedContainers] = useState<number[]>([])
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null)
  const [cryoMedia, setCryoMedia] = useState('DMSO 10%')
  const [freezingRate, setFreezingRate] = useState('-1°C/min')
  const [storageTemp, setStorageTemp] = useState('-196°C (LN2)')

  useEffect(() => {
    loadData()
  }, [cultureId])

  async function loadData() {
    const [{ data: containersData }, { data: locationsData }] = await Promise.all([
      supabase
        .from('containers')
        .select('id, container_code, status')
        .eq('culture_id', cultureId)
        .eq('status', 'active'),
      supabase
        .from('locations')
        .select('id, location_code, location_name')
        .ilike('location_code', '%CRYO%')
        .order('location_code')
    ])
    
    setContainers(containersData || [])
    setLocations(locationsData || [])
    setLoading(false)
  }

  function notifyChange(updates: Partial<BankingData> = {}) {
    onDataChange({
      bank_type: updates.bank_type ?? bankType,
      vial_count: updates.vial_count ?? vialCount,
      source_containers: updates.source_containers ?? selectedContainers,
      location_id: updates.location_id ?? selectedLocation,
      cryopreservation_media: updates.cryopreservation_media ?? cryoMedia,
      freezing_rate: updates.freezing_rate ?? freezingRate,
      storage_temperature: updates.storage_temperature ?? storageTemp
    })
  }

  function toggleContainer(id: number) {
    const updated = selectedContainers.includes(id)
      ? selectedContainers.filter(c => c !== id)
      : [...selectedContainers, id]
    setSelectedContainers(updated)
    notifyChange({ source_containers: updated })
  }

  if (loading) return <div className="text-center py-4 text-slate-500">Загрузка...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-lg font-semibold text-slate-800">
        <Snowflake className="h-5 w-5 text-blue-600" />
        Банкирование (криоконсервация)
      </div>

      {/* Bank Type */}
      <div>
        <label className="block text-sm font-medium mb-2">Тип банка *</label>
        <div className="flex gap-2">
          <button
            onClick={() => { setBankType('mcb'); notifyChange({ bank_type: 'mcb' }) }}
            className={`flex-1 px-4 py-3 rounded-lg border ${
              bankType === 'mcb' 
                ? 'bg-blue-100 border-blue-500 text-blue-700' 
                : 'border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="font-medium">MCB</div>
            <div className="text-xs text-slate-500">Master Cell Bank</div>
          </button>
          <button
            onClick={() => { setBankType('wcb'); notifyChange({ bank_type: 'wcb' }) }}
            className={`flex-1 px-4 py-3 rounded-lg border ${
              bankType === 'wcb' 
                ? 'bg-blue-100 border-blue-500 text-blue-700' 
                : 'border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="font-medium">WCB</div>
            <div className="text-xs text-slate-500">Working Cell Bank</div>
          </button>
        </div>
      </div>

      {/* Source Containers */}
      <div>
        <label className="block text-sm font-medium mb-2">Исходные контейнеры *</label>
        {containers.length === 0 ? (
          <div className="text-amber-600 bg-amber-50 p-3 rounded-lg text-sm">
            Нет активных контейнеров
          </div>
        ) : (
          <div className="border rounded-lg p-2 max-h-32 overflow-y-auto space-y-1">
            {containers.map(c => (
              <label key={c.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedContainers.includes(c.id)}
                  onChange={() => toggleContainer(c.id)}
                  className="h-4 w-4 rounded"
                />
                <span className="font-mono text-sm">{c.container_code}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Vial Count */}
      <div>
        <label className="block text-sm font-medium mb-1">Количество криовиал *</label>
        <input
          type="number"
          min={1}
          max={100}
          value={vialCount}
          onChange={e => { setVialCount(parseInt(e.target.value) || 1); notifyChange({ vial_count: parseInt(e.target.value) || 1 }) }}
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>

      {/* Storage Location */}
      <div>
        <label className="block text-sm font-medium mb-1">Локация хранения</label>
        <select
          value={selectedLocation || ''}
          onChange={e => { 
            const val = e.target.value ? parseInt(e.target.value) : null
            setSelectedLocation(val)
            notifyChange({ location_id: val })
          }}
          className="w-full px-3 py-2 border rounded-lg"
        >
          <option value="">Выберите локацию</option>
          {locations.map(l => (
            <option key={l.id} value={l.id}>{l.location_code} - {l.location_name}</option>
          ))}
        </select>
      </div>

      {/* Parameters */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1">Криосреда</label>
          <select 
            value={cryoMedia} 
            onChange={e => { setCryoMedia(e.target.value); notifyChange({ cryopreservation_media: e.target.value }) }}
            className="w-full px-2 py-1.5 border rounded text-sm"
          >
            <option>DMSO 10%</option>
            <option>DMSO 5%</option>
            <option>Glycerol 10%</option>
            <option>CryoStor CS10</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Скорость заморозки</label>
          <select 
            value={freezingRate} 
            onChange={e => { setFreezingRate(e.target.value); notifyChange({ freezing_rate: e.target.value }) }}
            className="w-full px-2 py-1.5 border rounded text-sm"
          >
            <option>-1°C/min</option>
            <option>-0.5°C/min</option>
            <option>-2°C/min</option>
            <option>Быстрая (прямо в LN2)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Температура хранения</label>
          <select 
            value={storageTemp} 
            onChange={e => { setStorageTemp(e.target.value); notifyChange({ storage_temperature: e.target.value }) }}
            className="w-full px-2 py-1.5 border rounded text-sm"
          >
            <option>-196°C (LN2)</option>
            <option>-150°C (LN2 vapor)</option>
            <option>-80°C (ULT freezer)</option>
          </select>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-blue-600" />
          <span className="font-medium text-blue-800">Итог:</span>
        </div>
        <p className="text-sm text-blue-700 mt-1">
          {vialCount} криовиал {bankType.toUpperCase()} из {selectedContainers.length} контейнер(ов)
        </p>
      </div>
    </div>
  )
}
