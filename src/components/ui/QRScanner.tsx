import { useState, useRef, useEffect } from 'react'
import { Camera, X, Keyboard, QrCode } from 'lucide-react'

interface QRScannerProps {
  isOpen: boolean
  onClose: () => void
  onScan: (code: string) => void
  title?: string
  expectedPrefix?: string // e.g. 'EQP-' for equipment
}

export function QRScanner({ isOpen, onClose, onScan, title = 'Сканировать QR-код', expectedPrefix }: QRScannerProps) {
  const [mode, setMode] = useState<'camera' | 'manual'>('manual')
  const [manualCode, setManualCode] = useState('')
  const [error, setError] = useState('')
  const [cameraError, setCameraError] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (!isOpen) {
      stopCamera()
      setManualCode('')
      setError('')
    }
  }, [isOpen])

  useEffect(() => {
    if (mode === 'camera' && isOpen) {
      startCamera()
    } else {
      stopCamera()
    }
    return () => stopCamera()
  }, [mode, isOpen])

  async function startCamera() {
    try {
      setCameraError('')
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      setCameraError('Не удалось получить доступ к камере. Используйте ручной ввод.')
      setMode('manual')
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    const code = manualCode.trim().toUpperCase()
    
    if (!code) {
      setError('Введите код')
      return
    }

    if (expectedPrefix && !code.startsWith(expectedPrefix)) {
      setError(`Код должен начинаться с "${expectedPrefix}"`)
      return
    }

    onScan(code)
    setManualCode('')
    setError('')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <QrCode className="h-5 w-5 text-slate-500" />
            {title}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode toggle */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setMode('camera')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
              mode === 'camera' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Camera className="h-4 w-4" />
            Камера
          </button>
          <button
            onClick={() => setMode('manual')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
              mode === 'manual' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Keyboard className="h-4 w-4" />
            Ручной ввод
          </button>
        </div>

        <div className="p-4">
          {mode === 'camera' ? (
            <div className="space-y-4">
              {cameraError ? (
                <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">
                  {cameraError}
                </div>
              ) : (
                <>
                  <div className="aspect-square bg-black rounded-lg overflow-hidden relative">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-48 h-48 border-2 border-white/50 rounded-lg" />
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 text-center">
                    Наведите камеру на QR-код
                  </p>
                  <p className="text-xs text-amber-600 text-center bg-amber-50 p-2 rounded">
                    Примечание: для полноценного сканирования требуется библиотека распознавания. 
                    Используйте ручной ввод для надёжности.
                  </p>
                </>
              )}
            </div>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Код {expectedPrefix && `(${expectedPrefix}...)`}
                </label>
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => {
                    setManualCode(e.target.value)
                    setError('')
                  }}
                  placeholder={expectedPrefix ? `${expectedPrefix}001` : 'Введите код'}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg text-lg font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                {error && (
                  <p className="mt-1 text-sm text-red-600">{error}</p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Подтвердить
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
