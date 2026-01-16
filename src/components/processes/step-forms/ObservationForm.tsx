import { useState } from 'react'
import { Eye, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

type Props = {
  stepName: string
  description: string
  onDataChange: (data: any) => void
}

export function ObservationForm({ stepName, description, onDataChange }: Props) {
  const [observations, setObservations] = useState({
    visual_check_passed: null as boolean | null,
    contamination_detected: false,
    cell_confluence: '',
    cell_morphology: '',
    media_color: '',
    notes: ''
  })

  const handleChange = (field: string, value: any) => {
    const updated = { ...observations, [field]: value }
    setObservations(updated)
    onDataChange(updated)
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center gap-2 text-blue-800">
        <Eye className="h-5 w-5" />
        <h4 className="font-medium">Визуальный осмотр</h4>
      </div>

      <div className="bg-white rounded-lg p-3 border border-blue-200">
        <p className="text-sm text-slate-600 mb-3">{description}</p>

        {/* Visual check result */}
        <div className="mb-3">
          <label className="block text-sm font-medium mb-2">Результат осмотра:</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => handleChange('visual_check_passed', true)}
              className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                observations.visual_check_passed === true
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <CheckCircle className={`h-5 w-5 mx-auto mb-1 ${
                observations.visual_check_passed === true ? 'text-emerald-600' : 'text-slate-400'
              }`} />
              <div className="text-sm font-medium">Норма</div>
            </button>

            <button
              type="button"
              onClick={() => handleChange('visual_check_passed', false)}
              className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                observations.visual_check_passed === false
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <XCircle className={`h-5 w-5 mx-auto mb-1 ${
                observations.visual_check_passed === false ? 'text-red-600' : 'text-slate-400'
              }`} />
              <div className="text-sm font-medium">Отклонение</div>
            </button>
          </div>
        </div>

        {/* Contamination check */}
        <div className="mb-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={observations.contamination_detected}
              onChange={(e) => handleChange('contamination_detected', e.target.checked)}
              className="w-4 h-4 text-red-600"
            />
            <span className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Обнаружена контаминация
            </span>
          </label>
        </div>

        {/* Cell confluence */}
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Конфлюэнтность (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            value={observations.cell_confluence}
            onChange={(e) => handleChange('cell_confluence', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            placeholder="напр. 80"
          />
        </div>

        {/* Cell morphology */}
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Морфология клеток</label>
          <select
            value={observations.cell_morphology}
            onChange={(e) => handleChange('cell_morphology', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
          >
            <option value="">Выберите...</option>
            <option value="normal">Нормальная</option>
            <option value="elongated">Удлинённые</option>
            <option value="rounded">Округлые</option>
            <option value="granular">Гранулированные</option>
            <option value="abnormal">Аномальные</option>
          </select>
        </div>

        {/* Media color */}
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Цвет среды</label>
          <select
            value={observations.media_color}
            onChange={(e) => handleChange('media_color', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
          >
            <option value="">Выберите...</option>
            <option value="pink">Розовый (норма)</option>
            <option value="orange">Оранжевый (закисление)</option>
            <option value="purple">Фиолетовый (защелачивание)</option>
            <option value="yellow">Жёлтый (сильное закисление)</option>
            <option value="turbid">Мутный (контаминация)</option>
          </select>
        </div>

        {/* Additional notes */}
        <div>
          <label className="block text-sm font-medium mb-1">Дополнительные наблюдения</label>
          <textarea
            value={observations.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            rows={2}
            placeholder="Опишите любые отклонения или важные детали..."
          />
        </div>
      </div>
    </div>
  )
}
