// Telegram Bot Webhook - обрабатывает /start и возвращает chat_id

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const update = await req.json()
    
    if (update.message) {
      const chatId = update.message.chat.id
      const text = update.message.text || ''
      const firstName = update.message.from?.first_name || 'Пользователь'
      
      const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')
      
      if (text === '/start') {
        const response = `👋 Привет, ${firstName}!\n\n🆔 Ваш Chat ID: <code>${chatId}</code>\n\nСкопируйте этот ID и вставьте в настройки BMCP для получения уведомлений.`
        
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: response,
            parse_mode: 'HTML'
          })
        })
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
