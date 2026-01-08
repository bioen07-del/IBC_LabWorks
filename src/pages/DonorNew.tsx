import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Save, User, Phone, Heart } from 'lucide-react'

export function DonorNew() {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    full_name: '',
    birth_date: '',
    sex: '',
    blood_type: '',
    ethnicity: '',
    phone: '',
    email: '',
    address: '',
    health_notes: '',
    allergies: '',
    chronic_diseases: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!form.full_name.trim()) {
      setError('ФИО донора обязательно')
      return
    }

    setSaving(true)
    setError('')

    try {
      const { data: codeData } = await supabase.rpc('generate_donor_code')
      const donorCode = codeData || `DON-${Date.now()}`

      const { data, error: insertError } = await supabase
        .from('donors')
        .insert({
          donor_code: donorCode,
          full_name: form.full_name,
          birth_date: form.birth_date || null,
          sex: (form.sex || null) as any,
          blood_type: form.blood_type || null,
          ethnicity: form.ethnicity || null,
          phone: form.phone || null,
          email: form.email || null,
          address: form.address || null,
          health_notes: form.health_notes || null,
          allergies: form.allergies || null,
          chronic_diseases: form.chronic_diseases || null,
        })
        .select()
        .single()

      if (insertError) throw insertError
      navigate(`/donors/${data.id}`)
    } catch (err: any) {
      setError(err.message || 'Ошибка при создании донора')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/donors')} className="p-2 hover:bg-slate-100 rounded-lg">
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Новый донор</h1>
          <p className="text-slate-500">Регистрация нового донора биоматериала</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
        )}

        {/* Основная информация */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-200">
            <User className="h-5 w-5 text-slate-400" />
            <h2 className="font-semibold text-slate-900">Основная информация</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">ФИО *</label>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Иванов Иван Иванович"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Дата рождения</label>
              <input
                type="date"
                value={form.birth_date}
                onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Пол</label>
              <select
                value={form.sex}
                onChange={(e) => setForm({ ...form, sex: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Не указан</option>
                <option value="male">Мужской</option>
                <option value="female">Женский</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Группа крови</label>
              <select
                value={form.blood_type}
                onChange={(e) => setForm({ ...form, blood_type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Не указана</option>
                <option value="O+">O+ (I положительная)</option>
                <option value="O-">O- (I отрицательная)</option>
                <option value="A+">A+ (II положительная)</option>
                <option value="A-">A- (II отрицательная)</option>
                <option value="B+">B+ (III положительная)</option>
                <option value="B-">B- (III отрицательная)</option>
                <option value="AB+">AB+ (IV положительная)</option>
                <option value="AB-">AB- (IV отрицательная)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Этническая группа</label>
              <input
                type="text"
                value={form.ethnicity}
                onChange={(e) => setForm({ ...form, ethnicity: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Европеоидная"
              />
            </div>
          </div>
        </div>

        {/* Контактные данные */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-200">
            <Phone className="h-5 w-5 text-slate-400" />
            <h2 className="font-semibold text-slate-900">Контактные данные</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Телефон</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="+7 (999) 123-45-67"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="donor@example.com"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Адрес</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="г. Москва, ул. Примерная, д. 1"
              />
            </div>
          </div>
        </div>

        {/* Информация о здоровье */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-200">
            <Heart className="h-5 w-5 text-slate-400" />
            <h2 className="font-semibold text-slate-900">Информация о здоровье</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Аллергии</label>
              <input
                type="text"
                value={form.allergies}
                onChange={(e) => setForm({ ...form, allergies: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Пенициллин, латекс..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Хронические заболевания</label>
              <input
                type="text"
                value={form.chronic_diseases}
                onChange={(e) => setForm({ ...form, chronic_diseases: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Сахарный диабет, гипертония..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Дополнительные заметки о здоровье</label>
              <textarea
                value={form.health_notes}
                onChange={(e) => setForm({ ...form, health_notes: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                rows={3}
                placeholder="Любая важная информация о состоянии здоровья донора..."
              />
            </div>
          </div>
        </div>

        {/* Действия */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/donors')}
            className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="h-5 w-5" />
            {saving ? 'Создание...' : 'Создать донора'}
          </button>
        </div>
      </form>
    </div>
  )
}
