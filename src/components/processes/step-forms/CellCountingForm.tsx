import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Beaker, CheckCircle, Zap, AlertTriangle, Info, Loader2 } from 'lucide-react'

type Container = {
  id: number
  container_code: string
  volume_ml: number | null
  cell_concentration: number | null
  viability_percent: number | null
}

// ЗАДАЧА 8: Benchmark параметры
type BenchmarkParams = {
  expected_viability: number
  min_viability: number
  expected_concentration: number
  min_concentration: number
}

type Props = {
  cultureId: number
  stepId: number
  ccaRules?: any // CCA правила из шага
  selectedContainerIds?: number[] // ИСПРАВЛЕНИЕ: только эти контейнеры для подсчета
  operationType?: 'passage' | 'freezing' | 'thawing' | 'observation' // Тип операции
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

export function CellCountingForm({ cultureId, stepId, ccaRules, selectedContainerIds, operationType, onDataChange }: Props) {
  const [containers, setContainers] = useState<Container[]>([])
  const [results, setResults] = useState<Record<number, ContainerResult>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false) // ЗАДАЧА 10: Loading state
  
  // ЗАДАЧА 8: Benchmark параметры из CCA правил или defaults
  const benchmark: BenchmarkParams = {
    expected_viability: ccaRules?.expected_viability || 85,
    min_viability: ccaRules?.min_viability || 75,
    expected_concentration: ccaRules?.expected_concentration || 1.0,
    min_concentration: ccaRules?.min_concentration || 0.5
  }
  
  // Quick fill values
  const [quickFill, setQuickFill] = useState({ concentration: '', viability: '', volume: '' })

  useEffect(() => {
    loadContainers()
  }, [cultureId])

  async function loadContainers() {
    // ИСПРАВЛЕНИЕ: Если указаны конкретные контейнеры - загружаем только их
    // Подсчет клеток делается только на снятых клетках (при пассаже/заморозке/разморозке)
    let query = supabase
      .from('containers')
      .select('id, container_code, volume_ml, cell_concentration, viability_percent')

    if (selectedContainerIds && selectedContainerIds.length > 0) {
      // Загружаем только выбранные контейнеры
      query = query.in('id', selectedContainerIds)
    } else {
      // Fallback: загружаем активные контейнеры культуры
      query = query.eq('culture_id', cultureId).eq('status', 'active')
    }

    const { data } = await query.order('container_code')
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

  if (loading) return <div className="text-center py-4 text-slate-500 flex items-center justify-center gap-2"><Loader2 className="h-5 w-5 animate-spin" />Загрузка контейнеров...</div>

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

  // ЗАДАЧА 9: Валидация в реальном времени
  const getViabilityStatus = (value: string) => {
    const v = parseFloat(value)
    if (!value || isNaN(v)) return 'empty'
    if (v < benchmark.min_viability) return 'fail'
    if (v < benchmark.expected_viability) return 'warning'
    return 'pass'
  }

  const getConcentrationStatus = (value: string) => {
    const c = parseFloat(value)
    if (!value || isNaN(c)) return 'empty'
    if (c < benchmark.min_concentration) return 'fail'
    if (c < benchmark.expected_concentration) return 'warning'
    return 'pass'
  }

  // Количество контейнеров с ошибками
  const failedContainers = Object.values(results).filter(r => 
    getViabilityStatus(r.viability) === 'fail' || getConcentrationStatus(r.concentration) === 'fail'
  ).length

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-lg font-semibold text-slate-800">
        <Beaker className="h-5 w-5 text-emerald-600" />
        Подсчёт клеток ({containers.length} контейнеров)
        {saving && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
      </div>

      {/* Информация о типе операции */}
      {operationType && (
        <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-3 flex items-center gap-2">
          <Info className="h-4 w-4 text-cyan-600" />
          <span className="text-sm text-cyan-800">
            {operationType === 'passage' && 'Подсчет после снятия клеток (пассаж)'}
            {operationType === 'freezing' && 'Подсчет перед замораживанием'}
            {operationType === 'thawing' && 'Подсчет после размораживания'}
            {operationType === 'observation' && 'Подсчет для мониторинга'}
          </span>
        </div>
      )}

      {/* ЗАДАЧА 8: Benchmark параметры */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Info className="h-4 w-4 text-blue-600" />
          <span className="font-medium text-blue-800">Ожидаемые параметры (CCA)</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-blue-600">Ожид. жизнесп.:</span>
            <span className="font-medium text-blue-800 ml-1">{benchmark.expected_viability}%</span>
          </div>
          <div>
            <span className="text-blue-600">Мин. жизнесп.:</span>
            <span className="font-medium text-red-600 ml-1">{benchmark.min_viability}%</span>
          </div>
          <div>
            <span className="text-blue-600">Ожид. конц.:</span>
            <span className="font-medium text-blue-800 ml-1">{benchmark.expected_concentration}×10⁶/мл</span>
          </div>
          <div>
            <span className="text-blue-600">Мин. конц.:</span>
            <span className="font-medium text-red-600 ml-1">{benchmark.min_concentration}×10⁶/мл</span>
          </div>
        </div>
      </div>

      {/* Предупреждение о failed контейнерах */}
      {failedContainers > 0 && (
        <div className="bg-red-50 border border-red-300 rounded-lg p-3 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <span className="text-red-700 font-medium">
            {failedContainers} контейнер(ов) не проходят CCA проверку
          </span>
        </div>
      )}

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
              <th className="text-left px-3 py-2 font-medium">
                Конц. ×10⁶/мл
                <span className="block text-[10px] font-normal text-slate-400">мин: {benchmark.min_concentration}</span>
              </th>
              <th className="text-left px-3 py-2 font-medium">
                Жизн. %
                <span className="block text-[10px] font-normal text-slate-400">мин: {benchmark.min_viability}%</span>
              </th>
              <th className="text-left px-3 py-2 font-medium">Объём мл</th>
              <th className="text-left px-3 py-2 font-medium">Всего клеток</th>
              <th className="text-left px-2 py-2 font-medium w-8">✓</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {containers.map(c => {
              const viabilityStatus = getViabilityStatus(results[c.id]?.viability || '')
              const concStatus = getConcentrationStatus(results[c.id]?.concentration || '')
              
              return (
                <tr key={c.id} className={`hover:bg-slate-50 ${
                  viabilityStatus === 'fail' || concStatus === 'fail' ? 'bg-red-50' : ''
                }`}>
                  <td className="px-3 py-2 font-mono text-xs">
                    {c.container_code}
                    {(viabilityStatus === 'fail' || concStatus === 'fail') && (
                      <AlertTriangle className="inline h-3 w-3 ml-1 text-red-500" />
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={results[c.id]?.concentration || ''}
                        onChange={e => updateResult(c.id, 'concentration', e.target.value)}
                        className={`w-full px-2 py-1 border rounded text-sm ${
                          concStatus === 'fail' ? 'border-red-500 bg-red-50 text-red-700' :
                          concStatus === 'warning' ? 'border-amber-400 bg-amber-50' :
                          concStatus === 'pass' ? 'border-emerald-400' : ''
                        }`}
                        placeholder={`≥${benchmark.min_concentration}`}
                      />
                      {concStatus === 'fail' && (
                        <span className="absolute -bottom-4 left-0 text-[10px] text-red-600">
                          &lt; мин. {benchmark.min_concentration}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={results[c.id]?.viability || ''}
                        onChange={e => updateResult(c.id, 'viability', e.target.value)}
                        className={`w-full px-2 py-1 border rounded text-sm ${
                          viabilityStatus === 'fail' ? 'border-red-500 bg-red-50 text-red-700' :
                          viabilityStatus === 'warning' ? 'border-amber-400 bg-amber-50' :
                          viabilityStatus === 'pass' ? 'border-emerald-400' : ''
                        }`}
                        placeholder={`≥${benchmark.min_viability}%`}
                      />
                      {viabilityStatus === 'fail' && (
                        <span className="absolute -bottom-4 left-0 text-[10px] text-red-600">
                          &lt; мин. {benchmark.min_viability}%
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
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
                  <td className="px-2 py-2">
                    {viabilityStatus === 'pass' && concStatus === 'pass' && (
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                    )}
                  </td>
                </tr>
              )
            })}
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
