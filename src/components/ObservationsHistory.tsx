// ТЗ 3.3.7: Таблица истории наблюдений за культурой
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Eye, AlertTriangle, Calendar, RefreshCw } from 'lucide-react'

type Observation = {
  id: number
  observation_date: string
  confluence_percent: number | null
  morphology_description: string | null
  contamination_detected: boolean
  contamination_type: string | null
  notes: string | null
  containers: { container_code: string } | null
  users: { full_name: string } | null
  created_at: string
}

type Props = {
  cultureId: number
  refreshTrigger?: number
}

export function ObservationsHistory({ cultureId, refreshTrigger }: Props) {
  const [observations, setObservations] = useState<Observation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadObservations()
  }, [cultureId, refreshTrigger])

  async function loadObservations() {
    setLoading(true)
    try {
      const { data, error } = await (supabase
        .from('observations' as any)
        .select(`
          *,
          containers (container_code),
          users:recorded_by_user_id (full_name)
        `) as any)
        .eq('culture_id', cultureId)
        .order('observation_date', { ascending: false })
        .limit(20)

      if (error) throw error
      setObservations((data || []) as Observation[])
    } catch (error) {
      console.error('Error loading observations:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-5 w-5 animate-spin text-slate-400" />
      </div>
    )
  }

  if (observations.length === 0) {
    return (
      <div className="text-center py-8">
        <Eye className="h-10 w-10 mx-auto mb-3 text-slate-300" />
        <p className="text-slate-500 font-medium">Наблюдения не записаны</p>
        <p className="text-sm text-slate-400 mt-1">
          Добавьте первое наблюдение для отслеживания состояния культуры
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-3 px-2 font-medium text-slate-600">Дата</th>
            <th className="text-left py-3 px-2 font-medium text-slate-600">Контейнер</th>
            <th className="text-left py-3 px-2 font-medium text-slate-600">Конфлюэнтность</th>
            <th className="text-left py-3 px-2 font-medium text-slate-600">Контаминация</th>
            <th className="text-left py-3 px-2 font-medium text-slate-600">Морфология</th>
            <th className="text-left py-3 px-2 font-medium text-slate-600">Записал</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {observations.map(obs => (
            <tr key={obs.id} className="hover:bg-slate-50">
              <td className="py-3 px-2">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-slate-400" />
                  {new Date(obs.observation_date).toLocaleDateString('ru')}
                </div>
              </td>
              <td className="py-3 px-2">
                {obs.containers?.container_code || (
                  <span className="text-slate-400 italic">Вся культура</span>
                )}
              </td>
              <td className="py-3 px-2">
                {obs.confluence_percent !== null ? (
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-slate-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          obs.confluence_percent >= 80 ? 'bg-emerald-500' :
                          obs.confluence_percent >= 50 ? 'bg-amber-500' :
                          'bg-slate-400'
                        }`}
                        style={{ width: `${obs.confluence_percent}%` }}
                      />
                    </div>
                    <span className="font-medium">{obs.confluence_percent}%</span>
                  </div>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </td>
              <td className="py-3 px-2">
                {obs.contamination_detected ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                    <AlertTriangle className="h-3 w-3" />
                    {obs.contamination_type === 'bacterial' && 'Бактериальная'}
                    {obs.contamination_type === 'fungal' && 'Грибковая'}
                    {obs.contamination_type === 'mycoplasma' && 'Микоплазма'}
                    {obs.contamination_type === 'unknown' && 'Неизвестно'}
                    {!obs.contamination_type && 'Да'}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-emerald-600 text-xs">
                    ✓ Нет
                  </span>
                )}
              </td>
              <td className="py-3 px-2 max-w-xs truncate" title={obs.morphology_description || ''}>
                {obs.morphology_description || <span className="text-slate-400">—</span>}
              </td>
              <td className="py-3 px-2 text-slate-500">
                {obs.users?.full_name || 'N/A'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
