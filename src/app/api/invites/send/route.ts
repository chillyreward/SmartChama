import { getSupabaseAdmin } from '@/lib/supabase-admin'
import twilio from 'twilio'

export async function POST(request: Request) {
  const supabase = getSupabaseAdmin()

  const { phone, name, chama_id, invited_by, channel = 'sms' } = await request.json()

  if (!phone || !chama_id) {
    return Response.json(
      { error: 'Phone number and chama_id are required.' },
      { status: 400 }
    )
  }

  // Normalize Kenyan phone number
  let formattedPhone = phone.replace(/\s/g, '')
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '+254' + formattedPhone.slice(1)
  }
  if (!formattedPhone.startsWith('+')) {
    formattedPhone = '+254' + formattedPhone
  }

  // Get chama details
  const { data: chama } = await supabase
    .from('chamas_v2')
    .select('name')
    .eq('id', chama_id)
    .single()

  // Get admin name
  const { data: admin } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', invited_by)
    .single()

  // Generate invite code
  const inviteCode = Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase()

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

  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = process.env.TWILIO_PHONE_NUMBER
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID
  const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'

  if (!accountSid || !authToken ||
      accountSid === 'your_twilio_account_sid') {
    console.log(`[DEV] Invite to ${formattedPhone}: code=${inviteCode}`)
    return Response.json({
      success: true,
      code: inviteCode,
      sms_sent: false,
      note: 'Twilio not configured. Share the invite code manually.'
    })
  }

  const smsMessage = `${adminName} has invited you to join ${chamaName} on SmartChama!\n\nYour invite code: ${inviteCode}\n\nSign up: ${signupUrl}\n\nCode expires in 48 hours.`

  const whatsappMessage = `👋 *${adminName}* has invited you to join *${chamaName}* on SmartChama!\n\n🔑 Your invite code: *${inviteCode}*\n\n📲 Sign up here: ${signupUrl}\n\n⏰ Code expires in 48 hours.`

  try {
    const client = twilio(accountSid, authToken)

    if (channel === 'whatsapp') {
      const templateSid = process.env.TWILIO_WHATSAPP_TEMPLATE_SID

      const msgParams: any = {
        from: `whatsapp:${whatsappNumber.replace('whatsapp:', '')}`,
        to: `whatsapp:${formattedPhone}`,
      }

      if (templateSid) {
        // Use approved template (required for business-initiated messages)
        msgParams.contentSid = templateSid
        msgParams.contentVariables = JSON.stringify({
          "1": adminName,
          "2": chamaName,
          "3": inviteCode,
          "4": signupUrl
        })
      } else {
        // Fallback to free-form (only works within 24h session window)
        msgParams.body = whatsappMessage
      }

      const msg = await client.messages.create(msgParams)
      console.log('WhatsApp SID:', msg.sid, '| Status:', msg.status, '| Error:', msg.errorCode, msg.errorMessage)

      if (msg.errorCode) {
        return Response.json({
          success: true,
          code: inviteCode,
          sms_sent: false,
          note: `WhatsApp failed (${msg.errorCode}): ${msg.errorMessage}. Share the code manually.`
        })
      }

      return Response.json({ success: true, code: inviteCode, sms_sent: true, channel: 'whatsapp', phone: formattedPhone })

    } else {
      // For Kenya (+254), use Alphanumeric Sender ID or Messaging Service
      // Alphanumeric works in Kenya without needing a local number
      const msgParams: any = {
        body: smsMessage,
        to: formattedPhone,
      }

      if (messagingServiceSid) {
        // Preferred: Messaging Service handles routing automatically
        msgParams.messagingServiceSid = messagingServiceSid
      } else {
        // Fallback: Alphanumeric sender (works for Kenya)
        msgParams.from = 'SmartChama'
      }

      const msg = await client.messages.create(msgParams)
      console.log('SMS invite sent. SID:', msg.sid)
      return Response.json({ success: true, code: inviteCode, sms_sent: true, channel: 'sms', phone: formattedPhone })
    }

  } catch (twilioError: any) {
    console.error('Twilio failed:', twilioError.message, '| Code:', twilioError.code)
    return Response.json({
      success: true,
      code: inviteCode,
      sms_sent: false,
      note: `Message failed (${twilioError.code || twilioError.message}). Share the code manually.`
    })
  }
}
