import { useEffect, useState } from 'react'
import { RefreshCw, X } from 'lucide-react'

const CURRENT_VERSION = '1.0.1'
const CHECK_INTERVAL = 5 * 60 * 1000 // 5 минут

export function VersionChecker() {
  const [showUpdate, setShowUpdate] = useState(false)
  const [newVersion, setNewVersion] = useState('')

  useEffect(() => {
    checkVersion()
    const interval = setInterval(checkVersion, CHECK_INTERVAL)
    return () => clearInterval(interval)
  }, [])

  async function checkVersion() {
    try {
      const res = await fetch('/version.json?t=' + Date.now())
      if (!res.ok) return
      const data = await res.json()
      if (data.version && data.version !== CURRENT_VERSION) {
        setNewVersion(data.version)
        setShowUpdate(true)
      }
    } catch (e) {
      // ignore
    }
  }

  function handleUpdate() {
    window.location.reload()
  }

  if (!showUpdate) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white p-4 rounded-xl shadow-lg max-w-sm animate-bounce-once">
      <button onClick={() => setShowUpdate(false)} className="absolute top-2 right-2 p-1 hover:bg-blue-700 rounded">
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-3">
        <RefreshCw className="h-6 w-6 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">Доступна новая версия</p>
          <p className="text-sm text-blue-100 mt-1">
            Версия {newVersion} готова к установке. Обновите для получения исправлений и новых функций.
          </p>
          <button
            onClick={handleUpdate}
            className="mt-3 px-4 py-2 bg-white text-blue-600 font-medium rounded-lg hover:bg-blue-50 text-sm"
          >
            Обновить сейчас
          </button>
        </div>
      </div>
    </div>
  )
}
