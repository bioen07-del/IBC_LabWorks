import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase, Tables } from '@/lib/supabase'
import { 
  ArrowLeft, Save, Plus, Edit2, X, User, Calendar, Droplet, 
  Phone, Heart, CheckCircle, XCircle, FileText, ShieldCheck, ShieldX, AlertCircle
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

type Donor = Tables<'donors'>
type Donation = Tables<'donations'>

const sexLabels: Record<string, string> = { male: 'Мужской', female: 'Женский', other: 'Другой' }
const serologyLabels: Record<string, { label: string; color: string }> = {
  negative: { label: 'Отр.', color: 'bg-emerald-100 text-emerald-700' },
  positive: { label: 'Пол.', color: 'bg-red-100 text-red-700' },
  pending: { label: 'Ожид.', color: 'bg-amber-100 text-amber-700' },
}
const donationStatusLabels: Record<string, { label: string; color: string }> = {
  received: { label: 'Получена', color: 'bg-blue-100 text-blue-700' },
  processing: { label: 'Обработка', color: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Одобрена', color: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'Отклонена', color: 'bg-red-100 text-red-700' },
}

export function DonorDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [donor, setDonor] = useState<Donor | null>(null)
  const [donations, setDonations] = useState<Donation[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Partial<Donor>>({})
  const [approving, setApproving] = useState<number | null>(null)
  const [changingStatus, setChangingStatus] = useState(false)

  useEffect(() => {
    if (id) loadDonor()
  }, [id])

  async function loadDonor() {
    try {
      const { data: donorData, error: donorError } = await supabase
        .from('donors')
        .select('*')
        .eq('id', parseInt(id!))
        .single()

      if (donorError) throw donorError
      setDonor(donorData)
      setForm(donorData)

      const { data: donationsData } = await supabase
        .from('donations')
        .select('*')
        .eq('donor_id', parseInt(id!))
        .order('donation_date', { ascending: false })

      setDonations(donationsData || [])
    } catch (error) {
      console.error('Error loading donor:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!id) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from('donors')
        .update({
          full_name: form.full_name,
          birth_date: (form as any).birth_date,
          sex: form.sex as any,
          blood_type: form.blood_type,
          ethnicity: form.ethnicity,
          phone: form.phone,
          email: form.email,
          address: form.address,
          health_notes: form.health_notes,
          allergies: form.allergies,
          chronic_diseases: form.chronic_diseases,
        })
        .eq('id', parseInt(id!))

      if (error) throw error
      setDonor({ ...donor!, ...form } as Donor)
      setEditing(false)
    } catch (error) {
      console.error('Error saving donor:', error)
    } finally {
      setSaving(false)
    }
  }

  async function handleChangeDonorStatus(isActive: boolean) {
    if (!id) return
    setChangingStatus(true)
    try {
      const { error } = await supabase
        .from('donors')
        .update({ is_active: isActive })
        .eq('id', parseInt(id!))

      if (error) throw error
      setDonor({ ...donor!, is_active: isActive })
    } catch (error) {
      console.error('Error changing donor status:', error)
      alert('Ошибка при изменении статуса')
    } finally {
      setChangingStatus(false)
    }
  }

  async function handleApproveDonation(donationId: number, approve: boolean) {
    const donation = donations.find(d => d.id === donationId)
    if (!donation) return

    // Проверка серологии для одобрения
    if (approve) {
      const hasPositive = donation.serology_hiv === 'positive' || 
                          donation.serology_hbv === 'positive' || 
                          donation.serology_hcv === 'positive' || 
                          donation.serology_syphilis === 'positive'
      const hasPending = donation.serology_hiv === 'pending' || 
                         donation.serology_hbv === 'pending' || 
                         donation.serology_hcv === 'pending' || 
                         donation.serology_syphilis === 'pending'
      
      if (hasPositive) {
        alert('Невозможно одобрить донацию с положительной серологией')
        return
      }
      if (hasPending) {
        alert('Невозможно одобрить донацию с незавершённой серологией')
        return
      }
    }

    setApproving(donationId)
    try {
      const { error } = await supabase
        .from('donations')
        .update({
          status: approve ? 'approved' : 'rejected',
          qp_verified: true,
          qp_verified_at: new Date().toISOString(),
          qp_verified_by_user_id: null, // TODO: связать с таблицей users
          qp_verification_notes: approve ? 'Одобрено QP' : 'Отклонено QP'
        })
        .eq('id', donationId)

      if (error) throw error
      
      // Обновляем локальный список
      setDonations(donations.map(d => 
        d.id === donationId 
          ? { ...d, status: approve ? 'approved' : 'rejected', qp_verified: true } as Donation
          : d
      ))
    } catch (error) {
      console.error('Error approving donation:', error)
      alert('Ошибка при обновлении статуса донации')
    } finally {
      setApproving(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!donor) {
    return <div className="text-center py-12 text-slate-500">Донор не найден</div>
  }

  const EditableField = ({ label, field, type = 'text', placeholder = '' }: { label: string; field: keyof Donor; type?: string; placeholder?: string }) => (
    <div>
      <label className="text-sm text-slate-500">{label}</label>
      {editing ? (
        <input
          type={type}
          value={(form as any)[field] || ''}
          onChange={(e) => setForm({ ...form, [field]: type === 'number' ? (parseInt(e.target.value) || null) : e.target.value })}
          className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
          placeholder={placeholder}
        />
      ) : (
        <p className="font-medium text-slate-900">{(donor as any)[field] || '—'}</p>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/donors')} className="p-2 hover:bg-slate-100 rounded-lg">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </button>
          <div>
            <p className="text-sm text-slate-500">{donor.donor_code}</p>
            <h1 className="text-2xl font-bold text-slate-900">{(donor as any).full_name || donor.donor_code}</h1>
          </div>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button onClick={() => { setEditing(false); setForm(donor) }} className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50">
                <X className="h-5 w-5" />
              </button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2">
                <Save className="h-5 w-5" />
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </>
          ) : (
            <button onClick={() => setEditing(true)} className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-2">
              <Edit2 className="h-5 w-5" />
              Редактировать
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Info Cards */}
        <div className="space-y-6">
          {/* Donor Status */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-slate-400" />
              Статус донора
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Текущий статус:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  donor.is_active
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  {donor.is_active ? 'Активен' : 'Неактивен'}
                </span>
              </div>
              {(user?.role === 'qp' || user?.role === 'admin') && !donor.is_active && (
                <button
                  onClick={() => handleChangeDonorStatus(true)}
                  disabled={changingStatus}
                  className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <ShieldCheck className="h-5 w-5" />
                  {changingStatus ? 'Обработка...' : 'Активировать донора (QP)'}
                </button>
              )}
              {(user?.role === 'qp' || user?.role === 'admin') && donor.is_active && (
                <button
                  onClick={() => handleChangeDonorStatus(false)}
                  disabled={changingStatus}
                  className="w-full px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <ShieldX className="h-5 w-5" />
                  {changingStatus ? 'Обработка...' : 'Приостановить донора'}
                </button>
              )}
            </div>
          </div>

          {/* Basic Info */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-slate-400" />
              Основная информация
            </h2>
            <div className="space-y-3">
              <EditableField label="ФИО" field="full_name" placeholder="Иванов Иван Иванович" />
              <div>
                <label className="text-sm text-slate-500">Дата рождения</label>
                {editing ? (
                  <input
                    type="date"
                    value={(form as any).birth_date ? (form as any).birth_date.split('T')[0] : ''}
                    onChange={(e) => setForm({ ...form, birth_date: e.target.value } as any)}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    max={new Date().toISOString().split('T')[0]}
                  />
                ) : (
                  <p className="font-medium text-slate-900">
                    {(donor as any).birth_date ? (
                      <>
                        {new Date((donor as any).birth_date).toLocaleDateString('ru-RU')}
                        <span className="text-slate-500 ml-2">
                          ({Math.floor((new Date().getTime() - new Date((donor as any).birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} лет)
                        </span>
                      </>
                    ) : '—'}
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm text-slate-500">Пол</label>
                {editing ? (
                  <select
                    value={(form as any).sex || ''}
                    onChange={(e) => setForm({ ...form, sex: e.target.value as any })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  >
                    <option value="">Не указан</option>
                    <option value="male">Мужской</option>
                    <option value="female">Женский</option>
                  </select>
                ) : (
                  <p className="font-medium text-slate-900">{donor.sex ? sexLabels[donor.sex] : '—'}</p>
                )}
              </div>
              <EditableField label="Группа крови" field="blood_type" />
              <EditableField label="Этническая группа" field="ethnicity" />
            </div>
          </div>

          {/* Contacts */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Phone className="h-5 w-5 text-slate-400" />
              Контакты
            </h2>
            <div className="space-y-3">
              <EditableField label="Телефон" field="phone" placeholder="+7 (999) 123-45-67" />
              <EditableField label="Email" field="email" type="email" />
              <EditableField label="Адрес" field="address" />
            </div>
          </div>

          {/* Health Info */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Heart className="h-5 w-5 text-slate-400" />
              Здоровье
            </h2>
            <div className="space-y-3">
              <EditableField label="Аллергии" field="allergies" />
              <EditableField label="Хронические заболевания" field="chronic_diseases" />
              <div>
                <label className="text-sm text-slate-500">Заметки о здоровье</label>
                {editing ? (
                  <textarea
                    value={(form as any).health_notes || ''}
                    onChange={(e) => setForm({ ...form, health_notes: e.target.value } as any)}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    rows={3}
                  />
                ) : (
                  <p className="font-medium text-slate-900">{(donor as any).health_notes || '—'}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Donations */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <Droplet className="h-5 w-5 text-slate-400" />
              Донации ({donations.length})
            </h2>
            <Link
              to={`/donors/${id}/donations/new`}
              className="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Новая донация
            </Link>
          </div>

          {donations.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <Droplet className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              Донаций пока нет
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {donations.map(donation => (
                <div key={donation.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-slate-900">{donation.donation_code}</span>
                        <span className={`px-2 py-0.5 text-xs rounded ${donationStatusLabels[donation.status].color}`}>
                          {donationStatusLabels[donation.status].label}
                        </span>
                        {donation.qp_verified && (
                          <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" /> QP
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-slate-500 mt-1 flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(donation.donation_date).toLocaleDateString('ru-RU')}
                        </span>
                        <span>{donation.tissue_type}</span>
                        {(donation as any).cell_type && (
                          <span className="text-emerald-600 font-medium">→ {(donation as any).cell_type}</span>
                        )}
                      </div>
                      {(donation as any).contract_number && (
                        <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          Договор: {(donation as any).contract_number}
                          {(donation as any).contract_date && ` от ${new Date((donation as any).contract_date).toLocaleDateString('ru-RU')}`}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <div className="flex gap-1.5 text-xs">
                        <span className={`px-1.5 py-0.5 rounded ${serologyLabels[donation.serology_hiv].color}`}>
                          HIV:{serologyLabels[donation.serology_hiv].label}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded ${serologyLabels[donation.serology_hbv].color}`}>
                          HBV:{serologyLabels[donation.serology_hbv].label}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded ${serologyLabels[donation.serology_hcv].color}`}>
                          HCV:{serologyLabels[donation.serology_hcv].label}
                        </span>
                      </div>
                      {donation.status === 'received' && (user?.role === 'qp' || user?.role === 'admin') && (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleApproveDonation(donation.id, true)}
                            disabled={approving === donation.id}
                            className="flex items-center gap-1 px-2 py-1 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-700 disabled:opacity-50"
                          >
                            <ShieldCheck className="h-3 w-3" />
                            Одобрить
                          </button>
                          <button
                            onClick={() => handleApproveDonation(donation.id, false)}
                            disabled={approving === donation.id}
                            className="flex items-center gap-1 px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50"
                          >
                            <ShieldX className="h-3 w-3" />
                            Отклонить
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  {donation.status === 'received' && (
                    donation.serology_hiv === 'pending' || 
                    donation.serology_hbv === 'pending' || 
                    donation.serology_hcv === 'pending' || 
                    donation.serology_syphilis === 'pending'
                  ) && (
                    <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Серология не завершена — одобрение невозможно
                    </div>
                  )}
                  {donation.status === 'received' && (
                    donation.serology_hiv === 'positive' || 
                    donation.serology_hbv === 'positive' || 
                    donation.serology_hcv === 'positive' || 
                    donation.serology_syphilis === 'positive'
                  ) && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center gap-2">
                      <XCircle className="h-4 w-4" />
                      Положительная серология — донация подлежит отклонению
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
