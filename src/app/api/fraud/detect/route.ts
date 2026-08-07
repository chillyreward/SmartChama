export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { requireAuth } from '@/lib/api-auth';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-build' });

export async function POST(req: Request) {
  try {
    const { user, error: authError } = await requireAuth(req);
    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chama_id } = await req.json()
    if (!chama_id) return NextResponse.json({ error: 'chama_id required' }, { status: 400 })

    // 1. Fetch chama info
    const { data: chama } = await supabaseAdmin
      .from('chamas_v2')
      .select('name, created_at, contribution_amount')
      .eq('id', chama_id)
      .single()

    // 2. Fetch all active members
    const { data: members } = await supabaseAdmin
      .from('chama_memberships')
      .select('id, profile_id, role, trust_score, joined_at, profiles(full_name, phone_number, email)')
      .eq('chama_id', chama_id)
      .eq('status', 'active')

    if (!members?.length) return NextResponse.json({ flags: [], summary: 'No members found.' })

    // 3. Fetch recent contributions (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { data: recentContributions } = await supabaseAdmin
      .from('contributions_v2')
      .select('id, membership_id, amount, status, payment_method, mpesa_receipt, created_at')
      .eq('chama_id', chama_id)
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: false })

    // 4. Fetch recent transactions
    const { data: transactions } = await supabaseAdmin
      .from('transactions_v2')
      .select('id, type, amount, membership_id, created_at, description')
      .eq('chama_id', chama_id)
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: false })
      .limit(100)

    // 5. Fetch loans
    const { data: loans } = await supabaseAdmin
      .from('loans_v2')
      .select('id, membership_id, amount, status, created_at, approved_at')
      .eq('chama_id', chama_id)
      .order('created_at', { ascending: false })
      .limit(50)

    // 6. Rule-based pre-screening (fast checks before AI)
    const ruleFlags: any[] = []

    // Duplicate M-Pesa receipts
    const receipts = recentContributions?.map(c => c.mpesa_receipt).filter(Boolean) || []
    const duplicateReceipts = receipts.filter((r, i) => receipts.indexOf(r) !== i)
    if (duplicateReceipts.length > 0) {
      ruleFlags.push({
        type: 'duplicate_transaction',
        severity: 'high',
        description: `${duplicateReceipts.length} duplicate M-Pesa receipt(s) detected`,
        details: `Receipt(s): ${[...new Set(duplicateReceipts)].join(', ')}`
      })
    }

    // Abnormal contribution amounts (>5x normal)
    const normalAmount = chama?.contribution_amount || 0
    if (normalAmount > 0) {
      const abnormal = recentContributions?.filter(c => c.amount > normalAmount * 5) || []
      if (abnormal.length > 0) {
        ruleFlags.push({
          type: 'suspicious_amount',
          severity: 'medium',
          description: `${abnormal.length} contribution(s) are over 5x the normal amount of KSh ${normalAmount}`,
          details: `Amounts: ${abnormal.map(c => `KSh ${c.amount}`).join(', ')}`
        })
      }
    }

    // Same member multiple contributions same day
    const contribByMember: Record<string, any[]> = {}
    for (const c of recentContributions || []) {
      const key = `${c.membership_id}_${c.created_at?.split('T')[0]}`
      if (!contribByMember[key]) contribByMember[key] = []
      contribByMember[key].push(c)
    }
    const multiSameDay = Object.values(contribByMember).filter(arr => arr.length > 1)
    if (multiSameDay.length > 0) {
      ruleFlags.push({
        type: 'duplicate_transaction',
        severity: 'medium',
        description: `${multiSameDay.length} member(s) made multiple contributions on the same day`,
        details: 'Possible duplicate submission or test transactions'
      })
    }

    // Rapid succession loans (more than 2 approved loans for same member)
    const loansByMember: Record<string, any[]> = {}
    for (const l of loans || []) {
      if (!loansByMember[l.membership_id]) loansByMember[l.membership_id] = []
      loansByMember[l.membership_id].push(l)
    }
    const rapidLoans = Object.entries(loansByMember).filter(([, ls]) => ls.length >= 3)
    if (rapidLoans.length > 0) {
      ruleFlags.push({
        type: 'abnormal_withdrawal',
        severity: 'medium',
        description: `${rapidLoans.length} member(s) have 3+ loans`,
        details: 'Unusual borrowing pattern — possible loan stacking'
      })
    }

    // Very few members after 30+ days
    const daysSince = chama?.created_at
      ? Math.floor((Date.now() - new Date(chama.created_at).getTime()) / (1000 * 60 * 60 * 24))
      : 0
    if (daysSince > 30 && members.length < 3) {
      ruleFlags.push({
        type: 'fake_chama',
        severity: 'low',
        description: `Group only has ${members.length} member(s) after ${daysSince} days`,
        details: 'Legitimate chamas typically have 5+ members within 30 days'
      })
    }

    // 7. Build data summary for AI
    const memberCount = members.length
    const totalContributions = recentContributions?.length || 0
    const confirmedContribs = recentContributions?.filter(c => c.status === 'confirmed').length || 0
    const failedContribs = recentContributions?.filter(c => c.status === 'failed').length || 0
    const pendingContribs = recentContributions?.filter(c => c.status === 'pending').length || 0
    const cashContribs = recentContributions?.filter(c => c.payment_method === 'cash').length || 0
    const totalLoanAmount = loans?.reduce((s, l) => s + (l.amount || 0), 0) || 0
    const approvedLoans = loans?.filter(l => l.status === 'approved' || l.status === 'active').length || 0

    const dataSummary = `
Chama: ${chama?.name} (${memberCount} active members, created ${daysSince} days ago)
Normal contribution: KSh ${chama?.contribution_amount}

Last 30 days activity:
- Total contributions: ${totalContributions} (${confirmedContribs} confirmed, ${failedContribs} failed, ${pendingContribs} pending)
- Cash contributions: ${cashContribs} (${totalContributions > 0 ? Math.round((cashContribs/totalContributions)*100) : 0}% of total)
- Active/approved loans: ${approvedLoans} totalling KSh ${totalLoanAmount}
- Transactions recorded: ${transactions?.length || 0}

Rule-based flags already detected: ${ruleFlags.length > 0 ? ruleFlags.map(f => f.description).join('; ') : 'None'}

Member overview:
${members.slice(0, 10).map(m => `- ${(m.profiles as any)?.full_name || 'Unknown'} (${m.role}, credit score: ${m.trust_score})`).join('\n')}
`

    // 8. AI analysis
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are SmartChama's AI fraud detection engine for Kenyan savings groups (chamas).

Analyze the group data for fraud patterns including:
- Fake contributions (cash-only, no M-Pesa receipts)
- Duplicate transactions
- Suspicious reversals or refunds
- Abnormal withdrawal behaviour
- Loan stacking or rapid borrowing
- Ghost members (inactive accounts)
- Admin self-dealing patterns
- Unusual timing patterns

Return ONLY valid JSON:
{
  "risk_level": <"Low"|"Medium"|"High"|"Critical">,
  "ai_flags": [
    {
      "type": <"duplicate_transaction"|"fake_contribution"|"suspicious_reversal"|"abnormal_withdrawal"|"loan_stacking"|"ghost_member"|"admin_self_dealing"|"unusual_pattern">,
      "severity": <"low"|"medium"|"high">,
      "description": <specific plain English description>,
      "recommendation": <specific action admin should take>
    }
  ],
  "overall_assessment": <2-3 sentence summary of the group's fraud risk>,
  "immediate_actions": [<up to 3 urgent actions if risk is high, empty if low>]
}`
        },
        {
          role: 'user',
          content: `Analyze this chama for fraud patterns:\n${dataSummary}`
        }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 600,
      temperature: 0.2,
    })

    const aiResult = JSON.parse(completion.choices[0].message.content || '{}')

    // 9. Merge rule flags + AI flags, save to DB
    const allFlags = [
      ...ruleFlags.map(f => ({ ...f, source: 'rule' })),
      ...(aiResult.ai_flags || []).map((f: any) => ({ ...f, source: 'ai' }))
    ]

    // Save flags to fraud_flags table
    for (const flag of allFlags) {
      try {
        await supabaseAdmin.from('fraud_flags').insert({
          chama_id,
          flag_type: flag.type || 'unusual_pattern',
          description: flag.description,
          severity: flag.severity || 'medium',
          resolved: false
        })
      } catch {
        // non-fatal
      }
    }

    return NextResponse.json({
      risk_level: aiResult.risk_level || 'Low',
      flags: allFlags,
      overall_assessment: aiResult.overall_assessment || 'No significant fraud patterns detected.',
      immediate_actions: aiResult.immediate_actions || [],
      scanned_at: new Date().toISOString()
    })

  } catch (err: any) {
    console.error('Fraud detection error:', err)
    return NextResponse.json({ error: 'Failed to run fraud detection' }, { status: 500 })
  }
}
