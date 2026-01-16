import { useState } from 'react'
import { Wrench, Clock } from 'lucide-react'

type Props = {
  stepName: string
  description: string
  expectedDuration?: number
  onDataChange: (data: any) => void
}

export function ManipulationForm({ stepName, description, expectedDuration, onDataChange }: Props) {
  const [data, setData] = useState({
    action_completed: false,
    actual_duration_minutes: '',
    equipment_used: '',
    reagents_used: '',
    success: null as boolean | null,
    notes: ''
  })

  const handleChange = (field: string, value: any) => {
    const updated = { ...data, [field]: value }
    setData(updated)
    onDataChange(updated)
  }

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center gap-2 text-purple-800">
        <Wrench className="h-5 w-5" />
        <h4 className="font-medium">Выполнение манипуляции</h4>
      </div>

      <div className="bg-white rounded-lg p-3 border border-purple-200">
        <p className="text-sm text-slate-600 mb-3">{description}</p>

        {expectedDuration && (
          <div className="flex items-center gap-2 text-sm text-purple-700 mb-3 bg-purple-100 rounded p-2">
            <Clock className="h-4 w-4" />
            <span>Ожидаемая продолжительность: {expectedDuration} мин</span>
          </div>
        )}

        {/* Action completion checkbox */}
        <div className="mb-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={data.action_completed}
              onChange={(e) => handleChange('action_completed', e.target.checked)}
              className="w-4 h-4 text-purple-600"
            />
            <span className="text-sm font-medium">Действие выполнено согласно протоколу</span>
          </label>
        </div>

        {/* Actual duration */}
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Фактическая продолжительность (мин)</label>
          <input
            type="number"
            min="0"
            value={data.actual_duration_minutes}
            onChange={(e) => handleChange('actual_duration_minutes', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            placeholder="напр. 15"
          />
        </div>

        {/* Equipment used */}
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Использованное оборудование</label>
          <input
            type="text"
            value={data.equipment_used}
            onChange={(e) => handleChange('equipment_used', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            placeholder="напр. Центрифуга CF-100, Ламинарный бокс LB-50"
          />
        </div>

        {/* Reagents used */}
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Использованные реагенты</label>
          <input
            type="text"
            value={data.reagents_used}
            onChange={(e) => handleChange('reagents_used', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            placeholder="напр. PBS, Трипсин-EDTA 0.25%"
          />
        </div>

        {/* Success indicator */}
        <div className="mb-3">
          <label className="block text-sm font-medium mb-2">Результат выполнения:</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => handleChange('success', true)}
              className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${
                data.success === true
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-medium'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              ✓ Успешно
            </button>

            <button
              type="button"
              onClick={() => handleChange('success', false)}
              className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${
                data.success === false
                  ? 'border-red-500 bg-red-50 text-red-700 font-medium'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              ✗ С отклонениями
            </button>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium mb-1">Примечания</label>
          <textarea
            value={data.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            rows={2}
            placeholder="Дополнительная информация о выполнении..."
          />
        </div>
      </div>
    </div>
  )
}
