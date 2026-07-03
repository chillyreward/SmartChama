import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: Request) {
  try {
    const { membership_id, chama_id } = await req.json()
    if (!membership_id || !chama_id) {
      return NextResponse.json({ error: 'Missing membership_id or chama_id' }, { status: 400 })
    }

    // 1. Fetch member data
    const { data: membership } = await supabaseAdmin
      .from('chama_memberships')
      .select('*, profiles(full_name, email)')
      .eq('id', membership_id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Membership not found' }, { status: 404 })
    }

    // 2. Fetch contribution history (last 24)
    const { data: contributions } = await supabaseAdmin
      .from('contributions_v2')
      .select('amount, status, created_at, confirmed_at')
      .eq('membership_id', membership_id)
      .order('created_at', { ascending: false })
      .limit(24)

    // 3. Fetch loan history
    const { data: loans } = await supabaseAdmin
      .from('loans_v2')
      .select('amount, status, due_date, total_repaid, created_at, approved_at')
      .eq('membership_id', membership_id)
      .order('created_at', { ascending: false })
      .limit(10)

    // 4. Fetch chama settings
    const { data: chama } = await supabaseAdmin
      .from('chamas_v2')
      .select('name, contribution_amount, contribution_frequency, grace_period_days')
      .eq('id', chama_id)
      .single()

    // 5. Calculate stats
    const totalContributions = contributions?.length || 0
    const confirmedContributions = contributions?.filter(c => c.status === 'confirmed').length || 0
    const lateContributions = contributions?.filter(c => c.status === 'late').length || 0
    const failedContributions = contributions?.filter(c => c.status === 'failed').length || 0
    const onTimeRate = totalContributions > 0
      ? Math.round((confirmedContributions / totalContributions) * 100) : 0

    const repaidLoans = loans?.filter(l => l.status === 'repaid').length || 0
    const defaultedLoans = loans?.filter(l => l.status === 'defaulted').length || 0
    const overdueLoans = loans?.filter(l => l.status === 'overdue').length || 0
    const activeLoans = loans?.filter(l => l.status === 'active').length || 0

    const monthsActive = membership.joined_at
      ? Math.floor((Date.now() - new Date(membership.joined_at).getTime()) / (1000 * 60 * 60 * 24 * 30))
      : 0

    // 6. Detect risk patterns
    const recentContributions = contributions?.slice(0, 6) || []
    const recentOnTime = recentContributions.filter(c => c.status === 'confirmed').length
    const recentLate = recentContributions.filter(c => c.status === 'late' || c.status === 'failed').length

    const riskPatterns: string[] = []
    if (recentLate >= 2) riskPatterns.push(`${recentLate} late/missed payments in recent ${recentContributions.length} cycles`)
    if (defaultedLoans > 0) riskPatterns.push(`${defaultedLoans} defaulted loan(s)`)
    if (overdueLoans > 0) riskPatterns.push(`${overdueLoans} overdue loan(s)`)
    if (totalContributions >= 4 && onTimeRate < 50) riskPatterns.push(`Low on-time rate: ${onTimeRate}%`)

    const memberSummary = `
Member: ${membership.profiles?.full_name || 'Unknown'}
Chama: ${chama?.name || 'N/A'} (${chama?.contribution_amount ? `KSh ${chama.contribution_amount} ${chama.contribution_frequency}` : 'N/A'})
Months active: ${monthsActive}
Total contributions: ${totalContributions}
On-time: ${confirmedContributions} (${onTimeRate}%)
Late payments: ${lateContributions}
Missed/failed: ${failedContributions}
Recent trend (last ${recentContributions.length}): ${recentOnTime} on-time, ${recentLate} late/missed
Repaid loans: ${repaidLoans}
Active loans: ${activeLoans}
Overdue loans: ${overdueLoans}
Defaulted loans: ${defaultedLoans}
Current credit score: ${membership.trust_score}
Risk patterns detected: ${riskPatterns.length > 0 ? riskPatterns.join('; ') : 'None'}
`

    // 7. Ask OpenAI for explainable credit profile + risk analysis
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are SmartChama's AI credit scoring engine for Kenyan savings groups (chamas).

Your job is to:
1. Calculate a credit score (0-100)
2. Write a natural-language explanation of WHY the member got that score (like a bank would explain it)
3. Identify any early warning risk patterns
4. List key positive and negative factors

Scoring guidelines:
- Start at 50 (neutral baseline)
- On-time contribution rate: most important factor (+40 max)
- Loan repayment: +20 good, -20 defaults
- Tenure/consistency: up to +10
- Late/missed: -5 each (max -30)
- Defaults: -15 each (max -40)
- Overdue: -10 each
- Positive recent trend: +5 bonus

Return ONLY valid JSON with these exact fields:
{
  "score": <number 0-100>,
  "rating": <"Excellent"|"Good"|"Fair"|"Poor"|"Very Poor">,
  "explanation": <2-3 sentence plain English explanation of the score, referencing specific behaviors>,
  "risk_flags": [<list of specific risk patterns, empty array if none>],
  "positive_factors": [<up to 3 positive behaviors>],
  "negative_factors": [<up to 3 negative behaviors, empty if none>],
  "recommendation": <one actionable sentence for the member to improve or maintain their score>
}`
        },
        {
          role: 'user',
          content: `Generate credit profile for:\n${memberSummary}`
        }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 500,
      temperature: 0.3,
    })

    const result = JSON.parse(completion.choices[0].message.content || '{}')
    const newScore = Math.min(100, Math.max(0, Math.round(result.score || membership.trust_score)))

    // 8. Update score in DB
    await supabaseAdmin
      .from('chama_memberships')
      .update({ trust_score: newScore })
      .eq('id', membership_id)

    return NextResponse.json({
      score: newScore,
      rating: result.rating || 'Fair',
      explanation: result.explanation || '',
      risk_flags: result.risk_flags || [],
      positive_factors: result.positive_factors || [],
      negative_factors: result.negative_factors || [],
      recommendation: result.recommendation || '',
      previous_score: membership.trust_score,
      member_name: membership.profiles?.full_name || 'Member'
    })

  } catch (err: any) {
    console.error('Credit score error:', err)
    return NextResponse.json({ error: 'Failed to calculate credit score' }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const chama_id = searchParams.get('chama_id')
    if (!chama_id) return NextResponse.json({ error: 'chama_id required' }, { status: 400 })

    const { data: memberships } = await supabaseAdmin
      .from('chama_memberships')
      .select('id')
      .eq('chama_id', chama_id)
      .eq('status', 'active')

    if (!memberships?.length) return NextResponse.json({ updated: 0 })

    const results = []
    for (const m of memberships) {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/trust-score/calculate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ membership_id: m.id, chama_id })
        })
        const data = await res.json()
        results.push({ membership_id: m.id, ...data })
        await new Promise(r => setTimeout(r, 300))
      } catch { /* continue */ }
    }

    return NextResponse.json({ updated: results.length, results })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to calculate scores' }, { status: 500 })
  }
}
