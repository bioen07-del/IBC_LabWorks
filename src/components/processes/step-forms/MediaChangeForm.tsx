import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Droplets, Calculator } from 'lucide-react'

type MediaBatch = {
  id: number
  batch_code: string
  expiry_date: string | null
  media_recipes: { recipe_name: string } | null
}

type Props = {
  cultureId: number
  onDataChange: (data: { media_batch_id: number | null, volume_used: number, pdt: number | null }) => void
}

export function MediaChangeForm({ cultureId, onDataChange }: Props) {
  const [mediaBatches, setMediaBatches] = useState<MediaBatch[]>([])
  const [selectedBatch, setSelectedBatch] = useState<number | null>(null)
  const [volumeUsed, setVolumeUsed] = useState('')
  const [previousCount, setPreviousCount] = useState('')
  const [currentCount, setCurrentCount] = useState('')
  const [daysBetween, setDaysBetween] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMediaBatches()
  }, [])

  async function loadMediaBatches() {
    const { data } = await supabase
      .from('combined_media_batches')
      .select('id, batch_code, expiry_date, media_recipes(recipe_name)')
      .eq('status', 'active')
      .gte('expiry_date', new Date().toISOString().split('T')[0])
      .order('expiry_date')
    
    setMediaBatches(data || [])
    setLoading(false)
  }

  // Calculate PDT (Population Doubling Time)
  function calculatePDT(): number | null {
    const prev = parseFloat(previousCount)
    const curr = parseFloat(currentCount)
    const days = parseFloat(daysBetween)
    
    if (prev > 0 && curr > prev && days > 0) {
      const doublings = Math.log2(curr / prev)
      return days / doublings
    }
    return null
  }

  function handleChange(field: string, value: string) {
    if (field === 'batch') {
      setSelectedBatch(value ? parseInt(value) : null)
    } else if (field === 'volume') {
      setVolumeUsed(value)
    } else if (field === 'prevCount') {
      setPreviousCount(value)
    } else if (field === 'currCount') {
      setCurrentCount(value)
    } else if (field === 'days') {
      setDaysBetween(value)
    }
    
    // Notify parent
    setTimeout(() => {
      const pdt = calculatePDT()
      onDataChange({
        media_batch_id: field === 'batch' ? (value ? parseInt(value) : null) : selectedBatch,
        volume_used: field === 'volume' ? parseFloat(value) || 0 : parseFloat(volumeUsed) || 0,
        pdt
      })
    }, 0)
  }

  const pdt = calculatePDT()

  if (loading) return <div className="text-center py-4 text-slate-500">Загрузка...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-lg font-semibold text-slate-800">
        <Droplets className="h-5 w-5 text-blue-600" />
        Смена среды
      </div>

      {/* Media Selection */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <label className="block text-sm font-medium text-blue-800 mb-2">Партия среды *</label>
        <select
          value={selectedBatch || ''}
          onChange={e => handleChange('batch', e.target.value)}
          className="w-full px-3 py-2 border rounded-lg"
        >
          <option value="">Выберите партию</option>
          {mediaBatches.map(m => (
            <option key={m.id} value={m.id}>
              {m.batch_code} - {m.media_recipes?.recipe_name}
              {m.expiry_date && ` (до ${new Date(m.expiry_date).toLocaleDateString('ru')})`}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Объём использованной среды (мл)</label>
        <input
          type="number"
          step="0.1"
          value={volumeUsed}
          onChange={e => handleChange('volume', e.target.value)}
          className="w-full px-3 py-2 border rounded-lg"
          placeholder="напр. 50"
        />
      </div>

      {/* PDT Calculator */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calculator className="h-4 w-4 text-purple-600" />
          <span className="font-medium text-purple-800">Расчёт PDT (Population Doubling Time)</span>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1">Предыдущий подсчёт (×10⁶)</label>
            <input
              type="number"
              step="0.01"
              value={previousCount}
              onChange={e => handleChange('prevCount', e.target.value)}
              className="w-full px-2 py-1.5 border rounded text-sm"
              placeholder="напр. 1.5"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Текущий подсчёт (×10⁶)</label>
            <input
              type="number"
              step="0.01"
              value={currentCount}
              onChange={e => handleChange('currCount', e.target.value)}
              className="w-full px-2 py-1.5 border rounded text-sm"
              placeholder="напр. 6.0"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Дней между</label>
            <input
              type="number"
              step="0.5"
              value={daysBetween}
              onChange={e => handleChange('days', e.target.value)}
              className="w-full px-2 py-1.5 border rounded text-sm"
              placeholder="напр. 3"
            />
          </div>
        </div>

        {pdt !== null && (
          <div className="mt-3 p-2 bg-purple-100 rounded text-center">
            <span className="text-sm text-purple-700">PDT = </span>
            <span className="text-lg font-bold text-purple-800">{pdt.toFixed(2)} дней</span>
          </div>
        )}
      </div>
    </div>
  )
}
