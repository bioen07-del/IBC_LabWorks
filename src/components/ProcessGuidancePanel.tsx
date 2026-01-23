import { useState } from 'react'
import { ChevronRight, ChevronDown, AlertTriangle, CheckCircle2, Info, Clock, Beaker, FileText } from 'lucide-react'
import { ProcessGuidance, ProcessStep } from '@/lib/processGuidance'
import Tooltip from '@/components/ui/Tooltip'

interface ProcessGuidancePanelProps {
  guidance: ProcessGuidance
  currentStep?: number
  onStepClick?: (stepNumber: number) => void
  completedSteps?: number[]
}

export function ProcessGuidancePanel({
  guidance,
  currentStep,
  onStepClick,
  completedSteps = []
}: ProcessGuidancePanelProps) {
  const [expandedSteps, setExpandedSteps] = useState<number[]>(currentStep ? [currentStep] : [1])
  const [showOverview, setShowOverview] = useState(true)

  const toggleStep = (stepNumber: number) => {
    setExpandedSteps(prev =>
      prev.includes(stepNumber)
        ? prev.filter(s => s !== stepNumber)
        : [...prev, stepNumber]
    )
  }

  const isStepCompleted = (stepNumber: number) => completedSteps.includes(stepNumber)
  const isStepCurrent = (stepNumber: number) => stepNumber === currentStep

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-1">{guidance.title}</h2>
            <p className="text-blue-100 text-sm">{guidance.description}</p>
          </div>
          {guidance.sopReference && (
            <Tooltip content="Ссылка на SOP">
              <div className="bg-blue-500 bg-opacity-50 px-3 py-1 rounded-full text-xs font-mono">
                {guidance.sopReference}
              </div>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Overview Section */}
      <div className="border-b border-gray-200">
        <button
          onClick={() => setShowOverview(!showOverview)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Info className="w-4 h-4" />
            Обзор процесса
          </div>
          {showOverview ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          )}
        </button>

        {showOverview && (
          <div className="px-4 pb-4 space-y-3">
            {/* Key Info */}
            <div className="grid grid-cols-2 gap-3">
              {guidance.estimatedTime && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Время:</span>
                  <span className="font-medium">{guidance.estimatedTime}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Шагов:</span>
                <span className="font-medium">{guidance.steps.length}</span>
              </div>
            </div>

            {/* Required Equipment */}
            {guidance.requiredEquipment && guidance.requiredEquipment.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                  Необходимое оборудование
                </h4>
                <div className="flex flex-wrap gap-2">
                  {guidance.requiredEquipment.map((item, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Required Materials */}
            {guidance.requiredMaterials && guidance.requiredMaterials.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                  Необходимые материалы
                </h4>
                <div className="flex flex-wrap gap-2">
                  {guidance.requiredMaterials.map((item, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Steps */}
      <div className="divide-y divide-gray-200">
        {guidance.steps.map((step) => (
          <StepCard
            key={step.stepNumber}
            step={step}
            isExpanded={expandedSteps.includes(step.stepNumber)}
            isCompleted={isStepCompleted(step.stepNumber)}
            isCurrent={isStepCurrent(step.stepNumber)}
            onToggle={() => toggleStep(step.stepNumber)}
            onClick={() => onStepClick?.(step.stepNumber)}
          />
        ))}
      </div>

      {/* Post-Process Checks */}
      {guidance.postProcessChecks && guidance.postProcessChecks.length > 0 && (
        <div className="bg-gray-50 p-4 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            Завершающие проверки
          </h4>
          <ul className="space-y-1">
            {guidance.postProcessChecks.map((check, idx) => (
              <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                <span className="text-gray-400 mt-0.5">•</span>
                <span>{check}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

interface StepCardProps {
  step: ProcessStep
  isExpanded: boolean
  isCompleted: boolean
  isCurrent: boolean
  onToggle: () => void
  onClick: () => void
}

function StepCard({ step, isExpanded, isCompleted, isCurrent, onToggle, onClick }: StepCardProps) {
  const getStepStatusColor = () => {
    if (isCompleted) return 'bg-green-500'
    if (isCurrent) return 'bg-blue-500'
    return 'bg-gray-300'
  }

  const getStepBorderColor = () => {
    if (isCompleted) return 'border-green-200'
    if (isCurrent) return 'border-blue-300 bg-blue-50'
    return 'border-transparent'
  }

  return (
    <div className={`border-l-4 ${getStepBorderColor()} transition-colors`}>
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
      >
        {/* Step Number Badge */}
        <div
          className={`w-8 h-8 rounded-full ${getStepStatusColor()} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}
        >
          {isCompleted ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <span>{step.stepNumber}</span>
          )}
        </div>

        {/* Step Title */}
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{step.title}</h3>
          <p className="text-sm text-gray-600 mt-0.5">{step.description}</p>
        </div>

        {/* Expand/Collapse Icon */}
        <div className="flex-shrink-0">
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 pl-16 space-y-4">
          {/* Requirements */}
          {step.requirements && step.requirements.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Требования:</h4>
              <ul className="space-y-1">
                {step.requirements.map((req, idx) => (
                  <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings */}
          {step.warnings && step.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <h4 className="text-sm font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Предупреждения:
              </h4>
              <ul className="space-y-1">
                {step.warnings.map((warning, idx) => (
                  <li key={idx} className="text-sm text-yellow-700 flex items-start gap-2">
                    <span className="text-yellow-500 mt-0.5">⚠</span>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tips */}
          {step.tips && step.tips.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h4 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Советы:
              </h4>
              <ul className="space-y-1">
                {step.tips.map((tip, idx) => (
                  <li key={idx} className="text-sm text-blue-700 flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">💡</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* CCA Criteria */}
          {step.ccaCriteria && step.ccaCriteria.length > 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <h4 className="text-sm font-semibold text-purple-800 mb-2 flex items-center gap-2">
                <Beaker className="w-4 h-4" />
                Критические критерии (CCA):
              </h4>
              <div className="space-y-2">
                {step.ccaCriteria.map((criteria, idx) => (
                  <div key={idx} className="flex items-start justify-between text-sm">
                    <span className="text-purple-700 font-medium">{criteria.parameter}:</span>
                    <span className="text-purple-900">{criteria.range}</span>
                    {criteria.critical && (
                      <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                        Критично
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Required Fields */}
          {step.requiredFields && step.requiredFields.length > 0 && (
            <div className="text-sm">
              <span className="text-gray-500">Обязательные поля: </span>
              <span className="font-mono text-gray-700">
                {step.requiredFields.join(', ')}
              </span>
            </div>
          )}

          {/* Action Button */}
          {isCurrent && (
            <button
              onClick={onClick}
              className="w-full mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Перейти к выполнению шага
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default ProcessGuidancePanel
