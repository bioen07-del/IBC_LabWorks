import { supabase } from './supabase'

interface NotifyOptions {
  chat_id: string
  message: string
}

export async function sendTelegramNotificationToChat({ chat_id, message }: NotifyOptions) {
  try {
    const { data, error } = await supabase.functions.invoke('telegram-notify', {
      body: { chat_id, message }
    })
    
    if (error) throw error
    return { success: true, data }
  } catch (err) {
    console.error('Telegram notification error:', err)
    return { success: false, error: err }
  }
}

// Broadcast уведомление всем подписанным пользователям
export async function sendTelegramNotification(message: string, type: 'info' | 'warning' | 'error' = 'info') {
  try {
    // Получаем всех пользователей с telegram_chat_id
    const { data: users } = await supabase
      .from('users')
      .select('telegram_chat_id')
      .not('telegram_chat_id', 'is', null)
    
    if (!users || users.length === 0) {
      console.log('No Telegram subscribers found')
      return { success: true, sent: 0 }
    }

    const results = await Promise.all(
      users.map(user => 
        sendTelegramNotificationToChat({ 
          chat_id: user.telegram_chat_id!, 
          message 
        })
      )
    )
    
    return { success: true, sent: results.filter(r => r.success).length }
  } catch (err) {
    console.error('Broadcast notification error:', err)
    return { success: false, error: err }
  }
}

// Шаблоны уведомлений
export const NotificationTemplates = {
  newDeviation: (code: string, type: string) => 
    `🚨 <b>Новое отклонение</b>\n\nКод: ${code}\nТип: ${type}\n\nТребуется рассмотрение QP.`,
  
  ccaFailed: (cultureName: string, viability: number) =>
    `⚠️ <b>CCA не пройден</b>\n\nКультура: ${cultureName}\nЖизнеспособность: ${viability}%\n\nСоздано отклонение.`,
  
  taskAssigned: (taskType: string, priority: string) =>
    `📋 <b>Новая задача</b>\n\nТип: ${taskType}\nПриоритет: ${priority}`,
  
  expiryWarning: (itemName: string, daysLeft: number) =>
    `⏰ <b>Срок годности</b>\n\n${itemName} истекает через ${daysLeft} дней.`,
  
  batchReady: (batchCode: string, recipeName: string) =>
    `✅ <b>Партия готова</b>\n\nКод: ${batchCode}\nРецепт: ${recipeName}`,
}
