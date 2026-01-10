import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { getCurrentUserId } from '@/hooks/useAuth'
import { ArrowLeft, FlaskConical, Check, AlertCircle } from 'lucide-react'

type ApprovedDonation = {
  id: number
  donation_code: string
  tissue_type: string
  cell_type: string | null
  donation_date: string
  donors: { donor_code: string; full_name: string | null } | null
}

type ContainerType = {
  id: number
  type_code: string
  type_name: string
  category: string
}

type CombinedMediaBatch = {
  id: number
  batch_code: string
  media_recipes: { recipe_name: string } | null
  volume_remaining_ml: number
}

export function CultureNew() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [donations, setDonations] = useState<ApprovedDonation[]>([])
  const [containerTypes, setContainerTypes] = useState<ContainerType[]>([])
  const [mediaBatches, setMediaBatches] = useState<CombinedMediaBatch[]>([])

  const [form, setForm] = useState({
    donation_id: '',
    cell_type: '',
    tissue_source: '',
    culture_type: 'primary' as 'primary' | 'passage' | 'mcb' | 'wcb',
    isolation_date: new Date().toISOString().split('T')[0],
    at_risk: false,
    at_risk_reason: '',
    container_type_id: '',
    media_batch_id: '',
    initial_volume_ml: '',
    cell_concentration: '',
    viability_percent: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      // Load approved donations without cultures
      const { data: donationsData } = await supabase
        .from('donations')
        .select(`
          id, donation_code, tissue_type, cell_type, donation_date,
          donors (donor_code, full_name)
        `)
        .eq('status', 'approved')
        .order('donation_date', { ascending: false })

      // Filter donations that don't have cultures yet
      const { data: existingCultures } = await supabase
        .from('cultures')
        .select('donation_id')

      const usedDonationIds = new Set(existingCultures?.map(c => c.donation_id) || [])
      const availableDonations = (donationsData || []).filter(d => !usedDonationIds.has(d.id))

      setDonations(availableDonations as ApprovedDonation[])

      // Load container types (flasks for initial culture)
      const { data: typesData } = await supabase
        .from('container_types')
        .select('id, type_code, type_name, category')
        .eq('is_active', true)
        .in('category', ['flask', 'plate'])
        .order('type_name')

      setContainerTypes(typesData || [])

      // Load active media batches
      const { data: mediaData } = await supabase
        .from('combined_media_batches')
        .select(`
          id, batch_code, volume_remaining_ml,
          media_recipes (recipe_name)
        `)
        .eq('status', 'active')
        .eq('sterility_status', 'passed')
        .gt('volume_remaining_ml', 0)
        .order('expiry_date', { ascending: true })

      setMediaBatches(mediaData as CombinedMediaBatch[] || [])
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  function handleDonationChange(donationId: string) {
    const donation = donations.find(d => d.id === parseInt(donationId))
    setForm(prev => ({
      ...prev,
      donation_id: donationId,
      cell_type: donation?.cell_type || '',
      tissue_source: donation?.tissue_type || '',
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.donation_id || !form.cell_type || !form.container_type_id) {
      setError('Заполните обязательные поля')
      return
    }

    setSaving(true)
    setError('')

    try {
      // Generate culture code
      const { data: codeData } = await supabase.rpc('generate_culture_code')
      const cultureCode = codeData || `CUL-${Date.now()}`

      // Create culture
      const { data: culture, error: cultureError } = await supabase
        .from('cultures')
        .insert({
          culture_code: cultureCode,
          donation_id: parseInt(form.donation_id),
          cell_type: form.cell_type,
          tissue_source: form.tissue_source || null,
          culture_type: form.culture_type,
          isolation_date: form.isolation_date || null,
          isolated_by_user_id: getCurrentUserId(),
          current_passage: 0,
          status: 'active',
          risk_flag: form.at_risk ? 'at_risk' : 'none',
          at_risk: form.at_risk,
          at_risk_reason: form.at_risk ? form.at_risk_reason : null,
          at_risk_set_at: form.at_risk ? new Date().toISOString() : null,
          at_risk_set_by_user_id: form.at_risk ? getCurrentUserId() : null,
          media_batch_used_id: form.media_batch_id ? parseInt(form.media_batch_id) : null,
        })
        .select()
        .single()

      if (cultureError) throw cultureError

      // Get container type code
      const containerType = containerTypes.find(t => t.id === parseInt(form.container_type_id))

      // Generate container code
      const { data: containerCode } = await supabase.rpc('generate_container_code', {
        p_container_type_code: containerType?.type_code || 'FL',
        p_culture_code: cultureCode,
        p_passage: 0,
        p_split_index: 1
      })

      // Create initial container (P0)
      const { error: containerError } = await supabase
        .from('containers')
        .insert({
          container_code: containerCode || `${cultureCode}-P0-1`,
          culture_id: culture.id,
          container_type_id: parseInt(form.container_type_id),
          passage_number: 0,
          split_index: 1,
          status: 'active',
          quality_hold: 'none',
          volume_ml: form.initial_volume_ml ? parseFloat(form.initial_volume_ml) : null,
          cell_concentration: form.cell_concentration ? parseFloat(form.cell_concentration) : null,
          viability_percent: form.viability_percent ? parseFloat(form.viability_percent) : null,
        })

      if (containerError) throw containerError

      navigate(`/cultures/${culture.id}`)
    } catch (err: any) {
      console.error('Error creating culture:', err)
      setError(err.message || 'Ошибка при создании культуры')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => navigate('/cultures')}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад к культурам
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <FlaskConical className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Создание культуры</h1>
              <p className="text-slate-500">Инициация культуры из одобренной донации</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              {error}
            </div>
          )}

          {donations.length === 0 ? (
            <div className="p-8 text-center bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="h-8 w-8 mx-auto mb-3 text-amber-500" />
              <p className="text-amber-800 font-medium">Нет доступных донаций</p>
              <p className="text-amber-600 text-sm mt-1">
                Для создания культуры нужна одобренная донация без привязанной культуры
              </p>
            </div>
          ) : (
            <>
              {/* Donation Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Донация <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.donation_id}
                  onChange={(e) => handleDonationChange(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Выберите донацию</option>
                  {donations.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.donation_code} — {d.donors?.donor_code} ({d.tissue_type}, {new Date(d.donation_date).toLocaleDateString('ru')})
                    </option>
                  ))}
                </select>
              </div>

              {/* Culture Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Тип культуры <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.culture_type}
                    onChange={(e) => setForm({ ...form, culture_type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="primary">Первичная (Primary)</option>
                    <option value="passage">Пассажированная (Passage)</option>
                    <option value="mcb">Мастер-банк (MCB)</option>
                    <option value="wcb">Рабочий банк (WCB)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Дата изоляции <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.isolation_date}
                    onChange={(e) => setForm({ ...form, isolation_date: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Cell Type & Tissue Source */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Тип клеток <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.cell_type}
                    onChange={(e) => setForm({ ...form, cell_type: e.target.value })}
                    required
                    placeholder="MSC, Fibroblast, etc."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Источник ткани
                  </label>
                  <input
                    type="text"
                    value={form.tissue_source}
                    onChange={(e) => setForm({ ...form, tissue_source: e.target.value })}
                    placeholder="Жировая ткань, пуповина..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Risk Flag */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.at_risk}
                    onChange={(e) => setForm({ ...form, at_risk: e.target.checked })}
                    className="w-5 h-5 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                  />
                  <span className="text-sm font-medium text-amber-800">
                    ⚠️ Культура из донации с риском
                  </span>
                </label>
                {form.at_risk && (
                  <div>
                    <label className="block text-sm font-medium text-amber-800 mb-1">Причина риска *</label>
                    <textarea
                      value={form.at_risk_reason}
                      onChange={(e) => setForm({ ...form, at_risk_reason: e.target.value })}
                      className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                      placeholder="Пограничные серологические параметры, нестандартный донор..."
                      rows={2}
                      required={form.at_risk}
                    />
                  </div>
                )}
              </div>

              {/* Initial Container */}
              <div className="border-t border-slate-200 pt-6">
                <h3 className="font-medium text-slate-900 mb-4">Первичный контейнер (P0)</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Тип контейнера <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.container_type_id}
                      onChange={(e) => setForm({ ...form, container_type_id: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">Выберите тип</option>
                      {containerTypes.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.type_name} ({t.type_code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Культуральная среда
                    </label>
                    <select
                      value={form.media_batch_id}
                      onChange={(e) => setForm({ ...form, media_batch_id: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">Не указано</option>
                      {mediaBatches.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.batch_code} — {m.media_recipes?.recipe_name} ({m.volume_remaining_ml} мл)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Объём (мл)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={form.initial_volume_ml}
                      onChange={(e) => setForm({ ...form, initial_volume_ml: e.target.value })}
                      placeholder="5"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Концентрация (×10⁶/мл)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.cell_concentration}
                      onChange={(e) => setForm({ ...form, cell_concentration: e.target.value })}
                      placeholder="1.5"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Жизнеспособность (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      max="100"
                      value={form.viability_percent}
                      onChange={(e) => setForm({ ...form, viability_percent: e.target.value })}
                      placeholder="95"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => navigate('/cultures')}
                  className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Создание...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Создать культуру
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  )
}
