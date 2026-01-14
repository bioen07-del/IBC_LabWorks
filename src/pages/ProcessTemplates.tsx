import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/database.types'
import { 
  Plus, Edit2, Trash2, ChevronDown, ChevronUp, Save, X, 
  FileText, Clock, AlertTriangle, Beaker, CheckCircle, List
} from 'lucide-react'

type ProcessTemplate = Database['public']['Tables']['process_templates']['Row']
type ProcessTemplateStep = Database['public']['Tables']['process_template_steps']['Row']
type SOP = Database['public']['Tables']['sops']['Row']

const stepTypeLabels: Record<string, string> = {
  measurement: 'Измерение',
  manipulation: 'Манипуляция',
  incubation: 'Инкубация',
  observation: 'Наблюдение'
}

const stepTypeColors: Record<string, string> = {
  measurement: 'bg-blue-100 text-blue-700',
  manipulation: 'bg-purple-100 text-purple-700',
  incubation: 'bg-amber-100 text-amber-700',
  observation: 'bg-emerald-100 text-emerald-700'
}

export function ProcessTemplatesPage() {
  const [templates, setTemplates] = useState<ProcessTemplate[]>([])
  const [steps, setSteps] = useState<ProcessTemplateStep[]>([])
  const [sops, setSops] = useState<SOP[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedTemplate, setExpandedTemplate] = useState<number | null>(null)
  
  // Modal states
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showStepModal, setShowStepModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<ProcessTemplate | null>(null)
  const [editingStep, setEditingStep] = useState<ProcessTemplateStep | null>(null)
  const [currentTemplateId, setCurrentTemplateId] = useState<number | null>(null)
  
  // Form states
  const [templateForm, setTemplateForm] = useState({
    template_code: '',
    name: '',
    description: '',
    version: 'v1.0',
    is_active: true,
    estimated_duration_minutes: 30,
    requires_clean_room: true,
    applicable_cell_types: [] as string[],
    is_universal: false,
    applicable_tissue_types: [] as string[]
  })

  const tissueTypeOptions = ['Bone Marrow', 'Adipose', 'Cord Blood', 'Placenta', 'Peripheral Blood', 'Skin', 'Cartilage', 'Other']
  
  const [stepForm, setStepForm] = useState({
    step_number: 1,
    step_name: '',
    step_type: 'manipulation' as string,
    description: '',
    expected_duration_minutes: 5,
    is_critical: false,
    requires_equipment_scan: false,
    requires_sop_confirmation: false,
    sop_id: null as number | null,
    required_parameters: {} as Record<string, any>,
    cca_rules: {} as Record<string, any>
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    const [{ data: templatesData }, { data: stepsData }, { data: sopsData }] = await Promise.all([
      supabase.from('process_templates').select('*').order('name'),
      supabase.from('process_template_steps').select('*').order('process_template_id, step_number'),
      supabase.from('sops').select('*').eq('is_active', true).order('sop_name')
    ])
    setTemplates(templatesData || [])
    setSteps(stepsData || [])
    setSops(sopsData || [])
    setLoading(false)
  }

  function getStepsForTemplate(templateId: number): ProcessTemplateStep[] {
    return steps.filter(s => s.process_template_id === templateId).sort((a, b) => a.step_number - b.step_number)
  }

  function openTemplateModal(template?: ProcessTemplate) {
    if (template) {
      setEditingTemplate(template)
      setTemplateForm({
        template_code: template.template_code,
        name: template.name,
        description: template.description || '',
        version: template.version || 'v1.0',
        is_active: template.is_active,
        estimated_duration_minutes: template.estimated_duration_minutes || 30,
        requires_clean_room: template.requires_clean_room || false,
        applicable_cell_types: (template.applicable_cell_types as string[]) || [],
        is_universal: (template as any).is_universal || false,
        applicable_tissue_types: ((template as any).applicable_tissue_types as string[]) || []
      })
    } else {
      setEditingTemplate(null)
      setTemplateForm({
        template_code: '',
        name: '',
        description: '',
        version: 'v1.0',
        is_active: true,
        estimated_duration_minutes: 30,
        requires_clean_room: true,
        applicable_cell_types: [],
        is_universal: false,
        applicable_tissue_types: []
      })
    }
    setShowTemplateModal(true)
  }

  function openStepModal(templateId: number, step?: ProcessTemplateStep) {
    setCurrentTemplateId(templateId)
    const templateSteps = getStepsForTemplate(templateId)
    
    if (step) {
      setEditingStep(step)
      setStepForm({
        step_number: step.step_number,
        step_name: step.step_name,
        step_type: step.step_type,
        description: step.description || '',
        expected_duration_minutes: step.expected_duration_minutes || 5,
        is_critical: step.is_critical || false,
        requires_equipment_scan: step.requires_equipment_scan || false,
        requires_sop_confirmation: step.requires_sop_confirmation || false,
        sop_id: step.sop_id,
        required_parameters: (step.required_parameters as Record<string, any>) || {},
        cca_rules: (step.cca_rules as Record<string, any>) || {}
      })
    } else {
      setEditingStep(null)
      setStepForm({
        step_number: templateSteps.length + 1,
        step_name: '',
        step_type: 'manipulation',
        description: '',
        expected_duration_minutes: 5,
        is_critical: false,
        requires_equipment_scan: false,
        requires_sop_confirmation: false,
        sop_id: null,
        required_parameters: {},
        cca_rules: {}
      })
    }
    setShowStepModal(true)
  }

  async function saveTemplate() {
    const payload = {
      template_code: templateForm.template_code,
      name: templateForm.name,
      description: templateForm.description || null,
      version: templateForm.version,
      is_active: templateForm.is_active,
      estimated_duration_minutes: templateForm.estimated_duration_minutes,
      requires_clean_room: templateForm.requires_clean_room,
      applicable_cell_types: templateForm.applicable_cell_types,
      is_universal: templateForm.is_universal,
      applicable_tissue_types: templateForm.applicable_tissue_types
    }

    if (editingTemplate) {
      await supabase.from('process_templates').update(payload).eq('id', editingTemplate.id)
    } else {
      await supabase.from('process_templates').insert(payload)
    }
    
    setShowTemplateModal(false)
    fetchData()
  }

  async function saveStep() {
    if (!currentTemplateId) return

    const payload = {
      process_template_id: currentTemplateId,
      step_number: stepForm.step_number,
      step_name: stepForm.step_name,
      step_type: stepForm.step_type as 'measurement' | 'manipulation' | 'incubation' | 'observation',
      description: stepForm.description || null,
      expected_duration_minutes: stepForm.expected_duration_minutes,
      is_critical: stepForm.is_critical,
      requires_equipment_scan: stepForm.requires_equipment_scan,
      requires_sop_confirmation: stepForm.requires_sop_confirmation,
      sop_id: stepForm.sop_id,
      required_parameters: Object.keys(stepForm.required_parameters).length > 0 ? stepForm.required_parameters : null,
      cca_rules: Object.keys(stepForm.cca_rules).length > 0 ? stepForm.cca_rules : null
    }

    if (editingStep) {
      await supabase.from('process_template_steps').update(payload).eq('id', editingStep.id)
    } else {
      await supabase.from('process_template_steps').insert(payload)
    }
    
    setShowStepModal(false)
    fetchData()
  }

  async function deleteTemplate(id: number) {
    if (!confirm('Удалить шаблон процесса? Все шаги также будут удалены.')) return
    await supabase.from('process_template_steps').delete().eq('process_template_id', id)
    await supabase.from('process_templates').delete().eq('id', id)
    fetchData()
  }

  async function deleteStep(id: number) {
    if (!confirm('Удалить шаг?')) return
    await supabase.from('process_template_steps').delete().eq('id', id)
    fetchData()
  }

  // CCA parameter builder
  function addCCARule() {
    const paramName = prompt('Название параметра (например: viability)')
    if (!paramName) return
    const minVal = prompt('Минимальное значение')
    const severity = prompt('Серьёзность (minor / major / critical)', 'major')
    
    setStepForm(prev => ({
      ...prev,
      cca_rules: {
        ...prev.cca_rules,
        [paramName]: { min: parseFloat(minVal || '0'), severity }
      }
    }))
  }

  function addRequiredParameter() {
    const paramName = prompt('Название параметра (например: cell_count)')
    if (!paramName) return
    const paramType = prompt('Тип (number / text / boolean)', 'number')
    const unit = prompt('Единица измерения (опционально)', '')
    
    setStepForm(prev => ({
      ...prev,
      required_parameters: {
        ...prev.required_parameters,
        [paramName]: { type: paramType, unit: unit || undefined, required: true }
      }
    }))
  }

  if (loading) {
    return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Шаблоны процессов</h1>
          <p className="text-slate-500">Определение стандартных операционных процедур</p>
        </div>
        <button
          onClick={() => openTemplateModal()}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          Новый шаблон
        </button>
      </div>

      {/* Templates List */}
      <div className="space-y-4">
        {templates.map(template => {
          const templateSteps = getStepsForTemplate(template.id)
          const isExpanded = expandedTemplate === template.id
          const criticalSteps = templateSteps.filter(s => s.is_critical).length
          
          return (
            <div key={template.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Template Header */}
              <div 
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50"
                onClick={() => setExpandedTemplate(isExpanded ? null : template.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${template.is_active ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                    <FileText className={`h-5 w-5 ${template.is_active ? 'text-emerald-600' : 'text-slate-400'}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">{template.name}</span>
                      <span className="text-xs text-slate-500 font-mono">{template.template_code}</span>
                      <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">{template.version}</span>
                      {!template.is_active && (
                        <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded">Неактивен</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <List className="h-3 w-3" />
                        {templateSteps.length} шагов
                      </span>
                      {criticalSteps > 0 && (
                        <span className="flex items-center gap-1 text-amber-600">
                          <AlertTriangle className="h-3 w-3" />
                          {criticalSteps} критич.
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        ~{template.estimated_duration_minutes} мин
                      </span>
                      {template.requires_clean_room && (
                        <span className="flex items-center gap-1 text-blue-600">
                          <Beaker className="h-3 w-3" />
                          Чистое помещение
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); openTemplateModal(template) }}
                    className="p-2 text-slate-400 hover:text-slate-600"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteTemplate(template.id) }}
                    className="p-2 text-slate-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  {isExpanded ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                </div>
              </div>

              {/* Steps List (expanded) */}
              {isExpanded && (
                <div className="border-t border-slate-200 bg-slate-50">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-slate-700">Шаги процесса</h3>
                      <button
                        onClick={() => openStepModal(template.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                      >
                        <Plus className="h-3 w-3" />
                        Добавить шаг
                      </button>
                    </div>

                    {templateSteps.length === 0 ? (
                      <p className="text-center py-4 text-slate-500">Шаги не добавлены</p>
                    ) : (
                      <div className="space-y-2">
                        {templateSteps.map(step => (
                          <div 
                            key={step.id} 
                            className={`p-3 bg-white rounded-lg border ${step.is_critical ? 'border-amber-300' : 'border-slate-200'}`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
                                <span className="w-6 h-6 flex items-center justify-center bg-slate-100 rounded-full text-sm font-medium">
                                  {step.step_number}
                                </span>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{step.step_name}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded ${stepTypeColors[step.step_type]}`}>
                                      {stepTypeLabels[step.step_type]}
                                    </span>
                                    {step.is_critical && (
                                      <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded flex items-center gap-1">
                                        <AlertTriangle className="h-3 w-3" />
                                        Критический
                                      </span>
                                    )}
                                  </div>
                                  {step.description && (
                                    <p className="text-sm text-slate-500 mt-1">{step.description}</p>
                                  )}
                                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                                    <span>~{step.expected_duration_minutes} мин</span>
                                    {step.requires_equipment_scan && <span className="text-blue-600">📷 Скан оборуд.</span>}
                                    {step.requires_sop_confirmation && <span className="text-purple-600">📋 Подтв. SOP</span>}
                                    {step.cca_rules && Object.keys(step.cca_rules as object).length > 0 && (
                                      <span className="text-amber-600">⚠️ CCA правила</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => openStepModal(template.id, step)}
                                  className="p-1.5 text-slate-400 hover:text-slate-600"
                                >
                                  <Edit2 className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => deleteStep(step.id)}
                                  className="p-1.5 text-slate-400 hover:text-red-600"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {templates.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <FileText className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500">Шаблоны процессов не созданы</p>
            <button
              onClick={() => openTemplateModal()}
              className="mt-4 text-emerald-600 hover:text-emerald-800"
            >
              Создать первый шаблон
            </button>
          </div>
        )}
      </div>

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{editingTemplate ? 'Редактировать шаблон' : 'Новый шаблон'}</h2>
              <button onClick={() => setShowTemplateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Код *</label>
                  <input
                    type="text"
                    value={templateForm.template_code}
                    onChange={(e) => setTemplateForm({...templateForm, template_code: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder="PROC-PASSAGE-V1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Версия</label>
                  <input
                    type="text"
                    value={templateForm.version}
                    onChange={(e) => setTemplateForm({...templateForm, version: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Название *</label>
                <input
                  type="text"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({...templateForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  placeholder="Пассирование культуры MSC"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Описание</label>
                <textarea
                  value={templateForm.description}
                  onChange={(e) => setTemplateForm({...templateForm, description: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Длительность (мин)</label>
                  <input
                    type="number"
                    value={templateForm.estimated_duration_minutes}
                    onChange={(e) => setTemplateForm({...templateForm, estimated_duration_minutes: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={templateForm.requires_clean_room}
                      onChange={(e) => setTemplateForm({...templateForm, requires_clean_room: e.target.checked})}
                      className="rounded"
                    />
                    <span className="text-sm">Требуется чистое помещение</span>
                  </label>
                  <label className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      checked={templateForm.is_active}
                      onChange={(e) => setTemplateForm({...templateForm, is_active: e.target.checked})}
                      className="rounded"
                    />
                    <span className="text-sm">Активен</span>
                  </label>
                </div>
              </div>

              {/* Universal / Tissue Types */}
              <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                <label className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    checked={templateForm.is_universal}
                    onChange={(e) => setTemplateForm({...templateForm, is_universal: e.target.checked})}
                    className="rounded"
                  />
                  <span className="text-sm font-medium">Универсальный процесс</span>
                  <span className="text-xs text-blue-600">(подкормка, пассаж, заморозка и др.)</span>
                </label>
                
                {!templateForm.is_universal && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Применимые типы ткани</label>
                    <div className="grid grid-cols-2 gap-2">
                      {tissueTypeOptions.map(tissue => (
                        <label key={tissue} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={templateForm.applicable_tissue_types.includes(tissue)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setTemplateForm({...templateForm, applicable_tissue_types: [...templateForm.applicable_tissue_types, tissue]})
                              } else {
                                setTemplateForm({...templateForm, applicable_tissue_types: templateForm.applicable_tissue_types.filter(t => t !== tissue)})
                              }
                            }}
                            className="rounded"
                          />
                          {tissue}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800"
                >
                  Отмена
                </button>
                <button
                  onClick={saveTemplate}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Сохранить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step Modal */}
      {showStepModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{editingStep ? 'Редактировать шаг' : 'Добавить шаг'}</h2>
              <button onClick={() => setShowStepModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">№ шага</label>
                  <input
                    type="number"
                    min="1"
                    value={stepForm.step_number}
                    onChange={(e) => setStepForm({...stepForm, step_number: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Название шага *</label>
                  <input
                    type="text"
                    value={stepForm.step_name}
                    onChange={(e) => setStepForm({...stepForm, step_name: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder="Подсчёт клеток"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Тип шага</label>
                  <select
                    value={stepForm.step_type}
                    onChange={(e) => setStepForm({...stepForm, step_type: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    {Object.entries(stepTypeLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Длительность (мин)</label>
                  <input
                    type="number"
                    value={stepForm.expected_duration_minutes}
                    onChange={(e) => setStepForm({...stepForm, expected_duration_minutes: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Описание</label>
                <textarea
                  value={stepForm.description}
                  onChange={(e) => setStepForm({...stepForm, description: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Связанный SOP</label>
                <select
                  value={stepForm.sop_id || ''}
                  onChange={(e) => setStepForm({...stepForm, sop_id: e.target.value ? parseInt(e.target.value) : null})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="">Не выбран</option>
                  {sops.map(sop => (
                    <option key={sop.id} value={sop.id}>{sop.sop_code} — {sop.title}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={stepForm.is_critical}
                    onChange={(e) => setStepForm({...stepForm, is_critical: e.target.checked})}
                    className="rounded"
                  />
                  <span className="text-sm">Критический шаг</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={stepForm.requires_equipment_scan}
                    onChange={(e) => setStepForm({...stepForm, requires_equipment_scan: e.target.checked})}
                    className="rounded"
                  />
                  <span className="text-sm">Скан оборудования</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={stepForm.requires_sop_confirmation}
                    onChange={(e) => setStepForm({...stepForm, requires_sop_confirmation: e.target.checked})}
                    className="rounded"
                  />
                  <span className="text-sm">Подтверждение SOP</span>
                </label>
              </div>

              {/* Required Parameters */}
              <div className="border border-slate-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Требуемые параметры</span>
                  <button
                    type="button"
                    onClick={addRequiredParameter}
                    className="text-xs text-emerald-600 hover:text-emerald-800"
                  >
                    + Добавить
                  </button>
                </div>
                {Object.keys(stepForm.required_parameters).length > 0 ? (
                  <div className="space-y-1">
                    {Object.entries(stepForm.required_parameters).map(([key, val]: [string, any]) => (
                      <div key={key} className="flex items-center justify-between text-sm bg-slate-50 px-2 py-1 rounded">
                        <span><strong>{key}</strong>: {val.type} {val.unit && `(${val.unit})`}</span>
                        <button
                          onClick={() => {
                            const newParams = {...stepForm.required_parameters}
                            delete newParams[key]
                            setStepForm({...stepForm, required_parameters: newParams})
                          }}
                          className="text-red-500"
                        >×</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Нет параметров</p>
                )}
              </div>

              {/* CCA Rules */}
              <div className="border border-amber-200 rounded-lg p-3 bg-amber-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-amber-800">CCA правила</span>
                  <button
                    type="button"
                    onClick={addCCARule}
                    className="text-xs text-amber-600 hover:text-amber-800"
                  >
                    + Добавить правило
                  </button>
                </div>
                {Object.keys(stepForm.cca_rules).length > 0 ? (
                  <div className="space-y-1">
                    {Object.entries(stepForm.cca_rules).map(([key, val]: [string, any]) => (
                      <div key={key} className="flex items-center justify-between text-sm bg-white px-2 py-1 rounded">
                        <span><strong>{key}</strong>: min={val.min}, severity={val.severity}</span>
                        <button
                          onClick={() => {
                            const newRules = {...stepForm.cca_rules}
                            delete newRules[key]
                            setStepForm({...stepForm, cca_rules: newRules})
                          }}
                          className="text-red-500"
                        >×</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-amber-600">Нет CCA правил</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => setShowStepModal(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800"
                >
                  Отмена
                </button>
                <button
                  onClick={saveStep}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Сохранить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
