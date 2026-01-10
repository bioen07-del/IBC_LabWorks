import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Beaker, CheckCircle, Zap } from 'lucide-react'

type Container = {
  id: number
  container_code: string
  volume_ml: number | null
  cell_concentration: number | null
  viability_percent: number | null
}

type Props = {
  cultureId: number
  stepId: number
  onDataChange: (data: { containers: ContainerResult[], totalCells: number, avgViability: number }) => void
}

type ContainerResult = {
  container_id: number
  container_code: string
  concentration: string
  viability: string
  volume: string
  total_cells: number
}

export function CellCountingForm({ cultureId, stepId, onDataChange }: Props) {
  const [containers, setContainers] = useState<Container[]>([])
  const [results, setResults] = useState<Record<number, ContainerResult>>({})
  const [loading, setLoading] = useState(true)
  
  // Quick fill values
  const [quickFill, setQuickFill] = useState({ concentration: '', viability: '', volume: '' })

  useEffect(() => {
    loadContainers()
  }, [cultureId])

  async function loadContainers() {
    const { data } = await supabase
      .from('containers')
      .select('id, container_code, volume_ml, cell_concentration, viability_percent')
      .eq('culture_id', cultureId)
      .eq('status', 'active')
      .order('container_code')
    
    setContainers(data || [])
    
    // Initialize results with existing data
    const initial: Record<number, ContainerResult> = {}
    ;(data || []).forEach(c => {
      initial[c.id] = {
        container_id: c.id,
        container_code: c.container_code,
        concentration: c.cell_concentration?.toString() || '',
        viability: c.viability_percent?.toString() || '',
        volume: c.volume_ml?.toString() || '',
        total_cells: 0
      }
    })
    setResults(initial)
    setLoading(false)
  }

  function updateResult(containerId: number, field: keyof ContainerResult, value: string) {
    setResults(prev => {
      const updated = { ...prev }
      updated[containerId] = { ...updated[containerId], [field]: value }
      
      // Calculate total cells
      const conc = parseFloat(updated[containerId].concentration) || 0
      const vol = parseFloat(updated[containerId].volume) || 0
      updated[containerId].total_cells = conc * vol * 1000000 // concentration in ×10⁶/ml
      
      // Notify parent
      const allResults = Object.values(updated)
      const totalCells = allResults.reduce((sum, r) => sum + r.total_cells, 0)
      const validViabilities = allResults.filter(r => parseFloat(r.viability) > 0)
      const avgViability = validViabilities.length > 0
        ? validViabilities.reduce((sum, r) => sum + parseFloat(r.viability), 0) / validViabilities.length
        : 0
      
      onDataChange({ containers: allResults, totalCells, avgViability })
      
      return updated
    })
  }

  function applyQuickFill() {
    setResults(prev => {
      const updated = { ...prev }
      Object.keys(updated).forEach(id => {
        const containerId = parseInt(id)
        if (quickFill.concentration) updated[containerId].concentration = quickFill.concentration
        if (quickFill.viability) updated[containerId].viability = quickFill.viability
        if (quickFill.volume) updated[containerId].volume = quickFill.volume
        
        // Recalculate total
        const conc = parseFloat(updated[containerId].concentration) || 0
        const vol = parseFloat(updated[containerId].volume) || 0
        updated[containerId].total_cells = conc * vol * 1000000
      })
      
      // Notify parent
      const allResults = Object.values(updated)
      const totalCells = allResults.reduce((sum, r) => sum + r.total_cells, 0)
      const validViabilities = allResults.filter(r => parseFloat(r.viability) > 0)
      const avgViability = validViabilities.length > 0
        ? validViabilities.reduce((sum, r) => sum + parseFloat(r.viability), 0) / validViabilities.length
        : 0
      
      onDataChange({ containers: allResults, totalCells, avgViability })
      
      return updated
    })
  }

  if (loading) return <div className="text-center py-4 text-slate-500">Загрузка контейнеров...</div>

  if (containers.length === 0) {
    return (
      <div className="text-center py-4 text-amber-600 bg-amber-50 rounded-lg">
        Нет активных контейнеров для подсчёта
      </div>
    )
  }

  const totalCells = Object.values(results).reduce((sum, r) => sum + r.total_cells, 0)
  const validViabilities = Object.values(results).filter(r => parseFloat(r.viability) > 0)
  const avgViability = validViabilities.length > 0
    ? validViabilities.reduce((sum, r) => sum + parseFloat(r.viability), 0) / validViabilities.length
    : 0

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-lg font-semibold text-slate-800">
        <Beaker className="h-5 w-5 text-emerald-600" />
        Подсчёт клеток ({containers.length} контейнеров)
      </div>

      {/* Quick Fill */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4 text-amber-600" />
          <span className="font-medium text-amber-800">Быстрый ввод</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <input
            type="number"
            step="0.1"
            placeholder="Конц. ×10⁶/мл"
            value={quickFill.concentration}
            onChange={e => setQuickFill({ ...quickFill, concentration: e.target.value })}
            className="px-2 py-1.5 border rounded text-sm"
          />
          <input
            type="number"
            step="0.1"
            placeholder="Жизн. %"
            value={quickFill.viability}
            onChange={e => setQuickFill({ ...quickFill, viability: e.target.value })}
            className="px-2 py-1.5 border rounded text-sm"
          />
          <input
            type="number"
            step="0.1"
            placeholder="Объём мл"
            value={quickFill.volume}
            onChange={e => setQuickFill({ ...quickFill, volume: e.target.value })}
            className="px-2 py-1.5 border rounded text-sm"
          />
          <button
            onClick={applyQuickFill}
            className="px-3 py-1.5 bg-amber-600 text-white rounded text-sm hover:bg-amber-700"
          >
            Применить ко всем
          </button>
        </div>
      </div>

      {/* Container Table */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left px-3 py-2 font-medium">Контейнер</th>
              <th className="text-left px-3 py-2 font-medium">Конц. ×10⁶/мл</th>
              <th className="text-left px-3 py-2 font-medium">Жизн. %</th>
              <th className="text-left px-3 py-2 font-medium">Объём мл</th>
              <th className="text-left px-3 py-2 font-medium">Всего клеток</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {containers.map(c => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-3 py-2 font-mono text-xs">{c.container_code}</td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    step="0.01"
                    value={results[c.id]?.concentration || ''}
                    onChange={e => updateResult(c.id, 'concentration', e.target.value)}
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    step="0.1"
                    value={results[c.id]?.viability || ''}
                    onChange={e => updateResult(c.id, 'viability', e.target.value)}
                    className={`w-full px-2 py-1 border rounded text-sm ${
                      parseFloat(results[c.id]?.viability || '0') < 80 && results[c.id]?.viability
                        ? 'border-red-500 bg-red-50'
                        : ''
                    }`}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    step="0.1"
                    value={results[c.id]?.volume || ''}
                    onChange={e => updateResult(c.id, 'volume', e.target.value)}
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                </td>
                <td className="px-3 py-2 text-slate-600">
                  {results[c.id]?.total_cells > 0 
                    ? `${(results[c.id].total_cells / 1000000).toFixed(2)}M`
                    : '-'
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-emerald-50 rounded-lg p-3">
          <p className="text-xs text-emerald-600">Всего клеток</p>
          <p className="text-xl font-bold text-emerald-700">
            {totalCells > 0 ? `${(totalCells / 1000000).toFixed(2)}M` : '-'}
          </p>
        </div>
        <div className={`rounded-lg p-3 ${avgViability >= 80 ? 'bg-emerald-50' : 'bg-red-50'}`}>
          <p className={`text-xs ${avgViability >= 80 ? 'text-emerald-600' : 'text-red-600'}`}>
            Ср. жизнеспособность
          </p>
          <p className={`text-xl font-bold ${avgViability >= 80 ? 'text-emerald-700' : 'text-red-700'}`}>
            {avgViability > 0 ? `${avgViability.toFixed(1)}%` : '-'}
          </p>
        </div>
      </div>
    </div>
  )
}
