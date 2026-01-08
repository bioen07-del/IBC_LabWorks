import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  FlaskConical, 
  ShoppingCart, 
  AlertTriangle, 
  Clock,
  TrendingUp,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'

interface Stats {
  activeCultures: number
  ordersInProgress: number
  openDeviations: number
  todayTasks: number
  pendingDonations: number
  expiringItems: number
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

  useEffect(() => {
    loadStats()
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

  const statCards = [
    { 
      title: 'Активных культур', 
      value: stats.activeCultures, 
      icon: FlaskConical, 
      color: 'bg-emerald-500',
      trend: '+3 за неделю'
    },
    { 
      title: 'Заказов в производстве', 
      value: stats.ordersInProgress, 
      icon: ShoppingCart, 
      color: 'bg-blue-500',
      trend: null
    },
    { 
      title: 'Открытых отклонений', 
      value: stats.openDeviations, 
      icon: AlertTriangle, 
      color: stats.openDeviations > 0 ? 'bg-amber-500' : 'bg-slate-400',
      trend: null
    },
    { 
      title: 'Задач на сегодня', 
      value: stats.todayTasks, 
      icon: Clock, 
      color: stats.todayTasks > 0 ? 'bg-purple-500' : 'bg-slate-400',
      trend: null
    },
    { 
      title: 'Донаций ожидает QP', 
      value: stats.pendingDonations, 
      icon: CheckCircle2, 
      color: stats.pendingDonations > 0 ? 'bg-orange-500' : 'bg-slate-400',
      trend: null
    },
    { 
      title: 'Истекает за 7 дней', 
      value: stats.expiringItems, 
      icon: AlertCircle, 
      color: stats.expiringItems > 0 ? 'bg-red-500' : 'bg-slate-400',
      trend: null
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Главная панель</h1>
        <p className="text-slate-500 mt-1">Обзор состояния производства</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <div key={card.title} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div className={`p-3 rounded-lg ${card.color}`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
              {card.trend && (
                <span className="flex items-center text-xs text-emerald-600 font-medium">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {card.trend}
                </span>
              )}
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-slate-900">
                {loading ? '...' : card.value}
              </p>
              <p className="text-sm text-slate-500 mt-1">{card.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks Today */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-5 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Задачи на сегодня</h2>
          </div>
          <div className="p-5">
            <div className="text-center py-8 text-slate-500">
              <Clock className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>Нет запланированных задач</p>
            </div>
          </div>
        </div>

        {/* Open Deviations */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-5 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Открытые отклонения</h2>
          </div>
          <div className="p-5">
            {stats.openDeviations === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-emerald-400" />
                <p>Нет открытых отклонений</p>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <AlertCircle className="h-12 w-12 mx-auto mb-3 text-amber-400" />
                <p>{stats.openDeviations} отклонений требуют внимания</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
