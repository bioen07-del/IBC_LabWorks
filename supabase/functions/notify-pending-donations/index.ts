// Cron: Notify QP about pending donations older than 4 hours

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')

    // Get pending donations older than 4 hours
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
    
    const donationsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/donations?status=eq.received&created_at=lt.${fourHoursAgo}&select=id,donation_code,donor_id,donors(donor_code)`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        }
      }
    )
    
    const donations = await donationsRes.json()
    
    if (!donations || donations.length === 0) {
      return new Response(JSON.stringify({ message: 'No pending donations' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get QP users with telegram_chat_id
    const usersRes = await fetch(
      `${SUPABASE_URL}/rest/v1/users?role=eq.qp&telegram_chat_id=not.is.null&select=telegram_chat_id`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        }
      }
    )
    
    const qpUsers = await usersRes.json()
    
    if (!qpUsers || qpUsers.length === 0 || !BOT_TOKEN) {
      return new Response(JSON.stringify({ message: 'No QP users with Telegram or bot not configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Send notifications
    const message = `⏰ <b>Напоминание QP</b>\n\nЕсть ${donations.length} донаций, ожидающих одобрения более 4 часов:\n\n` +
      donations.slice(0, 5).map((d: any) => `• ${d.donation_code}`).join('\n') +
      (donations.length > 5 ? `\n... и ещё ${donations.length - 5}` : '')

    for (const user of qpUsers) {
      if (user.telegram_chat_id) {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: user.telegram_chat_id,
            text: message,
            parse_mode: 'HTML'
          })
        })
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      pending_count: donations.length,
      notified_qp: qpUsers.length 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
