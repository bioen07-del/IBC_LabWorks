// ТЗ 3.3.7: Модальное окно для добавления наблюдений за культурой
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getCurrentUserId } from '@/hooks/useAuth'
import { X, Save, AlertTriangle, Camera, Eye } from 'lucide-react'

type Container = {
  id: number
  container_code: string
}

type Props = {
  cultureId: number
  containers: Container[]
  onClose: () => void
  onSuccess: () => void
}

export function AddObservationModal({ cultureId, containers, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    container_id: '',
    confluence_percent: '',
    morphology_description: '',
    contamination_detected: false,
    contamination_type: '',
    notes: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        culture_id: cultureId,
        container_id: formData.container_id ? parseInt(formData.container_id) : null,
        confluence_percent: formData.confluence_percent ? parseInt(formData.confluence_percent) : null,
        morphology_description: formData.morphology_description || null,
        contamination_detected: formData.contamination_detected,
        contamination_type: formData.contamination_detected ? formData.contamination_type : null,
        notes: formData.notes || null,
        recorded_by_user_id: getCurrentUserId(),
        observation_date: new Date().toISOString().split('T')[0]
      }

      const { error } = await (supabase.from('observations') as any).insert(payload)
      
      if (error) throw error

      // Если обнаружена контаминация - создать задачу для QC
      if (formData.contamination_detected) {
        await (supabase.from('tasks') as any).insert({
          title: `⚠️ Контаминация обнаружена в культуре`,
          description: `Тип: ${formData.contamination_type || 'не указан'}. Конфлюэнтность: ${formData.confluence_percent || 'N/A'}%. Примечания: ${formData.notes || 'нет'}`,
          task_type: 'qc_check',
          priority: 'high',
          status: 'pending',
          culture_id: cultureId
        })
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error saving observation:', error)
      alert('Ошибка при сохранении наблюдения')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Eye className="h-5 w-5 text-emerald-600" />
            Добавить наблюдение
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Контейнер */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Контейнер (опционально)
            </label>
            <select
              value={formData.container_id}
              onChange={e => setFormData({ ...formData, container_id: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Для всей культуры</option>
              {containers.map(c => (
                <option key={c.id} value={c.id}>{c.container_code}</option>
              ))}
            </select>
          </div>

          {/* Конфлюэнтность */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Конфлюэнтность (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={formData.confluence_percent}
              onChange={e => setFormData({ ...formData, confluence_percent: e.target.value })}
              placeholder="например, 70"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Морфология */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Морфология
            </label>
            <textarea
              value={formData.morphology_description}
              onChange={e => setFormData({ ...formData, morphology_description: e.target.value })}
              placeholder="Клетки веретеновидные, равномерно распределены..."
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Контаминация */}
          <div className="border border-slate-200 rounded-lg p-3 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.contamination_detected}
                onChange={e => setFormData({ ...formData, contamination_detected: e.target.checked })}
                className="h-4 w-4 text-red-600 border-slate-300 rounded focus:ring-red-500"
              />
              <span className="text-sm font-medium text-slate-700 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Контаминация обнаружена
              </span>
            </label>

            {formData.contamination_detected && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Тип контаминации
                </label>
                <select
                  value={formData.contamination_type}
                  onChange={e => setFormData({ ...formData, contamination_type: e.target.value })}
                  className="w-full px-3 py-2 border border-red-300 rounded-lg bg-red-50 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                >
                  <option value="">Выберите тип</option>
                  <option value="bacterial">Бактериальная</option>
                  <option value="fungal">Грибковая</option>
                  <option value="mycoplasma">Микоплазма</option>
                  <option value="unknown">Неизвестно</option>
                </select>
              </div>
            )}
          </div>

          {/* Примечания */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Примечания
            </label>
            <textarea
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Дополнительные наблюдения..."
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Предупреждение о контаминации */}
          {formData.contamination_detected && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              <strong>⚠️ Внимание:</strong> При сохранении будет автоматически создана задача для QC.
            </div>
          )}

          {/* Кнопки */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Сохранение...</span>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Сохранить
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
