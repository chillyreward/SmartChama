import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: Request) {
  const supabase = getSupabaseAdmin()
  const body = await request.json()

  const callback = body.Body?.stkCallback
  const resultCode = callback?.ResultCode
  const checkoutId = callback?.CheckoutRequestID

  // Always return 200 to Safaricom first, regardless of result.
  // If you return an error, Safaricom will retry indefinitely.
  const respond = (data: object) =>
    new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  if (resultCode !== 0) {
    // Payment was cancelled or failed
    await supabase
      .from('contributions_v2')
      .update({ status: 'failed' })
      .eq('mpesa_checkout_request_id', checkoutId)
    return respond({ ResultCode: 0, ResultDesc: 'Accepted' })
  }

  // Payment succeeded
  const items = callback.CallbackMetadata?.Item || []
  const get = (name: string) => items.find((i: any) => i.Name === name)?.Value

  const amount = get('Amount')
  const receipt = get('MpesaReceiptNumber')
  const phone = get('PhoneNumber')?.toString()

  // Update contribution record
  const { data: contribution } = await supabase
    .from('contributions_v2')
    .update({
      status: 'confirmed',
      mpesa_receipt: receipt,
      confirmed_at: new Date().toISOString()
    })
    .eq('mpesa_checkout_request_id', checkoutId)
    .select(`
      id, amount, membership_id, chama_id
    `)
    .single()

  if (!contribution) {
    return respond({ ResultCode: 0, ResultDesc: 'Accepted' })
  }

  // Update wallet balance
  await supabase.rpc('increment_wallet_balance', {
    p_chama_id: contribution.chama_id,
    p_amount: contribution.amount
  })

  // Record in transactions ledger
  await supabase
    .from('transactions_v2')
    .insert({
      chama_id: contribution.chama_id,
      membership_id: contribution.membership_id,
      type: 'contribution',
      amount: contribution.amount,
      reference: receipt,
      status: 'confirmed'
    })

  // Trigger trust score recalculation
  await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/trust-score/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      membership_id: contribution.membership_id
    })
  })

  // Get member profile for SMS
  const { data: membership } = await supabase
    .from('chama_memberships')
    .select(`
      profiles ( full_name, phone_number ),
      chamas_v2 ( name )
    `)
    .eq('id', contribution.membership_id)
    .single()

  // Send SMS confirmation
  if (membership?.profiles) {
    const memberPhone = (membership.profiles as any).phone_number
    const memberName = (membership.profiles as any).full_name
    const chamaName = (membership.chamas_v2 as any).name

    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/sms/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: memberPhone,
        message: `SmartChama: Your KSh ${amount?.toLocaleString('en-KE')} contribution to ${chamaName} is confirmed. Receipt: ${receipt}.`
      })
    })
  }

  // Add to group activity feed
  await supabase
    .from('group_activity')
    .insert({
      chama_id: contribution.chama_id,
      event_type: 'contribution_received',
      description: `A contribution of KSh ${amount?.toLocaleString('en-KE')} was received.`
    })

  return respond({ ResultCode: 0, ResultDesc: 'Accepted' })
}
