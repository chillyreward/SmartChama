// Sends an SMS through whichever provider is configured:
// Wakali when WAKALI_API_KEY is set, otherwise Africa's Talking.
// Without either, logs in dev and reports `simulated`.

export function formatKenyanPhone(raw: string): string {
  let p = String(raw).replace(/[\s-]/g, '')
  if (p.startsWith('0')) p = '+254' + p.slice(1)
  if (p.startsWith('254')) p = '+' + p
  if (!p.startsWith('+')) p = '+254' + p
  return p
}

export async function sendSms(rawPhone: string, message: string): Promise<{ success: boolean; simulated?: boolean; provider?: string }> {
  const phone = formatKenyanPhone(rawPhone)

  if (process.env.WAKALI_API_KEY) {
    const res = await fetch('https://api.wakalisms.com/sms/send', {
      method: 'POST',
      headers: { 'X-API-Key': process.env.WAKALI_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipients: [phone], message })
    })
    if (!res.ok) console.error('Wakali SMS failed:', res.status, await res.text().catch(() => ''))
    return { success: res.ok, provider: 'wakali' }
  }

  if (process.env.AFRICASTALKING_API_KEY && process.env.AFRICASTALKING_USERNAME) {
    const res = await fetch('https://api.africastalking.com/version1/messaging', {
      method: 'POST',
      headers: {
        apiKey: process.env.AFRICASTALKING_API_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json'
      },
      body: new URLSearchParams({
        username: process.env.AFRICASTALKING_USERNAME,
        to: phone,
        message,
        from: process.env.AFRICASTALKING_SENDER_ID || ''
      })
    })
    const data = await res.json().catch(() => null)
    const ok = res.ok && data?.SMSMessageData?.Recipients?.[0]?.status === 'Success'
    if (!ok) console.error("Africa's Talking SMS failed:", data?.SMSMessageData?.Recipients?.[0]?.status ?? res.status)
    return { success: ok, provider: 'africastalking' }
  }

  if (process.env.NODE_ENV !== 'production') {
    console.warn(`[DEV] SMS simulated to ${phone}: ${message}`)
  } else {
    console.error('SMS not sent: no provider configured (WAKALI_API_KEY or AFRICASTALKING_*)')
  }
  return { success: true, simulated: true }
}
