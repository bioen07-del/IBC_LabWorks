import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, Tables } from '@/lib/supabase'
import { 
  Plus, 
  Search, 
  Filter,
  FlaskConical,
  AlertTriangle,
  Snowflake,
  Pause,
  Trash2,
  ChevronRight
} from 'lucide-react'

type Culture = Tables<'cultures'> & {
  donations: { donation_code: string; donors: { donor_code: string } | null } | null
}

const statusConfig = {
  active: { label: 'Активна', color: 'bg-emerald-100 text-emerald-700', icon: FlaskConical },
  frozen: { label: 'Заморожена', color: 'bg-blue-100 text-blue-700', icon: Snowflake },
  hold: { label: 'На удержании', color: 'bg-amber-100 text-amber-700', icon: Pause },
  contaminated: { label: 'Контаминация', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
  disposed: { label: 'Утилизирована', color: 'bg-slate-100 text-slate-700', icon: Trash2 },
}

const riskConfig = {
  none: null,
  at_risk: { label: 'На риске', color: 'bg-amber-500 text-white' },
  critical: { label: 'Критично', color: 'bg-red-500 text-white' },
}

export function Cultures() {
  const [cultures, setCultures] = useState<Culture[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'frozen' | 'hold' | 'contaminated' | 'disposed'>('all')

  useEffect(() => {
    loadCultures()
  }, [filter])

  async function loadCultures() {
    setLoading(true)
    try {
      let query = supabase
        .from('cultures')
        .select(`
          *,
          donations (
            donation_code,
            donors (donor_code)
          )
        `)
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query

      if (error) throw error
      setCultures(data || [])
    } catch (error) {
      console.error('Error loading cultures:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Культуры</h1>
          <p className="text-slate-500 mt-1">Управление клеточными культурами</p>
        </div>
        <Link
          to="/cultures/new"
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Создать культуру
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Поиск по коду культуры..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Все статусы</option>
            <option value="active">Активные</option>
            <option value="frozen">Замороженные</option>
            <option value="hold">На удержании</option>
            <option value="contaminated">Контаминация</option>
            <option value="disposed">Утилизированные</option>
          </select>
        </div>
      </div>

      {/* Cultures List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Загрузка...</div>
        ) : cultures.length === 0 ? (
          <div className="p-8 text-center">
            <FlaskConical className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500">Культуры не найдены</p>
            <Link
              to="/cultures/new"
              className="inline-flex items-center gap-2 mt-4 text-emerald-600 hover:text-emerald-700"
            >
              <Plus className="h-4 w-4" />
              Создать первую культуру
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Код культуры
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Тип клеток
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Пассаж
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Донор
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Статус
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Риск
                </th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {cultures.map((culture) => {
                const status = statusConfig[culture.status as keyof typeof statusConfig]
                const risk = culture.risk_flag ? riskConfig[culture.risk_flag as keyof typeof riskConfig] : null

                return (
                  <tr key={culture.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <Link 
                        to={`/cultures/${culture.id}`}
                        className="font-medium text-emerald-600 hover:text-emerald-700"
                      >
                        {culture.culture_code}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-slate-700">{culture.cell_type}</td>
                    <td className="px-6 py-4 text-slate-700">P{culture.current_passage}</td>
                    <td className="px-6 py-4 text-slate-500">
                      {culture.donations?.donors?.donor_code || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        <status.icon className="h-3 w-3" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {risk && (
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${risk.color}`}>
                          <AlertTriangle className="h-3 w-3" />
                          {risk.label}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Link to={`/cultures/${culture.id}`}>
                        <ChevronRight className="h-5 w-5 text-slate-400" />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
