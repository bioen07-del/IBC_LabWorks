import { useEffect, useState } from 'react'
import { supabase, Tables } from '@/lib/supabase'
import { 
  Plus, Search, User, Shield, Clock, CheckCircle, XCircle, X, Edit2
} from 'lucide-react'

type UserRecord = Tables<'users'>

type UserRole = 'admin' | 'qp' | 'qc' | 'operator' | 'viewer'

type UserForm = {
  id?: number
  username: string
  email: string
  full_name: string
  role: UserRole
  is_active: boolean
}

const roleLabels: Record<string, string> = {
  admin: 'Администратор',
  qp: 'Уполномоченное лицо (QP)',
  qc: 'Контроль качества (QC)',
  operator: 'Оператор',
  viewer: 'Наблюдатель',
}

const roleColors: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700',
  qp: 'bg-red-100 text-red-700',
  qc: 'bg-blue-100 text-blue-700',
  operator: 'bg-emerald-100 text-emerald-700',
  viewer: 'bg-slate-100 text-slate-600',
}

const emptyForm: UserForm = {
  username: '', email: '', full_name: '', role: 'operator', is_active: true
}

export function UsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<UserForm>(emptyForm)

  useEffect(() => {
    loadUsers()
  }, [])

  function openCreate() {
    setForm(emptyForm)
    setShowModal(true)
  }

  function openEdit(user: UserRecord) {
    setForm({
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      is_active: user.is_active
    })
    setShowModal(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      if (form.id) {
        await supabase.from('users').update({
          username: form.username,
          email: form.email,
          full_name: form.full_name,
          role: form.role,
          is_active: form.is_active
        }).eq('id', form.id)
      } else {
        await supabase.from('users').insert({
          username: form.username,
          email: form.email,
          full_name: form.full_name,
          role: form.role,
          is_active: form.is_active
        })
      }
      setShowModal(false)
      loadUsers()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  async function loadUsers() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('full_name')

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user =>
    user.full_name.toLowerCase().includes(search.toLowerCase()) ||
    user.username.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Пользователи</h1>
          <p className="text-slate-500 mt-1">Управление учётными записями и ролями</p>
        </div>
        <button 
          onClick={openCreate}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Добавить пользователя
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Поиск пользователей..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Пользователь</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Роль</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Статус</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Последний вход</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-slate-500" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{user.full_name}</div>
                          <div className="text-sm text-slate-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded ${roleColors[user.role]}`}>
                        <Shield className="h-3 w-3" />
                        {roleLabels[user.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {user.is_active ? (
                        <span className="inline-flex items-center gap-1 text-sm text-emerald-600">
                          <CheckCircle className="h-4 w-4" /> Активен
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-sm text-slate-400">
                          <XCircle className="h-4 w-4" /> Неактивен
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {user.last_login_at ? (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {new Date(user.last_login_at).toLocaleString('ru-RU')}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => openEdit(user)} className="p-2 hover:bg-slate-100 rounded-lg">
                        <Edit2 className="h-4 w-4 text-slate-500" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">{form.id ? 'Редактирование' : 'Новый пользователь'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-slate-100 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Имя пользователя *</label>
                <input type="text" value={form.username} onChange={e => setForm({...form, username: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ФИО *</label>
                <input type="text" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Роль</label>
                <select value={form.role} onChange={e => setForm({...form, role: e.target.value as UserRole})}
                  className="w-full px-3 py-2 border rounded-lg">
                  <option value="admin">Администратор</option>
                  <option value="qp">Уполномоченное лицо (QP)</option>
                  <option value="qc">Контроль качества (QC)</option>
                  <option value="operator">Оператор</option>
                  <option value="viewer">Наблюдатель</option>
                </select>
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} />
                <span>Активен</span>
              </label>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg">Отмена</button>
              <button onClick={handleSave} disabled={saving} 
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg disabled:opacity-50">
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
