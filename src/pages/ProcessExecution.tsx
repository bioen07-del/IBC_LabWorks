import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { getCurrentUserId } from '@/hooks/useAuth'
import { sendTelegramNotification } from '@/lib/telegram'
import { Database } from '@/lib/database.types'
import { Play, CheckCircle, Clock, Pause, XCircle, ChevronRight, AlertTriangle, Beaker, FlaskConical, QrCode, AlertCircle, GitBranch, ArrowRight } from 'lucide-react'
import { CellCountingForm, MediaChangeForm, BankingForm, PassageForm, ObservationForm, ManipulationForm } from '@/components/processes/step-forms'
import { QRScanner } from '@/components/ui/QRScanner'

type ExecutedProcess = Database['public']['Tables']['executed_processes']['Row'] & {
  process_templates?: { name: string; template_code: string } | null
  cultures?: {
    culture_code: string
    culture_type: string | null
    donations?: {
      donation_code: string
      donors?: { donor_code: string; full_name: string | null } | null
    } | null
    orders?: { order_code: string; client_name: string } | null
  } | null
  users?: { full_name: string | null } | null
}

type ExecutedStep = Database['public']['Tables']['executed_steps']['Row'] & {
  process_template_steps?: { step_name: string; step_type: string; expected_duration_minutes: number; cca_rules: any; is_critical: boolean } | null
  users?: { full_name: string | null } | null
}

type ProcessTemplate = Database['public']['Tables']['process_templates']['Row']
type ProcessTemplateStep = Database['public']['Tables']['process_template_steps']['Row']
type Culture = Database['public']['Tables']['cultures']['Row']

const statusLabels: Record<string, string> = {
  in_progress: 'В процессе',
  completed: 'Завершён',
  paused: 'Приостановлен',
  aborted: 'Прерван'
}

const statusColors: Record<string, string> = {
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-emerald-100 text-emerald-800',
  paused: 'bg-amber-100 text-amber-800',
  aborted: 'bg-red-100 text-red-800'
}

const stepStatusLabels: Record<string, string> = {
  pending: 'Ожидает',
  in_progress: 'Выполняется',
  completed: 'Выполнен',
  failed: 'Ошибка'
}

export function ProcessExecutionPage() {
  const [processes, setProcesses] = useState<ExecutedProcess[]>([])
  const [templates, setTemplates] = useState<ProcessTemplate[]>([])
  const [templateSteps, setTemplateSteps] = useState<ProcessTemplateStep[]>([])
  const [cultures, setCultures] = useState<Culture[]>([])
  const [loading, setLoading] = useState(true)
  
  // Modal states
  const [showStartModal, setShowStartModal] = useState(false)
  const [showExecuteModal, setShowExecuteModal] = useState(false)
  const [selectedProcess, setSelectedProcess] = useState<ExecutedProcess | null>(null)
  const [executedSteps, setExecutedSteps] = useState<ExecutedStep[]>([])
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  
  // Start process form
  const [startForm, setStartForm] = useState({
    template_id: null as number | null,
    culture_id: null as number | null
  })

  // Step execution form
  const [stepForm, setStepForm] = useState({
    notes: '',
    recorded_parameters: {} as Record<string, any>,
    sop_confirmed: false,
    viability_percent: '',
    cell_concentration: ''
  })
  const [ccaWarning, setCcaWarning] = useState<{ passed: boolean; message: string } | null>(null)
  
  // Step form data from specialized forms
  const [stepFormData, setStepFormData] = useState<any>(null)

  // QR Scanner state
  const [showScanner, setShowScanner] = useState(false)
  const [scannedEquipment, setScannedEquipment] = useState<string | null>(null)

  // Timer state
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Start timer when step begins
  useEffect(() => {
    const step = executedSteps[currentStepIndex]
    if (step?.status === 'in_progress' && step.started_at) {
      const startTime = new Date(step.started_at).getTime()
      const updateTimer = () => {
        const now = Date.now()
        setElapsedSeconds(Math.floor((now - startTime) / 1000))
      }
      updateTimer()
      timerRef.current = setInterval(updateTimer, 1000)
    } else {
      setElapsedSeconds(0)
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [currentStepIndex, executedSteps])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    const [{ data: processesData }, { data: templatesData }, { data: stepsData }, { data: culturesData }] = await Promise.all([
      supabase
        .from('executed_processes')
        .select(`
          *,
          process_templates(name, template_code),
          cultures(
            culture_code,
            culture_type,
            donations(
              donation_code,
              donors(donor_code, full_name)
            ),
            orders(order_code, client_name)
          ),
          users(full_name)
        `)
        .order('started_at', { ascending: false }),
      supabase.from('process_templates').select('*').eq('is_active', true).order('name'),
      supabase.from('process_template_steps').select('*').order('step_number'),
      supabase.from('cultures').select('*').eq('status', 'active').order('culture_code')
    ])
    setProcesses(processesData || [])
    setTemplates(templatesData || [])
    setTemplateSteps(stepsData || [])
    setCultures(culturesData || [])
    setLoading(false)
  }

  async function startProcess() {
    if (!startForm.template_id || !startForm.culture_id) return

    const year = new Date().getFullYear()
    const { count } = await supabase
      .from('executed_processes')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${year}-01-01`)
    const processNumber = String((count || 0) + 1).padStart(4, '0')
    const processCode = `PROC-${year}-${processNumber}`

    const { data: process, error } = await supabase
      .from('executed_processes')
      .insert({
        process_code: processCode,
        process_template_id: startForm.template_id,
        culture_id: startForm.culture_id,
        started_by_user_id: getCurrentUserId(),
        started_at: new Date().toISOString(),
        status: 'in_progress' as const
      })
      .select(`
        *,
        process_templates(name, template_code),
        cultures(
          culture_code,
          culture_type,
          donations(
            donation_code,
            donors(donor_code, full_name)
          ),
          orders(order_code, client_name)
        ),
        users(full_name)
      `)
      .single()

    if (error) {
      alert('Ошибка при запуске процесса')
      return
    }

    // Create executed steps for each template step
    const steps = templateSteps.filter(s => s.process_template_id === startForm.template_id)
    for (const step of steps) {
      await supabase.from('executed_steps').insert({
        executed_process_id: process.id,
        process_template_step_id: step.id,
        status: 'pending'
      })
    }

    setShowStartModal(false)
    setStartForm({ template_id: null, culture_id: null })
    fetchData()
    
    // Open execution modal for new process
    openExecuteModal(process)
  }

  async function openExecuteModal(process: ExecutedProcess) {
    setSelectedProcess(process)
    
    const { data: steps } = await supabase
      .from('executed_steps')
      .select('*, process_template_steps(step_name, step_type, expected_duration_minutes, cca_rules, is_critical), users(full_name)')
      .eq('executed_process_id', process.id)
      .order('id')
    
    setExecutedSteps(steps || [])
    
    // Find current step (first pending or in_progress)
    const idx = (steps || []).findIndex(s => s.status === 'pending' || s.status === 'in_progress')
    setCurrentStepIndex(idx >= 0 ? idx : 0)
    setStepForm({ notes: '', recorded_parameters: {}, sop_confirmed: false, viability_percent: '', cell_concentration: '' })
    setCcaWarning(null)
    setShowExecuteModal(true)
  }

  async function startStep() {
    const step = executedSteps[currentStepIndex]
    if (!step) return

    await supabase
      .from('executed_steps')
      .update({ status: 'in_progress', started_at: new Date().toISOString() })
      .eq('id', step.id)

    // Refresh steps
    const { data: steps } = await supabase
      .from('executed_steps')
      .select('*, process_template_steps(step_name, step_type, expected_duration_minutes, cca_rules, is_critical), users(full_name)')
      .eq('executed_process_id', selectedProcess!.id)
      .order('id')
    setExecutedSteps(steps || [])
  }

  // CCA проверка критериев
  function checkCCA(step: ExecutedStep): { passed: boolean; message: string; results: any } {
    const rules = step.process_template_steps?.cca_rules
    const viability = parseFloat(stepForm.viability_percent) || 0
    const concentration = parseFloat(stepForm.cell_concentration) || 0
    const results: any = { viability, concentration, checks: [] }
    let passed = true
    let messages: string[] = []

    // Проверка viability (по умолчанию ≥80%)
    if (stepForm.viability_percent) {
      const minViability = rules?.min_viability ?? 80
      if (viability < minViability) {
        passed = false
        messages.push(`Viability ${viability}% < ${minViability}%`)
        results.checks.push({ param: 'viability', passed: false, value: viability, min: minViability })
      } else {
        results.checks.push({ param: 'viability', passed: true, value: viability, min: minViability })
      }
    }

    // Проверка концентрации (если указаны лимиты)
    if (stepForm.cell_concentration && rules?.min_concentration) {
      if (concentration < rules.min_concentration) {
        passed = false
        messages.push(`Концентрация ${concentration} < ${rules.min_concentration}`)
        results.checks.push({ param: 'concentration', passed: false, value: concentration, min: rules.min_concentration })
      } else {
        results.checks.push({ param: 'concentration', passed: true, value: concentration })
      }
    }

    return { passed, message: messages.join('; ') || 'Все проверки пройдены', results }
  }

  // Создание Deviation при CCA fail
  async function createDeviationForCCAFail(step: ExecutedStep, ccaResult: any) {
    const year = new Date().getFullYear()
    const { count } = await supabase.from('deviations').select('*', { count: 'exact', head: true }).gte('created_at', `${year}-01-01`)
    const devCode = `DEV-${year}-${String((count || 0) + 1).padStart(4, '0')}`

    await supabase.from('deviations').insert({
      deviation_code: devCode,
      deviation_type: 'cca_fail' as const,
      severity: step.process_template_steps?.is_critical ? 'critical' as const : 'major' as const,
      description: `CCA fail при выполнении шага "${step.process_template_steps?.step_name}": ${ccaResult.message}`,
      detected_by_user_id: getCurrentUserId(),
      detected_at: new Date().toISOString(),
      culture_id: selectedProcess?.culture_id || null,
      executed_step_id: step.id,
      status: 'open' as const,
      qp_review_required: true
    })

    // Создаём задачу для QP
    const taskCode = `TASK-${year}-${String(Date.now()).slice(-6)}`
    await supabase.from('tasks').insert({
      task_code: taskCode,
      task_type: 'investigation',
      priority: step.process_template_steps?.is_critical ? 'critical' : 'high',
      title: `CCA fail: ${step.process_template_steps?.step_name}`,
      description: `Требуется решение QP по отклонению ${devCode}. ${ccaResult.message}`,
      assigned_to_role: 'qp',
      culture_id: selectedProcess?.culture_id || null,
      status: 'pending'
    })
  }

  async function completeStep() {
    const step = executedSteps[currentStepIndex]
    if (!step) return

    // CCA проверка
    const ccaResult = checkCCA(step)
    setCcaWarning(ccaResult)

    const recordedParams = {
      ...stepForm.recorded_parameters,
      viability_percent: stepForm.viability_percent ? parseFloat(stepForm.viability_percent) : null,
      cell_concentration: stepForm.cell_concentration ? parseFloat(stepForm.cell_concentration) : null
    }

    await supabase
      .from('executed_steps')
      .update({
        status: ccaResult.passed ? 'completed' as const : 'failed' as const,
        completed_at: new Date().toISOString(),
        notes: stepForm.notes || null,
        recorded_parameters: recordedParams,
        sop_confirmed_at: stepForm.sop_confirmed ? new Date().toISOString() : null,
        cca_passed: ccaResult.passed,
        cca_results: ccaResult.results
      })
      .eq('id', step.id)

    // Если CCA fail - создаём Deviation
    if (!ccaResult.passed) {
      await createDeviationForCCAFail(step, ccaResult)
    }

    // Отправка уведомления в Telegram
    try {
      const stepName = step.process_template_steps?.step_name || 'Шаг'
      const processCode = selectedProcess?.process_code || ''
      const message = ccaResult.passed 
        ? `✅ Шаг "${stepName}" завершён (${processCode})`
        : `⚠️ CCA fail: "${stepName}" (${processCode}). Требуется решение QP.`
      await sendTelegramNotification(message, ccaResult.passed ? 'info' : 'warning')
    } catch (e) {
      console.error('Telegram notification failed:', e)
    }

    // Check if all steps completed
    const { data: steps } = await supabase
      .from('executed_steps')
      .select('*, process_template_steps(step_name, step_type, expected_duration_minutes, cca_rules, is_critical), users(full_name)')
      .eq('executed_process_id', selectedProcess!.id)
      .order('id')
    setExecutedSteps(steps || [])

    const allCompleted = (steps || []).every(s => s.status === 'completed')
    if (allCompleted) {
      await supabase
        .from('executed_processes')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', selectedProcess!.id)
      setShowExecuteModal(false)
      fetchData()
    } else {
      // Move to next step
      const nextIdx = (steps || []).findIndex(s => s.status === 'pending')
      setCurrentStepIndex(nextIdx >= 0 ? nextIdx : currentStepIndex + 1)
      setStepForm({ notes: '', recorded_parameters: {}, sop_confirmed: false, viability_percent: '', cell_concentration: '' })
      setCcaWarning(null)
    }
  }

  // Render specialized step forms based on step_type
  function renderStepForm() {
    const step = executedSteps[currentStepIndex]
    if (!step || !selectedProcess?.culture_id) return null
    
    const stepType = step.process_template_steps?.step_type
    const isCritical = step.process_template_steps?.is_critical
    
    return (
      <>
        {/* Critical step warning */}
        {isCritical && (
          <div className="bg-red-50 border border-red-300 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">⚠️ Критический шаг</p>
              <p className="text-xs text-red-700">Данные проверяются CCA. При fail контейнеры блокируются.</p>
            </div>
          </div>
        )}
        
        {stepType === 'cell_counting' && (
          <CellCountingForm
            cultureId={selectedProcess.culture_id}
            stepId={step.id}
            onDataChange={(data) => {
              setStepFormData(data)
              // Update main form with aggregated data
              setStepForm(prev => ({
                ...prev,
                viability_percent: data.avgViability.toString(),
                cell_concentration: (data.totalCells / 1000000).toString()
              }))
            }}
          />
        )}
        
        {stepType === 'media_change' && (
          <MediaChangeForm
            cultureId={selectedProcess.culture_id}
            onDataChange={(data) => {
              setStepFormData(data)
              setStepForm(prev => ({
                ...prev,
                recorded_parameters: { ...prev.recorded_parameters, ...data }
              }))
            }}
          />
        )}
        
        {stepType === 'banking' && (
          <BankingForm
            cultureId={selectedProcess.culture_id}
            onDataChange={(data) => {
              setStepFormData(data)
              setStepForm(prev => ({
                ...prev,
                recorded_parameters: { ...prev.recorded_parameters, ...data }
              }))
            }}
          />
        )}

        {stepType === 'passage' && (
          <PassageForm
            cultureId={selectedProcess.culture_id}
            sourceContainerIds={stepForm.recorded_parameters.source_containers || []}
            onDataChange={(data) => {
              setStepFormData(data)
              setStepForm(prev => ({
                ...prev,
                recorded_parameters: { ...prev.recorded_parameters, ...data }
              }))
            }}
          />
        )}

        {stepType === 'observation' && (
          <ObservationForm
            stepName={step.process_template_steps?.step_name || 'Осмотр'}
            description={step.process_template_steps?.description || ''}
            onDataChange={(data) => {
              setStepFormData(data)
              setStepForm(prev => ({
                ...prev,
                recorded_parameters: { ...prev.recorded_parameters, ...data }
              }))
            }}
          />
        )}

        {(stepType === 'manipulation' || stepType === 'incubation' || stepType === 'measurement') && (
          <ManipulationForm
            stepName={step.process_template_steps?.step_name || 'Манипуляция'}
            description={step.process_template_steps?.description || ''}
            expectedDuration={step.process_template_steps?.expected_duration_minutes}
            onDataChange={(data) => {
              setStepFormData(data)
              setStepForm(prev => ({
                ...prev,
                recorded_parameters: { ...prev.recorded_parameters, ...data }
              }))
            }}
          />
        )}
      </>
    )
  }

  const activeProcesses = processes.filter(p => p.status === 'in_progress' || p.status === 'paused')
  const completedProcesses = processes.filter(p => p.status === 'completed' || p.status === 'aborted')
  const currentStep = executedSteps[currentStepIndex]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Исполнение процессов</h1>
          <p className="text-slate-500">Запуск и пошаговое выполнение технологических процессов</p>
        </div>
        <button
          onClick={() => setShowStartModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
        >
          <Play className="h-4 w-4" />
          Запустить процесс
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Загрузка...</div>
      ) : (
        <>
          {/* Active processes */}
          {activeProcesses.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 bg-blue-50 border-b border-slate-200">
                <h2 className="font-semibold text-blue-800 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Активные процессы
                </h2>
              </div>
              <div className="divide-y divide-slate-200">
                {activeProcesses.map(process => (
                  <div key={process.id} className="p-4 hover:bg-slate-50 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-medium">{process.process_code}</span>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${statusColors[process.status]}`}>
                          {statusLabels[process.status]}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 mt-1">
                        {process.process_templates?.name} • Культура: {process.cultures?.culture_code}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Начат: {new Date(process.started_at).toLocaleString('ru')}
                      </p>
                    </div>
                    <button
                      onClick={() => openExecuteModal(process)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Продолжить
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed processes */}
          {completedProcesses.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                <h2 className="font-semibold text-slate-700">Завершённые процессы</h2>
              </div>
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Код</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Шаблон</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Культура</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Статус</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Завершён</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {completedProcesses.slice(0, 10).map(process => (
                    <tr key={process.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-sm">{process.process_code}</td>
                      <td className="px-4 py-3 text-sm">{process.process_templates?.name}</td>
                      <td className="px-4 py-3 text-sm">{process.cultures?.culture_code}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${statusColors[process.status]}`}>
                          {statusLabels[process.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {process.completed_at ? new Date(process.completed_at).toLocaleString('ru') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {processes.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
              <FlaskConical className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500">Нет запущенных процессов</p>
            </div>
          )}
        </>
      )}

      {/* Start Process Modal */}
      {showStartModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Запустить процесс</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Шаблон процесса *</label>
                <select
                  value={startForm.template_id || ''}
                  onChange={(e) => setStartForm({...startForm, template_id: e.target.value ? parseInt(e.target.value) : null})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="">Выберите шаблон</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.template_code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Культура *</label>
                <select
                  value={startForm.culture_id || ''}
                  onChange={(e) => setStartForm({...startForm, culture_id: e.target.value ? parseInt(e.target.value) : null})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="">Выберите культуру</option>
                  {cultures.map(c => (
                    <option key={c.id} value={c.id}>{c.culture_code} ({c.cell_type})</option>
                  ))}
                </select>
              </div>

              {startForm.template_id && (
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-sm text-slate-600">
                    Шагов: {templateSteps.filter(s => s.process_template_id === startForm.template_id).length}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowStartModal(false)}
                className="px-4 py-2 text-slate-600 hover:text-slate-800"
              >
                Отмена
              </button>
              <button
                onClick={startProcess}
                disabled={!startForm.template_id || !startForm.culture_id}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                Запустить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Execute Process Modal */}
      {showExecuteModal && selectedProcess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-blue-50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-blue-900">{selectedProcess.process_code}</h2>
                  <p className="text-sm text-blue-700">{selectedProcess.process_templates?.name}</p>
                </div>
                <button
                  onClick={() => setShowExecuteModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Цепочка прослеживаемости */}
              {selectedProcess.cultures && (
                <div className="bg-white/50 rounded-lg p-3 mt-3">
                  <h4 className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1">
                    <GitBranch className="h-3 w-3" />
                    Цепочка прослеживаемости
                  </h4>
                  <div className="flex items-center gap-2 text-xs flex-wrap">
                    {selectedProcess.cultures.donations?.donors && (
                      <>
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded font-mono">
                          {selectedProcess.cultures.donations.donors.donor_code}
                        </span>
                        <ArrowRight className="h-3 w-3 text-slate-400" />
                      </>
                    )}
                    {selectedProcess.cultures.donations && (
                      <>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-mono">
                          {selectedProcess.cultures.donations.donation_code}
                        </span>
                        <ArrowRight className="h-3 w-3 text-slate-400" />
                      </>
                    )}
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded font-mono">
                      {selectedProcess.cultures.culture_code}
                    </span>
                    {selectedProcess.cultures.culture_type && (
                      <span className="px-2 py-1 bg-cyan-100 text-cyan-700 rounded text-[10px]">
                        {selectedProcess.cultures.culture_type === 'master_bank' && 'Мастер-банк'}
                        {selectedProcess.cultures.culture_type === 'working_bank' && 'Рабочий банк'}
                        {selectedProcess.cultures.culture_type === 'standard' && 'Стандарт'}
                      </span>
                    )}
                    {selectedProcess.cultures.orders && (
                      <>
                        <ArrowRight className="h-3 w-3 text-slate-400" />
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded font-mono">
                          {selectedProcess.cultures.orders.order_code}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Step progress */}
              <div className="flex items-center gap-1 mt-4 overflow-x-auto pb-2">
                {executedSteps.map((step, idx) => (
                  <div
                    key={step.id}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs whitespace-nowrap ${
                      idx === currentStepIndex
                        ? 'bg-blue-600 text-white'
                        : step.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {step.status === 'completed' && <CheckCircle className="h-3 w-3" />}
                    {step.process_template_steps?.is_critical && <span className="text-red-500">●</span>}
                    {idx + 1}. {step.process_template_steps?.step_name}
                  </div>
                ))}
              </div>
            </div>

            {/* Current step content */}
            <div className="flex-1 overflow-y-auto p-6">
              {currentStep ? (
                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-bold flex items-center gap-2">
                          Шаг {currentStepIndex + 1}: {currentStep.process_template_steps?.step_name}
                          {currentStep.process_template_steps?.is_critical && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">⚠️ КРИТИЧЕСКИЙ</span>
                          )}
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">
                          Тип: {currentStep.process_template_steps?.step_type} • 
                          Ожидаемое время: {currentStep.process_template_steps?.expected_duration_minutes} мин
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        currentStep.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        currentStep.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {stepStatusLabels[currentStep.status]}
                      </span>
                    </div>
                  </div>

                  {currentStep.status === 'pending' && (
                    <button
                      onClick={startStep}
                      className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                    >
                      <Play className="h-5 w-5" />
                      Начать выполнение шага
                    </button>
                  )}

                  {currentStep.status === 'in_progress' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-blue-700">
                            <Clock className="h-4 w-4 inline mr-1" />
                            Шаг начат: {currentStep.started_at ? new Date(currentStep.started_at).toLocaleTimeString('ru') : '-'}
                          </p>
                          <div className="text-right">
                            <div className="text-2xl font-mono font-bold text-blue-800">{formatTime(elapsedSeconds)}</div>
                            <div className="text-xs text-blue-600">
                              Ожидаемое: {currentStep.process_template_steps?.expected_duration_minutes || 0} мин
                            </div>
                          </div>
                        </div>
                        {currentStep.process_template_steps?.expected_duration_minutes && 
                         elapsedSeconds < (currentStep.process_template_steps.expected_duration_minutes * 60) && (
                          <div className="mt-2 bg-amber-100 text-amber-800 text-xs p-2 rounded">
                            ⏱️ Минимальное время ещё не прошло
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="flex items-center gap-2 mb-3">
                          <input
                            type="checkbox"
                            checked={stepForm.sop_confirmed}
                            onChange={(e) => setStepForm({...stepForm, sop_confirmed: e.target.checked})}
                            className="w-4 h-4 text-emerald-600"
                          />
                          <span className="text-sm font-medium">Подтверждаю ознакомление с СОП</span>
                        </label>
                      </div>

                      {/* Equipment Scan */}
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
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

                      {/* Specialized Step Forms */}
                      {renderStepForm()}

                      {/* Fallback CCA параметры (if no specialized form) */}
                      {!['cell_counting', 'media_change', 'banking'].includes(currentStep.process_template_steps?.step_type || '') && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                          <h4 className="font-medium text-amber-800 mb-3 flex items-center gap-2">
                            <Beaker className="h-4 w-4" />
                            CCA параметры (Critical Control Attributes)
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-1">Viability, %</label>
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="100"
                                value={stepForm.viability_percent}
                                onChange={(e) => setStepForm({...stepForm, viability_percent: e.target.value})}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                placeholder="напр. 85.5"
                              />
                              <p className="text-xs text-slate-500 mt-1">Минимум: 80%</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">Концентрация кл/мл</label>
                              <input
                                type="number"
                                step="1000"
                                min="0"
                                value={stepForm.cell_concentration}
                                onChange={(e) => setStepForm({...stepForm, cell_concentration: e.target.value})}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                placeholder="напр. 500000"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* CCA Warning */}
                      {ccaWarning && !ccaWarning.passed && (
                        <div className="bg-red-50 border border-red-300 rounded-lg p-4">
                          <h4 className="font-bold text-red-800 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            CCA FAIL - Отклонение создано
                          </h4>
                          <p className="text-sm text-red-700 mt-1">{ccaWarning.message}</p>
                          <p className="text-xs text-red-600 mt-2">Задача назначена QP для принятия решения</p>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium mb-1">Примечания</label>
                        <textarea
                          value={stepForm.notes}
                          onChange={(e) => setStepForm({...stepForm, notes: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                          rows={3}
                          placeholder="Комментарии к выполнению шага..."
                        />
                      </div>

                      <button
                        onClick={completeStep}
                        className="w-full py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="h-5 w-5" />
                        Завершить шаг
                      </button>
                    </div>
                  )}

                  {currentStep.status === 'completed' && (
                    <div className="text-center py-8 text-emerald-600">
                      <CheckCircle className="h-12 w-12 mx-auto mb-2" />
                      <p className="font-medium">Шаг выполнен</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CheckCircle className="h-16 w-16 mx-auto mb-4 text-emerald-500" />
                  <h3 className="text-xl font-bold text-emerald-800">Процесс завершён!</h3>
                  <p className="text-slate-500 mt-2">Все шаги выполнены успешно</p>
                </div>
              )}
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
