import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { FlaskConical, LogIn, AlertCircle, Shield, ShieldCheck, Microscope, User, Eye } from 'lucide-react'

const QUICK_LOGIN_USERS = [
  { email: 'admin@bmcp.lab', role: 'admin', name: 'Администратор', icon: Shield, color: 'bg-purple-100 text-purple-700 hover:bg-purple-200' },
  { email: 'qp@bmcp.lab', role: 'qp', name: 'QP (Уполн. лицо)', icon: ShieldCheck, color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' },
  { email: 'qc@bmcp.lab', role: 'qc', name: 'QC (Контроль)', icon: Microscope, color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
  { email: 'operator@bmcp.lab', role: 'operator', name: 'Оператор', icon: User, color: 'bg-amber-100 text-amber-700 hover:bg-amber-200' },
  { email: 'viewer@bmcp.lab', role: 'viewer', name: 'Наблюдатель', icon: Eye, color: 'bg-slate-100 text-slate-700 hover:bg-slate-200' },
]

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await signIn(email, password)
    
    if (error) {
      setError('Неверный email или пароль')
      setLoading(false)
    } else {
      navigate('/')
    }
  }

  const handleQuickLogin = async (userEmail: string) => {
    setError('')
    setLoading(true)
    const { error } = await signIn(userEmail, '')
    if (error) {
      setError(error.message || 'Ошибка входа')
      setLoading(false)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4">
            <FlaskConical className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">BMCP Platform</h1>
          <p className="text-slate-500 mt-1">Система управления клеточными продуктами</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="operator@bmcp.lab"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Пароль
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Войти
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-200">
          <p className="text-center text-sm text-slate-500 mb-3">Быстрый вход (демо)</p>
          <div className="grid grid-cols-1 gap-2">
            {QUICK_LOGIN_USERS.map((user) => (
              <button
                key={user.email}
                type="button"
                onClick={() => handleQuickLogin(user.email)}
                disabled={loading}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${user.color}`}
              >
                <user.icon className="w-5 h-5" />
                <span className="flex-1 text-left">{user.name}</span>
                <span className="text-xs opacity-70">{user.role}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 p-4 bg-slate-50 rounded-lg">
          <p className="text-xs text-slate-500 text-center">
            <strong>Роли и права:</strong><br/>
            <span className="text-purple-600">Admin</span> — полный доступ |{' '}
            <span className="text-emerald-600">QP</span> — релиз продуктов |{' '}
            <span className="text-blue-600">QC</span> — контроль качества<br/>
            <span className="text-amber-600">Operator</span> — производство |{' '}
            <span className="text-slate-600">Viewer</span> — только просмотр
          </p>
        </div>

        <p className="text-center text-slate-400 text-sm mt-6">
          GMP-совместимая система v1.0.1
        </p>
      </div>
    </div>
  )
}
