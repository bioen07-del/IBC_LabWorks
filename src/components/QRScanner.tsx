// ТЗ 5.2.3: QR-сканер для валидации оборудования перед критическими шагами
import { useState, useEffect, useRef } from 'react'
import { Camera, X, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Equipment = {
  id: number
  equipment_code: string
  name: string
  equipment_type: string
  calibration_due_date: string | null
  is_calibrated: boolean
}

type Props = {
  onScan: (equipment: Equipment) => void
  onError: (message: string) => void
  onClose: () => void
  requiredType?: string
}

export function QRScanner({ onScan, onError, onClose, requiredType }: Props) {
  const [scanning, setScanning] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const [validating, setValidating] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    return () => {
      // Остановить камеру при размонтировании
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setScanning(true)
    } catch (err) {
      onError('Не удалось получить доступ к камере')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setScanning(false)
  }

  const validateEquipment = async (code: string) => {
    setValidating(true)
    try {
      // Поиск оборудования по коду
      const { data: equipment, error } = await supabase
        .from('equipment')
        .select('*')
        .eq('equipment_code', code.trim())
        .single()

      if (error || !equipment) {
        onError(`Оборудование "${code}" не найдено в системе`)
        return
      }

      const eq = equipment as any

      // Проверка типа оборудования
      if (requiredType && eq.equipment_type !== requiredType) {
        onError(`Требуется "${requiredType}", отсканировано "${eq.equipment_type}"`)
        return
      }

      // Проверка калибровки
      if (eq.calibration_due_date) {
        const dueDate = new Date(eq.calibration_due_date)
        const now = new Date()
        if (dueDate < now) {
          onError(`Калибровка оборудования "${eq.equipment_code}" истекла ${dueDate.toLocaleDateString('ru')}. Обратитесь к техническому персоналу.`)
          return
        }
      }

      if (eq.status !== 'operational') {
        onError(`Оборудование "${eq.equipment_code}" неактивно (статус: ${eq.status})`)
        return
      }

      // Успешная валидация
      stopCamera()
      onScan(eq as Equipment)
    } catch (err) {
      onError('Ошибка при проверке оборудования')
    } finally {
      setValidating(false)
    }
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualCode.trim()) {
      validateEquipment(manualCode)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold flex items-center gap-2">
            <Camera className="h-5 w-5 text-emerald-600" />
            Сканирование оборудования
            {requiredType && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                {requiredType}
              </span>
            )}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Видео превью камеры */}
          {scanning && (
            <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-white/50 rounded-lg"></div>
              </div>
            </div>
          )}

          {/* Кнопка запуска камеры */}
          {!scanning && (
            <button
              onClick={startCamera}
              className="w-full py-3 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 flex items-center justify-center gap-2"
            >
              <Camera className="h-5 w-5" />
              Открыть камеру
            </button>
          )}

          {scanning && (
            <button
              onClick={stopCamera}
              className="w-full py-2 text-sm text-slate-600 hover:text-slate-800"
            >
              Закрыть камеру
            </button>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500">или введите код вручную</span>
            </div>
          </div>

          {/* Ручной ввод */}
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={e => setManualCode(e.target.value)}
              placeholder="Код оборудования (напр. EQ-INC-001)"
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={validating || !manualCode.trim()}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
            >
              {validating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Проверить
            </button>
          </form>

          {/* Подсказка */}
          <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
            <p className="font-medium mb-1">💡 Подсказка:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Наведите камеру на QR-код оборудования</li>
              <li>Убедитесь, что оборудование откалибровано</li>
              <li>При истёкшей калибровке шаг будет заблокирован</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
