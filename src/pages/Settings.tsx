import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Settings, 
  Bell, 
  MessageCircle, 
  Mail, 
  Save, 
  Check,
  Loader2,
  Info
} from 'lucide-react'

export function SettingsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  
  const [settings, setSettings] = useState({
    telegram_chat_id: '',
    notifications_enabled: true,
    email_notifications: true
  })

  useEffect(() => {
    loadSettings()
  }, [user])

  async function loadSettings() {
    if (!user) return
    
    try {
      const { data } = await (supabase
        .from('user_settings' as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle() as unknown as Promise<{ data: any }>)

      if (data) {
        setSettings({
          telegram_chat_id: data.telegram_chat_id || '',
          notifications_enabled: data.notifications_enabled ?? true,
          email_notifications: data.email_notifications ?? true
        })
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!user) return
    
    setSaving(true)
    try {
      const { error } = await (supabase
        .from('user_settings' as any) as any)
        .upsert({
          user_id: user.id,
          telegram_chat_id: settings.telegram_chat_id || null,
          notifications_enabled: settings.notifications_enabled,
          email_notifications: settings.email_notifications,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })

      if (error) throw error
      
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Ошибка сохранения настроек')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8 text-slate-600" />
        <h1 className="text-2xl font-bold text-slate-900">Настройки</h1>
      </div>

      {/* Telegram Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <MessageCircle className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Telegram уведомления</h2>
            <p className="text-sm text-slate-500">Получайте уведомления в Telegram</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Telegram Chat ID
            </label>
            <input
              type="text"
              value={settings.telegram_chat_id}
              onChange={e => setSettings({ ...settings, telegram_chat_id: e.target.value })}
              placeholder="Например: 123456789"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">Как получить Chat ID:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Откройте бота <span className="font-mono">@bmcp_notifications_bot</span></li>
                <li>Нажмите /start</li>
                <li>Бот пришлёт ваш Chat ID</li>
                <li>Скопируйте его сюда</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Bell className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Уведомления</h2>
            <p className="text-sm text-slate-500">Настройка каналов уведомлений</p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100">
            <div className="flex items-center gap-3">
              <MessageCircle className="h-5 w-5 text-slate-500" />
              <span className="font-medium text-slate-700">Telegram уведомления</span>
            </div>
            <input
              type="checkbox"
              checked={settings.notifications_enabled}
              onChange={e => setSettings({ ...settings, notifications_enabled: e.target.checked })}
              className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-slate-500" />
              <span className="font-medium text-slate-700">Email уведомления</span>
            </div>
            <input
              type="checkbox"
              checked={settings.email_notifications}
              onChange={e => setSettings({ ...settings, email_notifications: e.target.checked })}
              className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
          </label>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
      >
        {saving ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : saved ? (
          <>
            <Check className="h-5 w-5" />
            Сохранено
          </>
        ) : (
          <>
            <Save className="h-5 w-5" />
            Сохранить настройки
          </>
        )}
      </button>
    </div>
  )
}

export default SettingsPage
