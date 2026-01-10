import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase, Tables } from '@/lib/supabase'
import { getCurrentUserId } from '@/hooks/useAuth'
import { ArrowLeft, Save, Droplet, AlertTriangle, FileText } from 'lucide-react'

type Donor = Tables<'donors'>

type DonorCheck = {
  type: 'error' | 'warning'
  message: string
}

export function DonationNew() {
  const { id: donorId } = useParams()
  const navigate = useNavigate()
  const [donor, setDonor] = useState<Donor | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [donorChecks, setDonorChecks] = useState<DonorCheck[]>([])
  const [lastDonationDate, setLastDonationDate] = useState<string | null>(null)
  const [form, setForm] = useState({
    donation_date: new Date().toISOString().split('T')[0],
    tissue_type: '',
    cell_type: '',
    collection_method: '',
    collection_site: '',
    volume_ml: '',
    consent_confirmed: false,
    consent_form_number: '',
    contract_number: '',
    contract_date: '',
    serology_hiv: 'pending',
    serology_hbv: 'pending',
    serology_hcv: 'pending',
    serology_syphilis: 'pending',
  })

  useEffect(() => {
    if (donorId) loadDonor()
  }, [donorId])

  async function loadDonor() {
    const { data } = await supabase
      .from('donors')
      .select('*')
      .eq('id', parseInt(donorId!))
      .single()
    setDonor(data)
    
    if (data) {
      await performDonorChecks(data)
    }
  }

  async function performDonorChecks(donorData: Donor) {
    const checks: DonorCheck[] = []
    
    // 1. Check donor status
    if (!donorData.is_active) {
      checks.push({
        type: 'error',
        message: `Донор неактивен. Сначала активируйте донора через QP.`
      })
    }
    
    // 2. Check age (18-65 years)
    if ((donorData as any).birth_date) {
      const birthDate = new Date((donorData as any).birth_date)
      const today = new Date()
      const age = Math.floor((today.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      if (age < 18) {
        checks.push({ type: 'error', message: `Донору ${age} лет. Минимальный возраст для донации — 18 лет.` })
      } else if (age > 65) {
        checks.push({ type: 'warning', message: `Донору ${age} лет. Рекомендуемый максимальный возраст — 65 лет.` })
      }
    }
    
    // 3. Check previous donations for positive serology
    const { data: donations } = await supabase
      .from('donations')
      .select('donation_date, serology_hiv, serology_hbv, serology_hcv, serology_syphilis')
      .eq('donor_id', parseInt(donorId!))
      .order('donation_date', { ascending: false })
    
    if (donations && donations.length > 0) {
      setLastDonationDate(donations[0].donation_date)
      
      // Check for positive serology in any previous donation
      const hasPositive = donations.some(d => 
        d.serology_hiv === 'positive' || 
        d.serology_hbv === 'positive' || 
        d.serology_hcv === 'positive' || 
        d.serology_syphilis === 'positive'
      )
      if (hasPositive) {
        checks.push({
          type: 'error',
          message: 'В предыдущих донациях обнаружены положительные серологические тесты. Донация запрещена.'
        })
      }
      
      // 4. Check interval between donations (min 56 days for bone marrow)
      const lastDate = new Date(donations[0].donation_date)
      const daysSinceLast = Math.floor((new Date().getTime() - lastDate.getTime()) / (24 * 60 * 60 * 1000))
      if (daysSinceLast < 56) {
        checks.push({
          type: 'warning',
          message: `С последней донации прошло ${daysSinceLast} дней. Рекомендуемый интервал — минимум 56 дней.`
        })
      }
    }
    
    setDonorChecks(checks)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!form.consent_confirmed) {
      setError('Необходимо подтвердить согласие донора')
      return
    }

    if (!form.tissue_type) {
      setError('Укажите тип ткани')
      return
    }

    if (!form.cell_type) {
      setError('Укажите тип клеток')
      return
    }

    setSaving(true)
    setError('')

    try {
      const { data: codeData } = await supabase.rpc('generate_donation_code')
      const donationCode = codeData || `DNT-${Date.now()}`

      const { error: insertError } = await supabase
        .from('donations')
        .insert({
          donor_id: parseInt(donorId!),
          donation_code: donationCode,
          donation_date: form.donation_date,
          tissue_type: form.tissue_type,
          cell_type: form.cell_type,
          collection_method: form.collection_method || null,
          collection_site: form.collection_site || null,
          volume_ml: form.volume_ml ? parseFloat(form.volume_ml) : null,
          consent_confirmed: form.consent_confirmed,
          consent_form_number: form.consent_form_number || null,
          contract_number: form.contract_number || null,
          created_by_user_id: getCurrentUserId(),
          contract_date: form.contract_date || null,
          serology_hiv: form.serology_hiv as any,
          serology_hbv: form.serology_hbv as any,
          serology_hcv: form.serology_hcv as any,
          serology_syphilis: form.serology_syphilis as any,
          status: 'received',
        })

      if (insertError) throw insertError

      navigate(`/donors/${donorId}`)
    } catch (err: any) {
      setError(err.message || 'Ошибка при создании донации')
    } finally {
      setSaving(false)
    }
  }

  // Типы тканей: solid (твердые) = гр, liquid (жидкие) = мл
  const tissueTypesConfig: Record<string, { label: string; unit: 'g' | 'ml' }> = {
    'Жировая ткань': { label: 'Жировая ткань', unit: 'g' },
    'Костный мозг': { label: 'Костный мозг', unit: 'ml' },
    'Пуповинная кровь': { label: 'Пуповинная кровь', unit: 'ml' },
    'Пупочный канатик': { label: 'Пупочный канатик', unit: 'g' },
    'Плацента': { label: 'Плацента', unit: 'g' },
    'Кожа': { label: 'Кожа', unit: 'g' },
    'Хрящ': { label: 'Хрящ', unit: 'g' },
    'Кость': { label: 'Кость', unit: 'g' },
    'Другое': { label: 'Другое', unit: 'g' },
  }

  const tissueTypes = Object.keys(tissueTypesConfig)

  const cellTypes: Record<string, string[]> = {
    'Жировая ткань': ['Адипоциты', 'МСК (мезенхимальные стволовые клетки)', 'Преадипоциты'],
    'Костный мозг': ['МСК', 'Гемопоэтические стволовые клетки', 'Стромальные клетки'],
    'Пуповинная кровь': ['Гемопоэтические стволовые клетки', 'МСК', 'Эндотелиальные клетки'],
    'Пупочный канатик': ['МСК', 'Эндотелиальные клетки', 'Гладкомышечные клетки', 'Клетки Вартонова студня'],
    'Плацента': ['МСК', 'Амниотические клетки', 'Хориальные клетки'],
    'Кожа': ['Фибробласты', 'Кератиноциты', 'Меланоциты'],
    'Хрящ': ['Хондроциты', 'Хондробласты'],
    'Кость': ['Остеобласты', 'Остеоциты', 'МСК'],
    'Другое': ['Другое'],
  }

  // Получить единицу измерения для текущей ткани
  const currentUnit = form.tissue_type ? tissueTypesConfig[form.tissue_type]?.unit || 'g' : 'g'
  const unitLabel = currentUnit === 'ml' ? 'мл' : 'гр'

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(`/donors/${donorId}`)} className="p-2 hover:bg-slate-100 rounded-lg">
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Новая донация</h1>
          <p className="text-slate-500">
            Донор: <span className="font-medium text-slate-700">{(donor as any)?.full_name || donor?.donor_code}</span>
          </p>
        </div>
      </div>

      {/* QP Donation Checks */}
      {donorChecks.length > 0 && (
        <div className="space-y-2">
          {donorChecks.map((check, idx) => (
            <div 
              key={idx} 
              className={`p-3 rounded-lg text-sm flex items-start gap-2 ${
                check.type === 'error' 
                  ? 'bg-red-50 text-red-700 border border-red-200' 
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-medium">{check.type === 'error' ? 'Ошибка QP:' : 'Предупреждение QP:'}</span> {check.message}
              </div>
            </div>
          ))}
        </div>
      )}

      {lastDonationDate && (
        <div className="p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">
          Последняя донация этого донора: <strong>{new Date(lastDonationDate).toLocaleDateString('ru-RU')}</strong>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* Main Info */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-200">
            <Droplet className="h-5 w-5 text-slate-400" />
            <h2 className="font-semibold text-slate-900">Данные донации</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Дата донации *</label>
              <input
                type="date"
                value={form.donation_date}
                onChange={(e) => setForm({ ...form, donation_date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Тип ткани *</label>
              <select
                value={form.tissue_type}
                onChange={(e) => setForm({ ...form, tissue_type: e.target.value, cell_type: '' })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              >
                <option value="">Выберите тип</option>
                {tissueTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Тип клеток *</label>
              <select
                value={form.cell_type}
                onChange={(e) => setForm({ ...form, cell_type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
                disabled={!form.tissue_type}
              >
                <option value="">Выберите тип клеток</option>
                {form.tissue_type && cellTypes[form.tissue_type]?.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">Тип клеток зависит от выбранной ткани</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Метод забора</label>
              <input
                type="text"
                value={form.collection_method}
                onChange={(e) => setForm({ ...form, collection_method: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Пункция, биопсия..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Место забора</label>
              <input
                type="text"
                value={form.collection_site}
                onChange={(e) => setForm({ ...form, collection_site: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Клиника №1, Операционная 3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {currentUnit === 'ml' ? 'Объём' : 'Масса'} ({unitLabel})
              </label>
              <input
                type="number"
                value={form.volume_ml}
                onChange={(e) => setForm({ ...form, volume_ml: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder={currentUnit === 'ml' ? '50' : '25'}
                step="0.1"
              />
              <p className="text-xs text-slate-500 mt-1">
                Ткань "{form.tissue_type || '...'}": {currentUnit === 'ml' ? 'жидкая (мл)' : 'солидная (гр)'}
              </p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.consent_confirmed}
                onChange={(e) => setForm({ ...form, consent_confirmed: e.target.checked })}
                className="w-5 h-5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
              <span className="text-sm font-medium text-amber-800">
                Подтверждаю наличие информированного согласия донора
              </span>
            </label>
            {form.consent_confirmed && (
              <div>
                <label className="block text-sm font-medium text-amber-800 mb-1">Номер формы согласия</label>
                <input
                  type="text"
                  value={form.consent_form_number}
                  onChange={(e) => setForm({ ...form, consent_form_number: e.target.value })}
                  className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  placeholder="ИС-2026-001"
                />
              </div>
            )}
          </div>
        </div>

        {/* Contract Info */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-200">
            <FileText className="h-5 w-5 text-slate-400" />
            <h2 className="font-semibold text-slate-900">Данные договора</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Номер договора</label>
              <input
                type="text"
                value={form.contract_number}
                onChange={(e) => setForm({ ...form, contract_number: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="ДД-2026/001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Дата договора</label>
              <input
                type="date"
                value={form.contract_date}
                onChange={(e) => setForm({ ...form, contract_date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Serology */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Серология</h2>
          <p className="text-sm text-slate-500 mb-4">
            Укажите статус серологических тестов. Если результаты ещё не готовы, оставьте "Ожидается".
          </p>

          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'serology_hiv', label: 'HIV' },
              { key: 'serology_hbv', label: 'HBV (Гепатит B)' },
              { key: 'serology_hcv', label: 'HCV (Гепатит C)' },
              { key: 'serology_syphilis', label: 'Сифилис' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
                <select
                  value={(form as any)[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="pending">Ожидается</option>
                  <option value="negative">Отрицательный</option>
                  <option value="positive">Положительный</option>
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(`/donors/${donorId}`)}
            className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={saving || donorChecks.some(c => c.type === 'error')}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-5 w-5" />
            {donorChecks.some(c => c.type === 'error') ? 'Донация заблокирована' : saving ? 'Создание...' : 'Создать донацию'}
          </button>
        </div>
      </form>
    </div>
  )
}
