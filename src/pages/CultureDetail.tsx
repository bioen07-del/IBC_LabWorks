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
  BarChart3,
  Play,
  Loader2,
  Clock,
  QrCode,
  XCircle,
  Beaker
} from 'lucide-react'
import { CellCountingForm, MediaChangeForm, BankingForm, PassageForm, ObservationForm, ManipulationForm } from '@/components/processes/step-forms'
import { QRScanner } from '@/components/ui/QRScanner'

type ProcessTemplate = {
  id: number
  template_code: string
  name: string
}

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
  const [processTemplates, setProcessTemplates] = useState<ProcessTemplate[]>([])
  const [showProcessDropdown, setShowProcessDropdown] = useState(false)
  const [startingProcess, setStartingProcess] = useState(false)
  // Inline process execution
  const [activeProcessId, setActiveProcessId] = useState<number | null>(null)
  const [activeProcess, setActiveProcess] = useState<any>(null)
  const [activeSteps, setActiveSteps] = useState<any[]>([])
  const [currentStepIdx, setCurrentStepIdx] = useState(0)
  const [executingStep, setExecutingStep] = useState(false)
  // Step execution data (like ProcessExecution.tsx)
  const [stepFormData, setStepFormData] = useState<any>(null)
  const [stepForm, setStepForm] = useState({
    notes: '',
    viability_percent: '',
    cell_concentration: '',
    sop_confirmed: false
  })
  const [showScanner, setShowScanner] = useState(false)
  const [scannedEquipment, setScannedEquipment] = useState<string | null>(null)
  // CONTAINER-002: Гибкий выбор дочерних контейнеров - ОБНОВЛЕНО для множественных групп
  const [containerTypes, setContainerTypes] = useState<{id: number; type_code: string; type_name: string; surface_area_cm2?: number}[]>([])
  // Множественные группы контейнеров (Задача 2)
  const [containerGroups, setContainerGroups] = useState<{type_id: number | null; count: number}[]>([
    { type_id: null, count: 2 }
  ])

  useEffect(() => {
    if (id) {
      loadCulture()
      loadHistory()
      loadProcessTemplates()
      loadContainerTypes()
      loadActiveProcess()
    }
  }, [id])

  async function loadContainerTypes() {
    const { data } = await supabase
      .from('container_types')
      .select('id, type_code, type_name, surface_area_cm2')
      .eq('is_active', true)
      .order('type_name')
    setContainerTypes(data || [])
  }

  // Функции для работы с группами контейнеров (Задача 2)
  const addContainerGroup = () => {
    setContainerGroups([...containerGroups, { type_id: null, count: 1 }])
  }

  const removeContainerGroup = (index: number) => {
    if (containerGroups.length > 1) {
      setContainerGroups(containerGroups.filter((_, i) => i !== index))
    }
  }

  const updateContainerGroup = (index: number, field: 'type_id' | 'count', value: any) => {
    const updated = [...containerGroups]
    updated[index] = { ...updated[index], [field]: value }
    setContainerGroups(updated)
  }

  const getTotalChildCount = () => containerGroups.reduce((sum, g) => sum + g.count, 0)

  const getTotalArea = () => {
    return containerGroups.reduce((sum, g) => {
      const type = containerTypes.find(t => t.id === g.type_id) as any
      const area = type?.surface_area_cm2 || 0
      return sum + (area * g.count)
    }, 0)
  }

  async function loadProcessTemplates() {
    // Загружаем все шаблоны с информацией о фильтрации (ИСПРАВЛЕНО: добавлен applicable_tissue_types)
    const { data } = await supabase
      .from('process_templates')
      .select('id, template_code, name, applicable_cell_types, is_universal, applicable_tissue_types')
      .eq('is_active', true)
      .order('name')

    if (!data || !culture) {
      setProcessTemplates(data || [])
      return
    }

    // ИСПРАВЛЕНО: Фильтруем по типу ткани из донации, а не по cell_type
    const tissueType = culture.donations?.tissue_type || ''
    const filtered = data.filter((t: any) => {
      // Универсальные процессы подходят всем
      if (t.is_universal) return true

      // Проверяем applicable_tissue_types
      const applicableTissues = (t.applicable_tissue_types as string[]) || []
      if (applicableTissues.length === 0) return true // Если не указаны - подходит всем

      // Ищем совпадение по типу ткани
      return applicableTissues.some(tissue =>
        tissue.toLowerCase().includes(tissueType.toLowerCase()) ||
        tissueType.toLowerCase().includes(tissue.toLowerCase())
      )
    })

    setProcessTemplates(filtered)
  }

  async function handleStartProcess(templateId: number) {
    if (!culture) return
    setStartingProcess(true)
    setShowProcessDropdown(false)
    
    try {
      // 1. Получаем шаблон и его шаги
      const { data: template } = await supabase
        .from('process_templates')
        .select('*, process_template_steps(*)')
        .eq('id', templateId)
        .single()
      
      if (!template) throw new Error('Template not found')
      
      // 2. Создаём executed_process
      const processCode = `EP-${Date.now()}`
      const { data: newProcess, error: processError } = await (supabase
        .from('executed_processes') as any)
        .insert({
          process_code: processCode,
          process_template_id: templateId,
          culture_id: culture.id,
          status: 'in_progress',
          started_at: new Date().toISOString(),
          started_by_user_id: getCurrentUserId()
        })
        .select()
        .single()
      
      if (processError) throw processError
      
      // 3. Копируем шаги в executed_steps
      const steps = (template as any).process_template_steps || []
      let createdSteps: any[] = []
      if (steps.length > 0) {
        const stepsToInsert = steps
          .sort((a: any, b: any) => (a.step_number || 0) - (b.step_number || 0))
          .map((step: any, idx: number) => ({
            executed_process_id: newProcess.id,
            process_template_step_id: step.id,
            status: idx === 0 ? 'in_progress' : 'pending',
            started_at: idx === 0 ? new Date().toISOString() : null
          }))
        
        const { data: insertedSteps } = await (supabase.from('executed_steps') as any)
          .insert(stepsToInsert)
          .select('*, process_template_steps(*)')
        createdSteps = insertedSteps || []
      }
      
      // 4. Показываем процесс inline вместо перенаправления
      setActiveProcessId(newProcess.id)
      setActiveProcess({ ...newProcess, process_templates: template })
      setActiveSteps(createdSteps)
      setCurrentStepIdx(0)
    } catch (error) {
      console.error('Error starting process:', error)
      alert('Ошибка при запуске процесса')
    } finally {
      setStartingProcess(false)
    }
  }

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

  // Загрузка активного процесса для культуры
  async function loadActiveProcess() {
    if (!id) return
    const { data: processes } = await (supabase
      .from('executed_processes') as any)
      .select('*, process_templates(name, template_code)')
      .eq('culture_id', parseInt(id))
      .eq('status', 'in_progress')
      .limit(1)
    
    if (processes && processes.length > 0) {
      const proc = processes[0]
      setActiveProcessId(proc.id)
      setActiveProcess(proc)
      
      // Загружаем шаги
      const { data: steps } = await (supabase
        .from('executed_steps') as any)
        .select('*, process_template_steps(step_name, step_number, step_type, description, is_critical, cca_rules)')
        .eq('executed_process_id', proc.id)
        .order('id')
      
      setActiveSteps(steps || [])
      // Находим текущий шаг (первый не completed)
      const idx = (steps || []).findIndex((s: any) => s.status !== 'completed')
      setCurrentStepIdx(idx >= 0 ? idx : 0)
    }
  }

  // === Функции создания контейнеров (из ProcessExecution.tsx) ===
  async function createContainersFromPassage(cultureId: number, passageData: any, recordedParams: any) {
    console.log('Creating containers from passage:', passageData)

    if (!passageData.containerGroups || !Array.isArray(passageData.containerGroups)) {
      console.warn('No container groups in passage data')
      return
    }

    const containersToCreate = []

    const { data: existingContainers } = await supabase
      .from('containers')
      .select('passage_number')
      .eq('culture_id', cultureId)
      .order('passage_number', { ascending: false })
      .limit(1)

    const nextPassageNumber = (existingContainers?.[0]?.passage_number || 0) + 1

    for (const group of passageData.containerGroups) {
      if (!group.type_id || !group.count) continue

      for (let i = 0; i < group.count; i++) {
        const containerCode = `C-${cultureId}-P${nextPassageNumber}-${Date.now()}-${i}`
        containersToCreate.push({
          container_code: containerCode,
          culture_id: cultureId,
          container_type_id: group.type_id,
          passage_number: nextPassageNumber,
          split_index: i,
          status: 'active' as const,
          quality_hold: 'none' as const,
          viability_percent: recordedParams.viability_percent || null,
          cell_concentration: recordedParams.cell_concentration || null,
          created_by_user_id: getCurrentUserId()
        })
      }
    }

    if (containersToCreate.length > 0) {
      const { error } = await supabase.from('containers').insert(containersToCreate)
      if (error) {
        console.error('Error creating containers:', error)
      } else {
        console.log(`✅ Created ${containersToCreate.length} containers from passage`)
      }
    }
  }

  async function updateContainersFromCellCounting(containers: any[], recordedParams: any) {
    console.log('Updating containers from cell counting:', containers)

    for (const container of containers) {
      if (!container.id) continue

      await supabase
        .from('containers')
        .update({
          viability_percent: container.viability || recordedParams.viability_percent || null,
          cell_concentration: container.totalCells || recordedParams.cell_concentration || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', container.id)
    }

    console.log(`✅ Updated ${containers.length} containers with cell count data`)
  }

  async function createContainersFromBanking(cultureId: number, bankingData: any, recordedParams: any) {
    console.log('Creating vials from banking:', bankingData)

    const vialCount = bankingData.vialCount || 0
    if (vialCount === 0) {
      console.warn('No vials to create')
      return
    }

    const { data: cryovialType } = await supabase
      .from('container_types')
      .select('id')
      .eq('category', 'cryovial')
      .limit(1)
      .single()

    if (!cryovialType) {
      console.error('Cryovial container type not found')
      return
    }

    const vialsToCreate = []
    const bankType = bankingData.bankType || 'wcb'

    for (let i = 0; i < vialCount; i++) {
      const vialCode = `${bankType.toUpperCase()}-${cultureId}-${Date.now()}-V${i + 1}`
      vialsToCreate.push({
        container_code: vialCode,
        culture_id: cultureId,
        container_type_id: cryovialType.id,
        passage_number: recordedParams.passage_number || 0,
        split_index: i,
        status: 'frozen' as const,
        quality_hold: 'none' as const,
        viability_percent: recordedParams.viability_percent || null,
        cell_concentration: recordedParams.cell_concentration || null,
        cryopreservation_media: bankingData.cryoMedia || 'DMSO 10%',
        freezing_rate: bankingData.freezingRate || '-1°C/min',
        storage_temperature: bankingData.storageTemp || '-196°C',
        frozen_at: new Date().toISOString(),
        created_by_user_id: getCurrentUserId()
      })
    }

    if (vialsToCreate.length > 0) {
      const { error } = await supabase.from('containers').insert(vialsToCreate)
      if (error) {
        console.error('Error creating vials:', error)
      } else {
        console.log(`✅ Created ${vialsToCreate.length} cryovials from banking`)
      }
    }
  }

  // Выполнение текущего шага (ОБНОВЛЕНО: теперь с автоматическим созданием контейнеров)
  async function completeCurrentStep() {
    if (!activeSteps[currentStepIdx] || !culture) return
    setExecutingStep(true)

    try {
      const step = activeSteps[currentStepIdx]

      // Собираем параметры из формы
      const recordedParams = {
        ...stepForm,
        viability_percent: stepForm.viability_percent ? parseFloat(stepForm.viability_percent) : null,
        cell_concentration: stepForm.cell_concentration ? parseFloat(stepForm.cell_concentration) : null
      }

      // Завершаем текущий шаг
      await (supabase.from('executed_steps') as any)
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          executed_by_user_id: getCurrentUserId(),
          notes: stepForm.notes || null,
          recorded_parameters: recordedParams,
          sop_confirmed_at: stepForm.sop_confirmed ? new Date().toISOString() : null
        })
        .eq('id', step.id)

      // === АВТОМАТИЧЕСКОЕ СОЗДАНИЕ КОНТЕЙНЕРОВ ПО ТИПУ ШАГА ===
      const stepType = step.process_template_steps?.step_type
      if (stepFormData && culture.id) {
        if (stepType === 'passage' && stepFormData.containerGroups) {
          await createContainersFromPassage(culture.id, stepFormData, recordedParams)
          await logHistory('Passage completed', `Created containers from passage step`, {}, {containers: stepFormData.containerGroups})
        } else if (stepType === 'cell_counting' && stepFormData.containers) {
          await updateContainersFromCellCounting(stepFormData.containers, recordedParams)
          await logHistory('Cell counting completed', `Updated ${stepFormData.containers.length} containers with count data`, {}, {})
        } else if (stepType === 'banking' && stepFormData.vialCount) {
          await createContainersFromBanking(culture.id, stepFormData, recordedParams)
          await logHistory('Banking completed', `Created ${stepFormData.vialCount} vials`, {}, {vialCount: stepFormData.vialCount})
        }
      }

      // Обновляем локальный state
      const updatedSteps = [...activeSteps]
      updatedSteps[currentStepIdx] = { ...step, status: 'completed' }

      // Если есть следующий шаг - запускаем его
      if (currentStepIdx + 1 < activeSteps.length) {
        const nextStep = activeSteps[currentStepIdx + 1]
        await (supabase.from('executed_steps') as any)
          .update({ status: 'in_progress', started_at: new Date().toISOString() })
          .eq('id', nextStep.id)
        updatedSteps[currentStepIdx + 1] = { ...nextStep, status: 'in_progress' }
        setActiveSteps(updatedSteps)
        setCurrentStepIdx(currentStepIdx + 1)
        // Сбрасываем форму для следующего шага
        setStepFormData(null)
        setStepForm({ notes: '', viability_percent: '', cell_concentration: '', sop_confirmed: false })
      } else {
        // Все шаги выполнены - завершаем процесс
        await (supabase.from('executed_processes') as any)
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', activeProcessId)

        setActiveSteps(updatedSteps)
        setActiveProcessId(null)
        setActiveProcess(null)
        await logHistory('process_completed', `Процесс завершён: ${activeProcess?.process_templates?.name}`)
        alert('✅ Процесс успешно завершён!')
        // Перезагружаем данные культуры чтобы увидеть новые контейнеры
        loadCulture()
      }
    } catch (error) {
      console.error('Error completing step:', error)
      alert('Ошибка при выполнении шага')
    } finally {
      setExecutingStep(false)
    }
  }

  // Закрыть процесс (отмена)
  async function cancelProcess() {
    if (!activeProcessId) return
    if (!confirm('Отменить выполнение процесса?')) return
    
    await (supabase.from('executed_processes') as any)
      .update({ status: 'aborted' })
      .eq('id', activeProcessId)
    
    setActiveProcessId(null)
    setActiveProcess(null)
    setActiveSteps([])
    logHistory('process_cancelled', `Процесс отменён: ${activeProcess?.process_templates?.name}`)
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
    
    const newPassage = culture.current_passage + 1
    const sourceContainer = containers.find(c => selectedContainers.includes(c.id))
    const defaultTypeId = sourceContainer?.container_type_id || 1
    
    try {
      // ЗАДАЧА 2: Создаём контейнеры по группам (разные типы)
      const newContainers: any[] = []
      let containerIndex = 1
      
      for (const group of containerGroups) {
        const typeId = group.type_id || defaultTypeId
        for (let i = 0; i < group.count; i++) {
          newContainers.push({
            culture_id: culture.id,
            container_type_id: typeId,
            location_id: sourceContainer?.location_id,
            container_code: `${culture.culture_code}-P${newPassage}-${containerIndex}`,
            passage_number: newPassage,
            split_index: containerIndex,
            status: 'active',
            created_at: new Date().toISOString()
          })
          containerIndex++
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
      
      // Логируем в историю - описание групп
      const groupsDescription = containerGroups.map(g => {
        const typeName = containerTypes.find(t => t.id === g.type_id)?.type_name || 'того же типа'
        return `${g.count}×${typeName}`
      }).join(' + ')
      
      await logHistory(
        'Пассирование',
        `P${culture.current_passage} → P${newPassage}, создано ${groupsDescription}`,
        { passage: culture.current_passage },
        { passage: newPassage, containers: getTotalChildCount(), groups: containerGroups }
      )
      
      setShowPassageModal(false)
      setSelectedContainers([])
      setContainerGroups([{ type_id: null, count: 2 }])
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

          {/* UX-3: Quick Actions */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 mr-1">⚡</span>
            <div className="relative">
              <button
                onClick={() => setShowProcessDropdown(!showProcessDropdown)}
                disabled={startingProcess}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                {startingProcess ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Начать процесс
                <ChevronDown className="h-4 w-4" />
              </button>
              {showProcessDropdown && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-slate-200 z-50 max-h-80 overflow-y-auto">
                  <div className="p-2">
                    <p className="px-3 py-2 text-xs font-medium text-slate-500 uppercase">Выберите процесс</p>
                    {processTemplates.map(t => (
                      <button
                        key={t.id}
                        onClick={() => handleStartProcess(t.id)}
                        className="w-full text-left px-3 py-2 hover:bg-slate-100 rounded-lg text-sm"
                      >
                        <span className="font-mono text-xs text-slate-400">{t.template_code}</span>
                        <span className="ml-2">{t.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
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

      {/* Active Process Inline Execution */}
      {activeProcessId && activeProcess && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Play className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">
                  {activeProcess.process_templates?.name || 'Процесс'}
                </h3>
                <p className="text-sm text-slate-500">
                  Шаг {currentStepIdx + 1} из {activeSteps.length}
                </p>
              </div>
            </div>
            <button
              onClick={cancelProcess}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Отменить
            </button>
          </div>
          
          {/* Steps progress */}
          <div className="flex gap-1 mb-4">
            {activeSteps.map((s, i) => (
              <div
                key={s.id}
                className={`h-2 flex-1 rounded ${
                  s.status === 'completed' ? 'bg-emerald-500' :
                  s.status === 'in_progress' ? 'bg-blue-500 animate-pulse' :
                  'bg-slate-200'
                }`}
              />
            ))}
          </div>
          
          {/* Current step */}
          {activeSteps[currentStepIdx] && (
            <div className="bg-white rounded-lg p-4 border border-blue-100 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-slate-900">
                    {activeSteps[currentStepIdx].process_template_steps?.step_name || `Шаг ${currentStepIdx + 1}`}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    {activeSteps[currentStepIdx].process_template_steps?.description || 'Выполните действие и нажмите "Завершить шаг"'}
                  </p>
                  {activeSteps[currentStepIdx].process_template_steps?.is_critical && (
                    <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                      <AlertTriangle className="h-3 w-3" /> Критический шаг
                    </span>
                  )}
                </div>
              </div>

              {/* === СПЕЦИАЛИЗИРОВАННЫЕ ФОРМЫ ШАГОВ === */}
              {(() => {
                const stepType = activeSteps[currentStepIdx].process_template_steps?.step_type
                const isCritical = activeSteps[currentStepIdx].process_template_steps?.is_critical

                return (
                  <div className="space-y-3">
                    {/* Critical warning */}
                    {isCritical && (
                      <div className="bg-red-50 border border-red-300 rounded-lg p-3 flex items-start gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-red-800">⚠️ Критический шаг</p>
                          <p className="text-xs text-red-700">Данные проверяются CCA. При fail контейнеры блокируются.</p>
                        </div>
                      </div>
                    )}

                    {/* Equipment Scan */}
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-slate-800 flex items-center gap-2">
                            <QrCode className="h-4 w-4" />
                            Оборудование
                          </h4>
                          <p className="text-xs text-slate-500 mt-1">
                            Отсканируйте или введите код оборудования
                          </p>
                        </div>
                        {scannedEquipment ? (
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg font-mono text-sm">
                              {scannedEquipment}
                            </span>
                            <button
                              onClick={() => setScannedEquipment(null)}
                              className="text-slate-400 hover:text-slate-600"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowScanner(true)}
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
                          >
                            <QrCode className="h-4 w-4" />
                            Сканировать
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Specialized forms based on step type */}
                    {stepType === 'cell_counting' && culture && (
                      <CellCountingForm
                        cultureId={culture.id}
                        stepId={activeSteps[currentStepIdx].id}
                        onDataChange={(data) => {
                          setStepFormData(data)
                          setStepForm(prev => ({
                            ...prev,
                            viability_percent: data.avgViability.toString(),
                            cell_concentration: (data.totalCells / 1000000).toString()
                          }))
                        }}
                      />
                    )}

                    {stepType === 'media_change' && culture && (
                      <MediaChangeForm
                        cultureId={culture.id}
                        onDataChange={(data) => {
                          setStepFormData(data)
                        }}
                      />
                    )}

                    {stepType === 'banking' && culture && (
                      <BankingForm
                        cultureId={culture.id}
                        onDataChange={(data) => {
                          setStepFormData(data)
                        }}
                      />
                    )}

                    {stepType === 'passage' && culture && (
                      <PassageForm
                        cultureId={culture.id}
                        sourceContainerIds={[]}
                        onDataChange={(data) => {
                          setStepFormData(data)
                        }}
                      />
                    )}

                    {stepType === 'observation' && (
                      <ObservationForm
                        stepName={activeSteps[currentStepIdx].process_template_steps?.step_name || 'Осмотр'}
                        description={activeSteps[currentStepIdx].process_template_steps?.description || ''}
                        onDataChange={(data) => {
                          setStepFormData(data)
                        }}
                      />
                    )}

                    {(stepType === 'manipulation' || stepType === 'incubation' || stepType === 'measurement') && (
                      <ManipulationForm
                        stepName={activeSteps[currentStepIdx].process_template_steps?.step_name || 'Манипуляция'}
                        description={activeSteps[currentStepIdx].process_template_steps?.description || ''}
                        expectedDuration={activeSteps[currentStepIdx].process_template_steps?.expected_duration_minutes}
                        onDataChange={(data) => {
                          setStepFormData(data)
                        }}
                      />
                    )}

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Примечания</label>
                      <textarea
                        value={stepForm.notes}
                        onChange={(e) => setStepForm({...stepForm, notes: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                        rows={2}
                        placeholder="Комментарии к выполнению шага..."
                      />
                    </div>

                    {/* SOP Confirmation */}
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={stepForm.sop_confirmed}
                        onChange={(e) => setStepForm({...stepForm, sop_confirmed: e.target.checked})}
                        className="w-4 h-4 text-emerald-600"
                      />
                      <span className="text-sm font-medium">Подтверждаю ознакомление с СОП</span>
                    </label>

                    {/* Complete button */}
                    <button
                      onClick={completeCurrentStep}
                      disabled={executingStep}
                      className="w-full py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {executingStep ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      Завершить шаг
                    </button>
                  </div>
                )
              })()}
            </div>
          )}
        </div>
      )}

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
          {/* UX-4: Empty state */}
          {containers.length === 0 && (
            <div className="p-8 text-center">
              <Package className="h-12 w-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">Контейнеры ещё не созданы</p>
              <p className="text-sm text-slate-400 mt-1">Контейнеры будут созданы при выполнении шага "Высев клеток"</p>
            </div>
          )}
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

              {/* ЗАДАЧА 2: Множественные группы контейнеров */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-medium">Конфигурация дочерних контейнеров</label>
                  <button
                    type="button"
                    onClick={addContainerGroup}
                    className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                  >
                    + Добавить группу
                  </button>
                </div>
                
                <div className="space-y-3">
                  {containerGroups.map((group, idx) => (
                    <div key={idx} className="flex gap-3 items-end p-3 border border-slate-200 rounded-lg bg-slate-50">
                      <div className="flex-1">
                        <label className="block text-xs text-slate-500 mb-1">Тип</label>
                        <select
                          value={group.type_id || ''}
                          onChange={e => updateContainerGroup(idx, 'type_id', e.target.value ? parseInt(e.target.value) : null)}
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                        >
                          <option value="">Тот же тип</option>
                          {containerTypes.map(t => (
                            <option key={t.id} value={t.id}>
                              {t.type_name} {t.surface_area_cm2 ? `(${t.surface_area_cm2} см²)` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="w-24">
                        <label className="block text-xs text-slate-500 mb-1">Кол-во</label>
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={group.count}
                          onChange={e => updateContainerGroup(idx, 'count', parseInt(e.target.value) || 1)}
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                        />
                      </div>
                      {containerGroups.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeContainerGroup(idx)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded"
                          title="Удалить группу"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-3 space-y-2">
                <p className="text-sm text-purple-800 font-medium">
                  Итого будет создано:
                </p>
                {containerGroups.map((g, i) => {
                  const type = containerTypes.find(t => t.id === g.type_id)
                  const typeName = type?.type_name || 'того же типа'
                  const area = (type as any)?.surface_area_cm2 || 0
                  return (
                    <p key={i} className="text-sm text-purple-700">
                      • {g.count}× {typeName} {area ? `(${area * g.count} см²)` : ''}
                    </p>
                  )
                })}
                <div className="pt-2 border-t border-purple-200 mt-2">
                  <p className="text-xs text-purple-600">
                    📐 Общая площадь: <strong>{getTotalArea().toLocaleString()} см²</strong>
                    {getTotalArea() >= 500 && <span className="ml-2 text-emerald-600">✓ Scale-up</span>}
                  </p>
                  <p className="text-xs text-purple-600">
                    Split ratio: 1:{getTotalChildCount() / Math.max(selectedContainers.length, 1)}
                  </p>
                  {getTotalArea() > 0 && (
                    <div className="mt-2 pt-2 border-t border-purple-200">
                      <p className="text-xs text-purple-700 font-medium mb-1">💡 Подсказка по плотности посева:</p>
                      <p className="text-xs text-purple-600">
                        При 5000 кл/см² нужно: <strong>{((getTotalArea() * 5000) / 1000000).toFixed(2)}M клеток</strong>
                      </p>
                      <p className="text-xs text-purple-600">
                        При 10000 кл/см² нужно: <strong>{((getTotalArea() * 10000) / 1000000).toFixed(2)}M клеток</strong>
                      </p>
                    </div>
                  )}
                </div>
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

      {/* QR Scanner Modal */}
      <QRScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={(code) => {
          setScannedEquipment(code)
          setShowScanner(false)
        }}
        title="Сканировать оборудование"
        expectedPrefix="EQP-"
      />
    </div>
  )
}
