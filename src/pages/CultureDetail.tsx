import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase, Tables } from '@/lib/supabase'
import { getCurrentUserId } from '@/hooks/useAuth'
import { 
  ArrowLeft, 
  FlaskConical, 
  AlertTriangle, 
  Snowflake, 
  Pause, 
  Trash2,
  Package,
  User,
  Droplets,
  Calendar,
  MapPin,
  ChevronDown,
  ChevronUp,
  Activity,
  Shield,
  ShieldAlert,
  ShieldX,
  GitBranch,
  X,
  Check,
  Link2,
  ArrowRight,
  TrendingUp,
  BarChart3
} from 'lucide-react'

type Culture = Tables<'cultures'> & {
  donations: {
    donation_code: string
    tissue_type: string
    donation_date: string
    donors: { id: number; donor_code: string; full_name: string | null } | null
  } | null
  combined_media_batches: { batch_code: string; expiry_date: string | null; media_recipes: { recipe_name: string } | null } | null
  orders: { id: number; order_code: string; client_name: string } | null
}

type Container = Tables<'containers'> & {
  container_types: { type_code: string; type_name: string } | null
  locations: { location_code: string; location_name: string } | null
}

const statusConfig = {
  active: { label: 'Активна', color: 'bg-emerald-100 text-emerald-700', icon: FlaskConical },
  frozen: { label: 'Заморожена', color: 'bg-blue-100 text-blue-700', icon: Snowflake },
  hold: { label: 'На удержании', color: 'bg-amber-100 text-amber-700', icon: Pause },
  contaminated: { label: 'Контаминация', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
  disposed: { label: 'Утилизирована', color: 'bg-slate-100 text-slate-700', icon: Trash2 },
}

const containerStatusConfig = {
  active: { label: 'Активен', color: 'bg-emerald-100 text-emerald-700' },
  frozen: { label: 'Заморожен', color: 'bg-blue-100 text-blue-700' },
  thawed: { label: 'Разморожен', color: 'bg-cyan-100 text-cyan-700' },
  disposed: { label: 'Утилизирован', color: 'bg-slate-100 text-slate-700' },
  blocked: { label: 'Заблокирован', color: 'bg-red-100 text-red-700' },
}

const riskConfig = {
  none: { label: 'Нет', color: 'bg-slate-100 text-slate-600', icon: Shield },
  at_risk: { label: 'Под риском', color: 'bg-amber-100 text-amber-700', icon: ShieldAlert },
  critical: { label: 'Критический', color: 'bg-red-100 text-red-700', icon: ShieldX },
}

export function CultureDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [culture, setCulture] = useState<Culture | null>(null)
  const [containers, setContainers] = useState<Container[]>([])
  const [loading, setLoading] = useState(true)
  const [showAllContainers, setShowAllContainers] = useState(false)
  const [showPassageModal, setShowPassageModal] = useState(false)
  const [showFreezeModal, setShowFreezeModal] = useState(false)
  const [selectedContainers, setSelectedContainers] = useState<number[]>([])
  const [splitRatio, setSplitRatio] = useState('1:2')
  const [passaging, setPassaging] = useState(false)
  const [freezing, setFreezing] = useState(false)
  const [thawing, setThawing] = useState(false)
  const [showThawModal, setShowThawModal] = useState(false)
  const [bankType, setBankType] = useState<'mcb' | 'wcb'>('wcb')
  const [vialCount, setVialCount] = useState(10)
  const [cryoMedia, setCryoMedia] = useState('DMSO 10%')
  const [freezingRate, setFreezingRate] = useState('-1°C/min')
  const [storageTemp, setStorageTemp] = useState('-196°C (LN2)')
  const [thawMethod, setThawMethod] = useState('37°C водяная баня')
  const [thawDuration, setThawDuration] = useState('2 мин')
  const [viabilityPostThaw, setViabilityPostThaw] = useState('')
  const [history, setHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  useEffect(() => {
    if (id) {
      loadCulture()
      loadHistory()
    }
  }, [id])

  async function loadHistory() {
    setLoadingHistory(true)
    try {
      const { data } = await (supabase
        .from('culture_history' as any)
        .select('*') as any)
        .eq('culture_id', parseInt(id!))
        .order('performed_at', { ascending: false })
        .limit(20)
      setHistory(data || [])
    } catch (error) {
      console.error('Error loading history:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  async function logHistory(action: string, description: string, oldVals?: any, newVals?: any) {
    try {
      await (supabase.from('culture_history' as any) as any).insert({
        culture_id: parseInt(id!),
        action,
        description,
        old_values: oldVals,
        new_values: newVals
      })
      loadHistory()
    } catch (error) {
      console.error('Error logging history:', error)
    }
  }

  async function logContainerHistory(containerIds: number[], actionType: string, description: string, oldVals?: any, newVals?: any) {
    try {
      const entries = containerIds.map(cid => ({
        container_id: cid,
        action_type: actionType,
        description,
        old_values: oldVals,
        new_values: newVals,
        performed_by_user_id: getCurrentUserId()
      }))
      await (supabase.from('container_history' as any) as any).insert(entries)
    } catch (error) {
      console.error('Error logging container history:', error)
    }
  }

  async function loadCulture() {
    try {
      const { data: cultureData, error: cultureError } = await supabase
        .from('cultures')
        .select(`
          *,
          donations (
            donation_code, tissue_type, donation_date,
            donors (id, donor_code, full_name)
          ),
          combined_media_batches (
            batch_code, expiry_date,
            media_recipes (recipe_name)
          ),
          orders (
            id, order_code, client_name
          )
        `)
        .eq('id', parseInt(id!))
        .single()

      if (cultureError) throw cultureError
      setCulture(cultureData as Culture)

      // Load containers
      const { data: containersData } = await supabase
        .from('containers')
        .select(`
          *,
          container_types (type_code, type_name),
          locations (location_code, location_name)
        `)
        .eq('culture_id', parseInt(id!))
        .order('passage_number', { ascending: false })
        .order('split_index', { ascending: true })

      setContainers(containersData as Container[] || [])
    } catch (error) {
      console.error('Error loading culture:', error)
      navigate('/cultures')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (!culture) return null

  const status = statusConfig[culture.status as keyof typeof statusConfig]
  const risk = riskConfig[culture.risk_flag as keyof typeof riskConfig]

  // Group containers by passage
  const containersByPassage = containers.reduce((acc, c) => {
    const p = c.passage_number
    if (!acc[p]) acc[p] = []
    acc[p].push(c)
    return acc
  }, {} as Record<number, Container[]>)

  const passages = Object.keys(containersByPassage).map(Number).sort((a, b) => b - a)
  const displayedPassages = showAllContainers ? passages : passages.slice(0, 3)

  const activeContainers = containers.filter(c => c.status === 'active').length
  const frozenContainers = containers.filter(c => c.status === 'frozen').length
  const activeContainersList = containers.filter(c => c.status === 'active')

  const handlePassage = async () => {
    if (selectedContainers.length === 0) return
    setPassaging(true)
    
    const ratio = parseInt(splitRatio.split(':')[1]) // 1:2 -> 2, 1:3 -> 3
    const newPassage = culture.current_passage + 1
    
    try {
      // Создаём новые контейнеры
      const newContainers = []
      for (const containerId of selectedContainers) {
        const sourceContainer = containers.find(c => c.id === containerId)
        if (!sourceContainer) continue
        
        for (let i = 1; i <= ratio; i++) {
          newContainers.push({
            culture_id: culture.id,
            container_type_id: sourceContainer.container_type_id,
            location_id: sourceContainer.location_id,
            container_code: `${culture.culture_code}-P${newPassage}-${i}`,
            passage_number: newPassage,
            split_index: i,
            status: 'active',
            created_at: new Date().toISOString()
          })
        }
      }
      
      // Вставляем новые контейнеры
      await (supabase.from('containers') as any).insert(newContainers)
      
      // Помечаем исходные как disposed и обнуляем объём
      await supabase.from('containers').update({ status: 'disposed' as any, volume_ml: 0 }).in('id', selectedContainers)
      
      // Записываем историю контейнеров
      await logContainerHistory(selectedContainers, 'passage', `Пассирование P${culture.current_passage} → P${newPassage}`, { status: 'active' }, { status: 'disposed' })
      
      // Обновляем current_passage культуры
      await supabase.from('cultures').update({ current_passage: newPassage }).eq('id', culture.id)
      
      // Логируем в историю
      await logHistory(
        'Пассирование',
        `P${culture.current_passage} → P${newPassage}, коэффициент ${splitRatio}, создано ${selectedContainers.length * ratio} контейнеров`,
        { passage: culture.current_passage },
        { passage: newPassage, containers: selectedContainers.length * ratio }
      )
      
      setShowPassageModal(false)
      setSelectedContainers([])
      loadCulture()
    } catch (error) {
      console.error('Error passaging:', error)
      alert('Ошибка при пассировании')
    } finally {
      setPassaging(false)
    }
  }

  const handleFreeze = async () => {
    if (selectedContainers.length === 0) return
    setFreezing(true)
    
    try {
      // Создаём криовиалы
      const cryovials = []
      for (let i = 1; i <= vialCount; i++) {
        cryovials.push({
          culture_id: culture.id,
          container_type_id: 1, // TODO: выбор типа криовиала
          location_id: null, // TODO: криохранилище
          container_code: `${culture.culture_code}-${bankType.toUpperCase()}-${String(i).padStart(3, '0')}`,
          passage_number: culture.current_passage,
          split_index: i,
          status: 'frozen',
          created_at: new Date().toISOString()
        })
      }
      
      await (supabase.from('containers') as any).insert(cryovials)
      
      // Помечаем исходные контейнеры как frozen и обнуляем объём
      await supabase.from('containers').update({ status: 'frozen' as any, volume_ml: 0 }).in('id', selectedContainers)
      
      // Записываем историю контейнеров
      await logContainerHistory(selectedContainers, 'freeze', `Банкирование ${bankType.toUpperCase()}, ${vialCount} криовиал, ${cryoMedia}, ${freezingRate}`, { status: 'active' }, { status: 'frozen', cryoMedia, freezingRate, storageTemp })
      
      // Если все контейнеры заморожены, обновляем статус культуры
      const remainingActive = containers.filter(c => c.status === 'active' && !selectedContainers.includes(c.id)).length
      if (remainingActive === 0) {
        await supabase.from('cultures').update({ status: 'frozen' as any }).eq('id', culture.id)
      }
      
      // Логируем в историю
      await logHistory(
        'Банкирование',
        `Создано ${vialCount} криовиал ${bankType.toUpperCase()} из P${culture.current_passage}`,
        { status: culture.status },
        { bank_type: bankType, vial_count: vialCount }
      )
      
      setShowFreezeModal(false)
      setSelectedContainers([])
      loadCulture()
    } catch (error) {
      console.error('Error freezing:', error)
      alert('Ошибка при банкировании')
    } finally {
      setFreezing(false)
    }
  }

  const frozenContainersList = containers.filter(c => c.status === 'frozen')

  const handleThaw = async () => {
    if (selectedContainers.length === 0) return
    setThawing(true)
    
    try {
      // Создаём новые активные контейнеры из размороженных
      const newContainers = selectedContainers.map((containerId, idx) => {
        const source = containers.find(c => c.id === containerId)
        return {
          culture_id: culture.id,
          container_type_id: source?.container_type_id || 1,
          location_id: source?.location_id,
          container_code: `${culture.culture_code}-TH-${Date.now()}-${idx + 1}`,
          passage_number: culture.current_passage,
          split_index: idx + 1,
          status: 'active',
          created_at: new Date().toISOString()
        }
      })
      
      await (supabase.from('containers') as any).insert(newContainers)
      
      // Помечаем исходные как thawed (использованы) и обнуляем объём
      await supabase.from('containers').update({ status: 'thawed' as any, volume_ml: 0 }).in('id', selectedContainers)
      
      // Записываем историю контейнеров
      await logContainerHistory(selectedContainers, 'thaw', `Размораживание ${thawMethod}, ${thawDuration}, жизнеспособность: ${viabilityPostThaw || 'N/A'}`, { status: 'frozen' }, { status: 'thawed', thawMethod, thawDuration, viabilityPostThaw })
      
      // Если культура была frozen, переводим в active
      if (culture.status === 'frozen') {
        await supabase.from('cultures').update({ status: 'active' as any }).eq('id', culture.id)
      }
      
      // Логируем в историю
      await logHistory(
        'Размораживание',
        `Разморожено ${selectedContainers.length} криовиал, создано ${selectedContainers.length} активных контейнеров`,
        { status: culture.status },
        { thawed_count: selectedContainers.length }
      )
      
      setShowThawModal(false)
      setSelectedContainers([])
      loadCulture()
    } catch (error) {
      console.error('Error thawing:', error)
      alert('Ошибка при размораживании')
    } finally {
      setThawing(false)
    }
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/cultures')}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад к культурам
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <FlaskConical className="h-8 w-8 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900">{culture.culture_code}</h1>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                  <status.icon className="h-3 w-3" />
                  {status.label}
                </span>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${risk.color}`}>
                  <risk.icon className="h-3 w-3" />
                  {risk.label}
                </span>
              </div>
              <p className="text-slate-500 mt-1">
                {culture.cell_type} • Пассаж P{culture.current_passage}
                {culture.tissue_source && ` • ${culture.tissue_source}`}
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                <span>Создана: {new Date(culture.created_at).toLocaleDateString('ru')}</span>
                {culture.updated_at && <span>Обновлена: {new Date(culture.updated_at).toLocaleDateString('ru')}</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {culture.status === 'active' && activeContainers > 0 && (
              <button
                onClick={() => setShowPassageModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <GitBranch className="h-4 w-4" />
                Пассировать
              </button>
            )}
            {culture.status === 'active' && activeContainers > 0 && (
              <button
                onClick={() => setShowFreezeModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Snowflake className="h-4 w-4" />
                Заморозить
              </button>
            )}
            {frozenContainers > 0 && (
              <button
                onClick={() => setShowThawModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700"
              >
                <Activity className="h-4 w-4" />
                Разморозить
              </button>
            )}
            <div className="text-right">
              <p className="text-xs text-slate-500">Контейнеров</p>
              <p className="font-semibold">
                <span className="text-emerald-600">{activeContainers} акт.</span>
                {frozenContainers > 0 && (
                  <span className="text-blue-600 ml-2">{frozenContainers} замор.</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Risk flag reason */}
        {culture.risk_flag !== 'none' && culture.risk_flag_reason && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">Причина риска:</p>
                <p className="text-amber-700 text-sm">{culture.risk_flag_reason}</p>
                {culture.risk_flag_set_at && (
                  <p className="text-amber-600 text-xs mt-1">
                    Установлен: {new Date(culture.risk_flag_set_at).toLocaleString('ru')}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Donor Info */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <User className="h-4 w-4 text-slate-400" />
            <h3 className="font-medium text-slate-700">Донор</h3>
          </div>
          {culture.donations?.donors ? (
            <Link 
              to={`/donors/${culture.donations.donors.id}`}
              className="text-emerald-600 hover:text-emerald-700 font-medium"
            >
              {culture.donations.donors.donor_code}
            </Link>
          ) : (
            <p className="text-slate-500">—</p>
          )}
          {culture.donations?.donors?.full_name && (
            <p className="text-sm text-slate-500 mt-1">{culture.donations.donors.full_name}</p>
          )}
        </div>

        {/* Donation Info */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Droplets className="h-4 w-4 text-slate-400" />
            <h3 className="font-medium text-slate-700">Донация</h3>
          </div>
          <p className="font-medium text-slate-900">{culture.donations?.donation_code || '—'}</p>
          <p className="text-sm text-slate-500 mt-1">
            {culture.donations?.tissue_type}
            {culture.donations?.donation_date && (
              <> • {new Date(culture.donations.donation_date).toLocaleDateString('ru')}</>
            )}
          </p>
        </div>

        {/* Media Info */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-4 w-4 text-slate-400" />
            <h3 className="font-medium text-slate-700">Среда</h3>
          </div>
          {culture.combined_media_batches ? (
            <>
              <p className="font-medium text-slate-900">{culture.combined_media_batches.batch_code}</p>
              <p className="text-sm text-slate-500 mt-1">
                {culture.combined_media_batches.media_recipes?.recipe_name}
              </p>
              {culture.combined_media_batches.expiry_date && (
                <p className="text-xs text-amber-600 mt-1">
                  Срок годности: {new Date(culture.combined_media_batches.expiry_date).toLocaleDateString('ru')}
                </p>
              )}
            </>
          ) : (
            <p className="text-slate-500">Не указана</p>
          )}
        </div>
      </div>

      {/* Growth Metrics */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-slate-400" />
          <h2 className="font-semibold text-slate-900">Эффективность роста</h2>
        </div>
        
        {(() => {
          // Расчёт метрик роста из контейнеров
          const activeContainersData = containers.filter(c => c.cell_concentration && c.viability_percent)
          const passageData = Object.entries(containersByPassage).map(([p, cs]) => {
            const totalCells = cs.reduce((sum, c) => sum + (c.cell_concentration || 0), 0)
            const avgViability = cs.reduce((sum, c) => sum + (c.viability_percent || 0), 0) / (cs.filter(c => c.viability_percent).length || 1)
            return { passage: parseInt(p), totalCells, avgViability, count: cs.length }
          }).sort((a, b) => a.passage - b.passage)

          // Расчёт PDL (Population Doubling Level)
          let cumulativePDL = 0
          if (passageData.length >= 2) {
            for (let i = 1; i < passageData.length; i++) {
              const prev = passageData[i-1].totalCells
              const curr = passageData[i].totalCells
              if (prev > 0 && curr > 0) {
                cumulativePDL += Math.log2(curr / prev)
              }
            }
          }

          // Средняя жизнеспособность
          const avgViability = activeContainersData.length > 0
            ? activeContainersData.reduce((sum, c) => sum + (c.viability_percent || 0), 0) / activeContainersData.length
            : 0

          // Общее количество клеток
          const totalCells = containers.filter(c => c.status === 'active').reduce((sum, c) => sum + (c.cell_concentration || 0), 0)

          // Расчёт времени удвоения (дней между пассажами / PDL)
          const daysSinceStart = culture.created_at ? Math.floor((Date.now() - new Date(culture.created_at).getTime()) / (1000*60*60*24)) : 0
          const avgDoublingTime = cumulativePDL > 0 ? (daysSinceStart / cumulativePDL).toFixed(1) : null

          const maxCells = Math.max(...passageData.map(p => p.totalCells), 1)

          return (
            <>
              {/* Метрики */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-emerald-50 rounded-lg">
                  <p className="text-xs text-emerald-600 font-medium">Всего клеток (активных)</p>
                  <p className="text-xl font-bold text-emerald-700">
                    {totalCells > 0 ? `${(totalCells / 1000000).toFixed(1)}M` : '—'}
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-600 font-medium">Ср. жизнеспособность</p>
                  <p className="text-xl font-bold text-blue-700">
                    {avgViability > 0 ? `${avgViability.toFixed(1)}%` : '—'}
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-xs text-purple-600 font-medium">Уровень удвоения (PDL)</p>
                  <p className="text-xl font-bold text-purple-700">
                    {cumulativePDL > 0 ? cumulativePDL.toFixed(2) : '—'}
                  </p>
                </div>
                <div className="p-4 bg-amber-50 rounded-lg">
                  <p className="text-xs text-amber-600 font-medium">Время удвоения</p>
                  <p className="text-xl font-bold text-amber-700">
                    {avgDoublingTime ? `${avgDoublingTime} дн.` : '—'}
                  </p>
                </div>
              </div>

              {/* График роста */}
              {passageData.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="h-4 w-4 text-slate-400" />
                    <h3 className="text-sm font-medium text-slate-700">Кривая роста (по пассажам)</h3>
                  </div>
                  <div className="flex items-end gap-2 h-32">
                    {passageData.map((p, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center">
                        <div 
                          className="w-full bg-emerald-500 rounded-t transition-all hover:bg-emerald-600"
                          style={{ height: `${(p.totalCells / maxCells) * 100}%`, minHeight: p.totalCells > 0 ? '4px' : '0' }}
                          title={`P${p.passage}: ${(p.totalCells/1000000).toFixed(2)}M клеток`}
                        />
                        <span className="text-xs text-slate-500 mt-1">P{p.passage}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 mt-2">
                    <span>Начало</span>
                    <span>Текущий пассаж</span>
                  </div>
                </div>
              )}

              {passageData.length === 0 && (
                <div className="text-center py-4 text-slate-500">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                  <p>Нет данных для расчёта метрик</p>
                  <p className="text-xs mt-1">Добавьте данные о концентрации клеток в контейнерах</p>
                </div>
              )}
            </>
          )
        })()}
      </div>

      {/* Order Info (if exists) */}
      {culture.orders && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Package className="h-4 w-4 text-slate-400" />
            <h3 className="font-medium text-slate-700">Заказ</h3>
          </div>
          <Link 
            to={`/orders/${culture.orders.id}`}
            className="text-emerald-600 hover:text-emerald-700 font-medium"
          >
            {culture.orders.order_code}
          </Link>
          <p className="text-sm text-slate-500 mt-1">{culture.orders.client_name}</p>
        </div>
      )}

      {/* Containers by Passage */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-5 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-slate-400" />
              <h2 className="font-semibold text-slate-900">Контейнеры</h2>
              <span className="text-sm text-slate-500">({containers.length})</span>
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {displayedPassages.map((passage) => (
            <div key={passage} className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-sm font-medium">
                  Пассаж P{passage}
                </span>
                <span className="text-sm text-slate-500">
                  {containersByPassage[passage].length} контейнер(ов)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {containersByPassage[passage].map((container) => {
                  const cStatus = containerStatusConfig[container.status as keyof typeof containerStatusConfig]
                  return (
                    <div
                      key={container.id}
                      className="p-4 border border-slate-200 rounded-lg hover:border-emerald-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-slate-900">{container.container_code}</p>
                          <p className="text-sm text-slate-500">
                            {container.container_types?.type_name}
                          </p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${cStatus.color}`}>
                          {cStatus.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-sm mt-3">
                        {container.volume_ml && (
                          <div>
                            <p className="text-slate-400 text-xs">Объём</p>
                            <p className="text-slate-700">{container.volume_ml} мл</p>
                          </div>
                        )}
                        {container.cell_concentration && (
                          <div>
                            <p className="text-slate-400 text-xs">Конц.</p>
                            <p className="text-slate-700">{container.cell_concentration}×10⁶</p>
                          </div>
                        )}
                        {container.viability_percent && (
                          <div>
                            <p className="text-slate-400 text-xs">Жизн.</p>
                            <p className="text-slate-700">{container.viability_percent}%</p>
                          </div>
                        )}
                      </div>

                      {container.locations && (
                        <div className="flex items-center gap-1 mt-3 text-xs text-slate-500">
                          <MapPin className="h-3 w-3" />
                          {container.locations.location_name}
                        </div>
                      )}

                      {container.quality_hold !== 'none' && (
                        <div className="mt-2 px-2 py-1 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
                          ⚠️ {container.quality_hold === 'qp' ? 'QP удержание' : 'Системное удержание'}
                        </div>
                      )}

                      {container.frozen_at && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-blue-600">
                          <Snowflake className="h-3 w-3" />
                          Заморожен: {new Date(container.frozen_at).toLocaleDateString('ru')}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {passages.length > 3 && (
          <div className="p-4 border-t border-slate-200 text-center">
            <button
              onClick={() => setShowAllContainers(!showAllContainers)}
              className="flex items-center gap-2 mx-auto text-emerald-600 hover:text-emerald-700"
            >
              {showAllContainers ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Скрыть старые пассажи
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Показать все пассажи ({passages.length - 3} ещё)
                </>
              )}
            </button>
          </div>
        )}

        {containers.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            <Package className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p>Контейнеры не найдены</p>
          </div>
        )}
      </div>

      {/* Traceability */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Link2 className="h-5 w-5 text-slate-400" />
          <h2 className="font-semibold text-slate-900">Прослеживаемость</h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {culture.donations?.donors && (
            <Link 
              to={`/donors/${culture.donations.donors.id}`}
              className="flex items-center gap-2 px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <User className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-700">
                Донор: {culture.donations.donors.donor_code}
              </span>
            </Link>
          )}
          <ArrowRight className="h-4 w-4 text-slate-300" />
          {culture.donations && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
              <Droplets className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">
                Донация: {culture.donations.donation_code}
              </span>
            </div>
          )}
          <ArrowRight className="h-4 w-4 text-slate-300" />
          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
            <FlaskConical className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-700">
              Культура: {culture.culture_code} (P{culture.current_passage})
            </span>
          </div>
          {containers.filter(c => c.status === 'frozen').length > 0 && (
            <>
              <ArrowRight className="h-4 w-4 text-slate-300" />
              <div className="flex items-center gap-2 px-3 py-2 bg-cyan-50 border border-cyan-200 rounded-lg">
                <Snowflake className="h-4 w-4 text-cyan-600" />
                <span className="text-sm font-medium text-cyan-700">
                  Банк: {containers.filter(c => c.status === 'frozen').length} криовиал
                </span>
              </div>
            </>
          )}
        </div>
        {culture.combined_media_batches && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <span className="text-xs text-slate-500">Среда: </span>
            <span className="text-sm text-slate-700">
              {culture.combined_media_batches.batch_code} ({culture.combined_media_batches.media_recipes?.recipe_name})
            </span>
          </div>
        )}
      </div>

      {/* Timeline/History */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-slate-400" />
          <h2 className="font-semibold text-slate-900">История</h2>
          <span className="text-sm text-slate-500">({history.length})</span>
        </div>
        
        {loadingHistory ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600 mx-auto"></div>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center text-slate-500 py-4">
            <Calendar className="h-8 w-8 mx-auto mb-2 text-slate-300" />
            <p>История пока пуста</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <div key={item.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="w-2 h-2 mt-2 rounded-full bg-emerald-500 flex-shrink-0"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-900">{item.action}</span>
                    <span className="text-xs text-slate-500">
                      {new Date(item.performed_at).toLocaleString('ru')}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-sm text-slate-600 mt-1">{item.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Passage Modal */}
      {showPassageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-purple-600" />
                Пассирование P{culture.current_passage} → P{culture.current_passage + 1}
              </h2>
              <button onClick={() => setShowPassageModal(false)}><X className="h-5 w-5" /></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Выберите контейнеры для пассирования</label>
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2">
                  {activeContainersList.map(c => (
                    <label key={c.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedContainers.includes(c.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedContainers([...selectedContainers, c.id])
                          } else {
                            setSelectedContainers(selectedContainers.filter(id => id !== c.id))
                          }
                        }}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      <span className="font-mono text-sm">{c.container_code}</span>
                      <span className="text-xs text-slate-500">
                        {c.container_types?.type_name} • {c.locations?.location_name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Коэффициент разведения</label>
                <div className="flex gap-2">
                  {['1:2', '1:3', '1:4', '1:5'].map(r => (
                    <button
                      key={r}
                      onClick={() => setSplitRatio(r)}
                      className={`px-4 py-2 rounded-lg border ${splitRatio === r ? 'bg-purple-100 border-purple-500 text-purple-700' : 'border-slate-200 hover:bg-slate-50'}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-sm text-slate-600">
                  <strong>Результат:</strong> {selectedContainers.length} контейнер(ов) → {selectedContainers.length * parseInt(splitRatio.split(':')[1])} новых контейнеров P{culture.current_passage + 1}
                </p>
              </div>

              <button
                onClick={handlePassage}
                disabled={selectedContainers.length === 0 || passaging}
                className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {passaging ? 'Обработка...' : <><Check className="h-4 w-4" /> Выполнить пассирование</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Freeze/Banking Modal */}
      {showFreezeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Snowflake className="h-5 w-5 text-blue-600" />
                Банкирование (заморозка)
              </h2>
              <button onClick={() => setShowFreezeModal(false)}><X className="h-5 w-5" /></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Тип банка</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setBankType('mcb')}
                    className={`flex-1 px-4 py-3 rounded-lg border ${bankType === 'mcb' ? 'bg-blue-100 border-blue-500 text-blue-700' : 'border-slate-200 hover:bg-slate-50'}`}
                  >
                    <div className="font-medium">MCB</div>
                    <div className="text-xs text-slate-500">Master Cell Bank</div>
                  </button>
                  <button
                    onClick={() => setBankType('wcb')}
                    className={`flex-1 px-4 py-3 rounded-lg border ${bankType === 'wcb' ? 'bg-blue-100 border-blue-500 text-blue-700' : 'border-slate-200 hover:bg-slate-50'}`}
                  >
                    <div className="font-medium">WCB</div>
                    <div className="text-xs text-slate-500">Working Cell Bank</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Выберите контейнеры для заморозки</label>
                <div className="space-y-2 max-h-32 overflow-y-auto border rounded-lg p-2">
                  {activeContainersList.map(c => (
                    <label key={c.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedContainers.includes(c.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedContainers([...selectedContainers, c.id])
                          } else {
                            setSelectedContainers(selectedContainers.filter(id => id !== c.id))
                          }
                        }}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      <span className="font-mono text-sm">{c.container_code}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Количество криовиал</label>
                <input
                  type="number"
                  value={vialCount}
                  onChange={e => setVialCount(parseInt(e.target.value) || 1)}
                  min={1}
                  max={100}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium mb-1">Криосреда</label>
                  <select value={cryoMedia} onChange={e => setCryoMedia(e.target.value)} className="w-full px-2 py-1.5 border rounded text-sm">
                    <option>DMSO 10%</option>
                    <option>DMSO 5%</option>
                    <option>Glycerol 10%</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Скорость</label>
                  <select value={freezingRate} onChange={e => setFreezingRate(e.target.value)} className="w-full px-2 py-1.5 border rounded text-sm">
                    <option>-1°C/min</option>
                    <option>-0.5°C/min</option>
                    <option>Быстрая</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Хранение</label>
                  <select value={storageTemp} onChange={e => setStorageTemp(e.target.value)} className="w-full px-2 py-1.5 border rounded text-sm">
                    <option>-196°C (LN2)</option>
                    <option>-150°C</option>
                    <option>-80°C</option>
                  </select>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  <strong>Результат:</strong> {vialCount} криовиал {bankType.toUpperCase()} из P{culture.current_passage}
                </p>
              </div>

              <button
                onClick={handleFreeze}
                disabled={selectedContainers.length === 0 || freezing}
                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {freezing ? 'Обработка...' : <><Snowflake className="h-4 w-4" /> Заморозить</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thaw Modal */}
      {showThawModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Activity className="h-5 w-5 text-cyan-600" />
                Размораживание
              </h2>
              <button onClick={() => setShowThawModal(false)}><X className="h-5 w-5" /></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Выберите криовиалы для размораживания</label>
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2">
                  {frozenContainersList.map(c => (
                    <label key={c.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedContainers.includes(c.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedContainers([...selectedContainers, c.id])
                          } else {
                            setSelectedContainers(selectedContainers.filter(id => id !== c.id))
                          }
                        }}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      <span className="font-mono text-sm">{c.container_code}</span>
                      <span className="text-xs text-slate-500">P{c.passage_number}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium mb-1">Метод</label>
                  <select value={thawMethod} onChange={e => setThawMethod(e.target.value)} className="w-full px-2 py-1.5 border rounded text-sm">
                    <option>37°C водяная баня</option>
                    <option>Комнатная t°</option>
                    <option>Специальный</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Время</label>
                  <select value={thawDuration} onChange={e => setThawDuration(e.target.value)} className="w-full px-2 py-1.5 border rounded text-sm">
                    <option>1 мин</option>
                    <option>2 мин</option>
                    <option>3 мин</option>
                    <option>5 мин</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Жизнесп. %</label>
                  <input type="text" value={viabilityPostThaw} onChange={e => setViabilityPostThaw(e.target.value)} placeholder="напр. 85%" className="w-full px-2 py-1.5 border rounded text-sm" />
                </div>
              </div>

              <div className="bg-cyan-50 rounded-lg p-3">
                <p className="text-sm text-cyan-700">
                  <strong>Результат:</strong> {selectedContainers.length} криовиал → {selectedContainers.length} активных контейнеров
                </p>
              </div>

              <button
                onClick={handleThaw}
                disabled={selectedContainers.length === 0 || thawing}
                className="w-full py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {thawing ? 'Обработка...' : <><Activity className="h-4 w-4" /> Разморозить</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
