import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: Request) {
  const supabase = getSupabaseAdmin()
  
  try {
    const { membership_id } = await request.json()
    
    if (!membership_id) {
      return new Response(JSON.stringify({ error: 'Missing membership_id' }), { status: 400 })
    }

    // Fetch membership details
    const { data: membership, error: memErr } = await supabase
      .from('chama_memberships')
      .select('joined_at, chama_id')
      .eq('id', membership_id)
      .single()

    if (memErr || !membership) {
      return new Response(JSON.stringify({ error: 'Membership not found' }), { status: 404 })
    }

    // Fetch confirmed contributions for this membership
    const { data: contributions, error: contErr } = await supabase
      .from('contributions_v2')
      .select('created_at, status')
      .eq('membership_id', membership_id)
      .eq('status', 'confirmed')
      .order('created_at', { ascending: true })

    if (contErr) throw contErr

    // Fetch all loans for this membership
    const { data: loans, error: loanErr } = await supabase
      .from('loans_v2')
      .select('status')
      .eq('membership_id', membership_id)

    if (loanErr) throw loanErr

    // Calculations
    const joinedAt = new Date(membership.joined_at)
    const now = new Date()
    
    // months_active = months since joined_at (minimum 1)
    let months_active = (now.getFullYear() - joinedAt.getFullYear()) * 12 + (now.getMonth() - joinedAt.getMonth()) + 1
    if (months_active < 1) months_active = 1

    // confirmed_months = count of distinct months with confirmed contributions
    const distinctMonths = new Set()
    contributions?.forEach(c => {
      const d = new Date(c.created_at)
      distinctMonths.add(`${d.getFullYear()}-${d.getMonth()}`)
    })
    const confirmed_months = distinctMonths.size

    // on_time_rate = confirmed_months / months_active (capped at 1)
    const on_time_rate = Math.min(confirmed_months / months_active, 1)
    const contribution_score = on_time_rate * 40

    // Loans repayment
    const repaid = loans?.filter(l => l.status === 'repaid').length || 0
    const total_loans = loans?.length || 0
    const repayment_rate = total_loans > 0 ? repaid / total_loans : 1
    const repayment_score = repayment_rate * 30

    // Tenure
    const tenure_score = Math.min(months_active / 24, 1) * 20

    // Streak Calculation (consecutive months contributed up to current month)
    let streak = 0
    let currentCheckMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    
    while (true) {
      const monthStr = `${currentCheckMonth.getFullYear()}-${currentCheckMonth.getMonth()}`
      if (distinctMonths.has(monthStr)) {
        streak++
        currentCheckMonth.setMonth(currentCheckMonth.getMonth() - 1)
      } else {
        break
      }
    }
    
    const streak_capped = Math.min(streak, 12)
    const participation_score = (streak_capped / 12) * 10

    const trust_score = Math.round(
      contribution_score +
      repayment_score +
      tenure_score +
      participation_score
    )

    // Update membership
    await supabase
      .from('chama_memberships')
      .update({ 
        trust_score,
        contribution_streak: streak
      })
      .eq('id', membership_id)

    return new Response(JSON.stringify({ trust_score, streak }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error('Trust score calculation error:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
