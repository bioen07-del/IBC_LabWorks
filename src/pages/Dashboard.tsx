import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Link } from 'react-router-dom'
import { 
  FlaskConical, 
  ShoppingCart, 
  AlertTriangle, 
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Activity,
  Snowflake
} from 'lucide-react'

interface Stats {
  activeCultures: number
  ordersInProgress: number
  openDeviations: number
  todayTasks: number
  pendingDonations: number
  expiringItems: number
}

interface CultureStatusData {
  status: string
  label: string
  count: number
  color: string
}

interface TaskItem {
  id: number
  task_code: string
  title: string
  priority: string
  due_date: string | null
  status: string
  cultures?: { culture_code: string } | null
  deviations?: { deviation_code: string } | null
}

interface DeviationItem {
  id: number
  deviation_code: string
  description: string
  severity: string
  status: string
  cultures?: { culture_code: string } | null
  containers?: { container_code: string } | null
}

const CULTURE_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  active: { label: 'Активные', color: '#10b981' },
  frozen: { label: 'Замороженные', color: '#3b82f6' },
  hold: { label: 'На удержании', color: '#f59e0b' },
  contaminated: { label: 'Контаминация', color: '#ef4444' },
  disposed: { label: 'Утилизированы', color: '#6b7280' }
}

export function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    activeCultures: 0,
    ordersInProgress: 0,
    openDeviations: 0,
    todayTasks: 0,
    pendingDonations: 0,
    expiringItems: 0
  })
  const [loading, setLoading] = useState(true)
  const [cultureStatusData, setCultureStatusData] = useState<CultureStatusData[]>([])
  const [recentTasks, setRecentTasks] = useState<TaskItem[]>([])
  const [recentDeviations, setRecentDeviations] = useState<DeviationItem[]>([])
  const [weeklyStats, setWeeklyStats] = useState({ passages: 0, freezings: 0 })

  useEffect(() => {
    loadStats()
    loadCultureStatusChart()
    loadWeeklyActivity()
    loadRecentTasks()
    loadRecentDeviations()
  }, [])

  async function loadStats() {
    try {
      const today = new Date().toISOString().split('T')[0]
      const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      
      const [cultures, orders, deviations, tasks, donations, expiring] = await Promise.all([
        supabase.from('cultures').select('id', { count: 'exact' }).eq('status', 'active'),
        supabase.from('orders').select('id', { count: 'exact' }).eq('status', 'in_production'),
        supabase.from('deviations').select('id', { count: 'exact' }).eq('status', 'open'),
        supabase.from('tasks').select('id', { count: 'exact' }).eq('status', 'pending').lte('due_date', today),
        supabase.from('donations').select('id', { count: 'exact' }).eq('status', 'received'),
        supabase.from('inventory_items').select('id', { count: 'exact' }).eq('status', 'active').lte('expiry_date', weekFromNow)
      ])

      setStats({
        activeCultures: cultures.count || 0,
        ordersInProgress: orders.count || 0,
        openDeviations: deviations.count || 0,
        todayTasks: tasks.count || 0,
        pendingDonations: donations.count || 0,
        expiringItems: expiring.count || 0
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadCultureStatusChart() {
    const { data } = await supabase.from('cultures').select('status')
    if (!data) return
    
    const counts: Record<string, number> = {}
    data.forEach(c => {
      counts[c.status] = (counts[c.status] || 0) + 1
    })
    
    const chartData: CultureStatusData[] = Object.entries(counts)
      .filter(([_, v]) => v > 0)
      .map(([status, count]) => ({
        status,
        label: CULTURE_STATUS_CONFIG[status]?.label || status,
        count,
        color: CULTURE_STATUS_CONFIG[status]?.color || '#6b7280'
      }))
      .sort((a, b) => b.count - a.count)
    
    setCultureStatusData(chartData)
  }

  async function loadWeeklyActivity() {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    
    const { data: history } = await supabase
      .from('culture_history')
      .select('action')
      .gte('performed_at', weekAgo)
      .in('action', ['Пассирование', 'Заморозка'])
    
    if (history) {
      const passages = history.filter(h => h.action === 'Пассирование').length
      const freezings = history.filter(h => h.action === 'Заморозка').length
      setWeeklyStats({ passages, freezings })
    }
  }

  async function loadRecentTasks() {
    const { data } = await supabase
      .from('tasks')
      .select(`
        id, task_code, title, priority, due_date, status,
        cultures(culture_code),
        deviations(deviation_code)
      `)
      .in('status', ['pending', 'in_progress'])
      .order('due_date', { ascending: true })
      .limit(5)

    setRecentTasks(data || [])
  }

  async function loadRecentDeviations() {
    const { data } = await supabase
      .from('deviations')
      .select(`
        id, deviation_code, description, severity, status,
        cultures(culture_code),
        containers(container_code)
      `)
      .eq('status', 'open')
      .order('detected_at', { ascending: false })
      .limit(5)

    setRecentDeviations(data || [])
  }

  const statCards = [
    { 
      title: 'Активных культур', 
      value: stats.activeCultures, 
      icon: FlaskConical, 
      color: 'bg-emerald-500',
      link: '/cultures'
    },
    { 
      title: 'Заказов в производстве', 
      value: stats.ordersInProgress, 
      icon: ShoppingCart, 
      color: 'bg-blue-500',
      link: '/orders'
    },
    { 
      title: 'Открытых отклонений', 
      value: stats.openDeviations, 
      icon: AlertTriangle, 
      color: stats.openDeviations > 0 ? 'bg-amber-500' : 'bg-slate-400',
      link: '/deviations'
    },
    { 
      title: 'Задач на сегодня', 
      value: stats.todayTasks, 
      icon: Clock, 
      color: stats.todayTasks > 0 ? 'bg-purple-500' : 'bg-slate-400',
      link: '/tasks'
    },
    { 
      title: 'Донаций ожидает QP', 
      value: stats.pendingDonations, 
      icon: CheckCircle2, 
      color: stats.pendingDonations > 0 ? 'bg-orange-500' : 'bg-slate-400',
      link: '/donors'
    },
    { 
      title: 'Истекает за 7 дней', 
      value: stats.expiringItems, 
      icon: AlertCircle, 
      color: stats.expiringItems > 0 ? 'bg-red-500' : 'bg-slate-400',
      link: '/inventory'
    },
  ]

  const priorityColors: Record<string, string> = {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-gray-100 text-gray-800'
  }

  const severityColors: Record<string, string> = {
    critical: 'bg-red-100 text-red-800',
    major: 'bg-orange-100 text-orange-800',
    minor: 'bg-yellow-100 text-yellow-800'
  }

  const totalCultures = cultureStatusData.reduce((sum, d) => sum + d.count, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Главная панель</h1>
        <p className="text-slate-500 mt-1">Обзор состояния производства</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <Link key={card.title} to={card.link} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className={`p-3 rounded-lg ${card.color}`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
              <ArrowRight className="h-4 w-4 text-slate-300" />
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-slate-900">
                {loading ? '...' : card.value}
              </p>
              <p className="text-sm text-slate-500 mt-1">{card.title}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Culture Status Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Статусы культур</h2>
          {cultureStatusData.length > 0 ? (
            <div className="space-y-3">
              {cultureStatusData.map(item => (
                <div key={item.status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">{item.label}</span>
                    <span className="font-medium">{item.count} ({Math.round(item.count / totalCultures * 100)}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3">
                    <div 
                      className="h-3 rounded-full transition-all"
                      style={{ 
                        width: `${(item.count / totalCultures) * 100}%`,
                        backgroundColor: item.color
                      }}
                    />
                  </div>
                </div>
              ))}
              <div className="text-center text-sm text-slate-500 mt-4">
                Всего культур: {totalCultures}
              </div>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-slate-400">
              Нет данных о культурах
            </div>
          )}
        </div>

        {/* Weekly Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Активность за неделю</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-50 rounded-lg p-4 text-center">
              <Activity className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
              <p className="text-3xl font-bold text-emerald-700">{weeklyStats.passages}</p>
              <p className="text-sm text-emerald-600">Пассажей</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <Snowflake className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-3xl font-bold text-blue-700">{weeklyStats.freezings}</p>
              <p className="text-sm text-blue-600">Заморозок</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <Link to="/cultures" className="text-sm text-blue-600 hover:underline flex items-center justify-center gap-1">
              Перейти к культурам <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-5 border-b border-slate-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-900">Активные задачи</h2>
            <Link to="/tasks" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              Все задачи <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="p-5">
            {recentTasks.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-emerald-400" />
                <p>Нет активных задач</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTasks.map(task => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500 font-mono">{task.task_code}</span>
                        {task.cultures && (
                          <span className="text-xs text-blue-600 font-mono">
                            → {task.cultures.culture_code}
                          </span>
                        )}
                        {task.deviations && (
                          <span className="text-xs text-amber-600 font-mono">
                            → {task.deviations.deviation_code}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${priorityColors[task.priority] || 'bg-gray-100'}`}>
                        {task.priority}
                      </span>
                      {task.due_date && (
                        <span className="text-xs text-slate-500">
                          {new Date(task.due_date).toLocaleDateString('ru-RU')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Deviations */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-5 border-b border-slate-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-900">Открытые отклонения</h2>
            <Link to="/deviations" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              Все отклонения <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="p-5">
            {recentDeviations.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-emerald-400" />
                <p>Нет открытых отклонений</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentDeviations.map(dev => (
                  <div key={dev.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{dev.description.slice(0, 50)}{dev.description.length > 50 ? '...' : ''}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500 font-mono">{dev.deviation_code}</span>
                        {dev.cultures && (
                          <span className="text-xs text-blue-600 font-mono">
                            → {dev.cultures.culture_code}
                          </span>
                        )}
                        {dev.containers && (
                          <span className="text-xs text-emerald-600 font-mono">
                            → {dev.containers.container_code}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs ${severityColors[dev.severity] || 'bg-gray-100'}`}>
                      {dev.severity}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
