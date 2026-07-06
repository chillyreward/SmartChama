import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: Request) {
  const supabase = getSupabaseAdmin()

  const { phone, name, chama_id, invited_by, channel = 'sms' } = await request.json()

  if (!phone || !chama_id) {
    return Response.json({ error: 'Phone number and chama_id are required.' }, { status: 400 })
  }

  // Normalize phone to +254 format
  let formattedPhone = phone.replace(/\s/g, '')
  if (formattedPhone.startsWith('0')) formattedPhone = '+254' + formattedPhone.slice(1)
  if (!formattedPhone.startsWith('+')) formattedPhone = '+254' + formattedPhone

  // Get chama and admin details
  const [{ data: chama }, { data: admin }] = await Promise.all([
    supabase.from('chamas_v2').select('name').eq('id', chama_id).single(),
    supabase.from('profiles').select('full_name').eq('id', invited_by).single()
  ])

  // Generate invite code
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase()

  // Save invite token
  const { error: tokenError } = await supabase
    .from('invite_tokens')
    .insert({
      token: inviteCode,
      chama_id,
      created_by: invited_by,
      expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      max_uses: 1,
      is_active: true
    })

  if (tokenError) {
    console.error('Save invite token failed:', tokenError)
    return Response.json({ error: 'Could not save invite.' }, { status: 500 })
  }

  const signupUrl = `${process.env.NEXT_PUBLIC_APP_URL}/signup?token=${inviteCode}`
  const adminName = admin?.full_name || 'Your admin'
  const chamaName = chama?.name || 'a savings group'

  // ── WHATSAPP via Twilio REST API ──
  // Pipeline is ready — activate by setting TWILIO_WHATSAPP_ENABLED=true in env
  // once the WhatsApp template (HX3403aa16324516f570bb43bb0132609f) is approved by Meta
  const whatsappEnabled = process.env.TWILIO_WHATSAPP_ENABLED === 'true'

  if (channel === 'whatsapp' && whatsappEnabled) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const whatsappFrom = process.env.TWILIO_WHATSAPP_NUMBER || '+13204464863'
    const templateSid = process.env.TWILIO_WHATSAPP_TEMPLATE_SID

    if (!accountSid || !authToken) {
      return Response.json({ success: true, code: inviteCode, sms_sent: false, note: 'WhatsApp not configured. Share the code manually.' })
    }

    try {
      const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64')
      const body = new URLSearchParams({
        From: `whatsapp:${whatsappFrom}`,
        To: `whatsapp:${formattedPhone}`,
      })

      if (templateSid) {
        body.append('ContentSid', templateSid)
        body.append('ContentVariables', JSON.stringify({
          "1": adminName, "2": chamaName, "3": inviteCode, "4": signupUrl
        }))
      } else {
        body.append('Body', `You have been invited by ${adminName} to join ${chamaName} on SmartChama!\n\nInvite code: ${inviteCode}\n\nSign up: ${signupUrl}\n\nExpires in 48 hours.`)
      }

      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: 'POST',
        headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      })

      const data = await res.json()
      console.log('WhatsApp SID:', data.sid, '| Status:', data.status, '| Error:', data.error_code)

      if (data.error_code) {
        return Response.json({ success: true, code: inviteCode, sms_sent: false, note: `WhatsApp failed (${data.error_code}). Share the code manually.` })
      }

      return Response.json({ success: true, code: inviteCode, sms_sent: true, channel: 'whatsapp', phone: formattedPhone })

    } catch (err: any) {
      console.error('WhatsApp error:', err.message)
      return Response.json({ success: true, code: inviteCode, sms_sent: false, note: 'WhatsApp failed. Share the code manually.' })
    }
  }

  // ── SMS via Wakali (default + WhatsApp fallback when not enabled) ──
  const wakaliKey = process.env.WAKALI_API_KEY
  const smsMessage = `${adminName} has invited you to join ${chamaName} on SmartChama!\n\nYour invite code: ${inviteCode}\n\nSign up: ${signupUrl}\n\nCode expires in 48 hours.`

  if (!wakaliKey) {
    console.log(`[DEV] No Wakali key — code: ${inviteCode}`)
    return Response.json({ success: true, code: inviteCode, sms_sent: false, note: 'SMS not configured. Share the code manually.' })
  }

  try {
    const res = await fetch('https://api.wakalisms.com/sms/send', {
      method: 'POST',
      headers: { 'X-API-Key': wakaliKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipients: [formattedPhone], message: smsMessage }),
    })

    const data = await res.json()
    console.log('Wakali SMS:', JSON.stringify(data))

    return Response.json({
      success: true, code: inviteCode, sms_sent: res.ok, channel: 'sms', phone: formattedPhone,
      note: res.ok ? undefined : `SMS failed: ${data.detail || data.message || 'Unknown'}. Share the code manually.`
    })

  } catch (err: any) {
    console.error('Wakali error:', err.message)
    return Response.json({ success: true, code: inviteCode, sms_sent: false, note: 'SMS failed. Share the code manually.' })
  }
}
