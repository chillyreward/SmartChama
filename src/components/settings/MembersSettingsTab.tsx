'use client'
import { useState, useEffect } from 'react'
import { getSupabaseBrowser } from '@/lib/supabase-browser'

export function MembersSettingsTab({
  chamaId,
  adminId,
  chamaName
}: {
  chamaId: string
  adminId: string
  chamaName: string
}) {
  const supabase = getSupabaseBrowser()
  const [members, setMembers] = useState<any[]>([])
  const [invites, setInvites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [sending, setSending] = useState(false)
  const [inviteResult, setInviteResult] = useState<any>(null)
  const [inviteError, setInviteError] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    loadData()
  }, [chamaId])

  async function loadData() {
    setLoading(true)
    
    // Load current members
    const { data: memberData } = await supabase
      .from('chama_memberships')
      .select(`
        id, role, status, 
        trust_score, joined_at,
        profiles (
          id, full_name, email
        )
      `)
      .eq('chama_id', chamaId)
      .order('joined_at', { ascending: true })

    setMembers(memberData || [])

    // Load pending invites
    const { data: inviteData } = await supabase
      .from('invite_tokens')
      .select('*')
      .eq('chama_id', chamaId)
      .order('created_at', { ascending: false })
      .limit(20)

    setInvites(inviteData || [])
    setLoading(false)
  }

  async function handleSendInvite() {
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      setInviteError('Please enter a valid email address.')
      return
    }

    setSending(true)
    setInviteError('')

    try {
      const response = await fetch(
        '/api/invites/send',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: inviteEmail.trim(),
            name: inviteName.trim() || null,
            chama_id: chamaId,
            invited_by: adminId
          })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setInviteError(
          data.error || 'Could not send invite. Please try again.'
        )
        setSending(false)
        return
      }

      setInviteResult(data)
      setInviteEmail('')
      setInviteName('')
      setShowInviteForm(false)
      setToast(
        data.email_sent
          ? `Invite sent to ${inviteEmail}`
          : `Invite created. Share code: ${data.code}`
      )
      setTimeout(() => setToast(''), 4000)
      loadData() // Refresh the list

    } catch (err) {
      setInviteError('Network error. Please try again.')
    }

    setSending(false)
  }

  async function handleResendInvite(invite: any) {
    // Mark old one as expired
    await supabase
      .from('invite_tokens')
      .update({ status: 'expired' })
      .eq('id', invite.id)

    // Pre-fill the invite form
    setInviteEmail(invite.invited_email || '')
    setInviteName(invite.invited_name || '')
    setShowInviteForm(true)
  }

  async function handleRemoveMember(membership: any) {
    const name = membership.profiles?.full_name || 'this member'
    
    if (!confirm(
      `Remove ${name} from ${chamaName}? Their contribution history will be preserved.`
    )) return

    await supabase
      .from('chama_memberships')
      .update({ 
        status: 'removed',
        updated_at: new Date().toISOString()
      })
      .eq('id', membership.id)

    setToast(`${name} has been removed.`)
    setTimeout(() => setToast(''), 3000)
    loadData()
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i}
            className="h-16 rounded-xl animate-pulse"
            style={{
              backgroundColor: 'var(--bg-muted)'
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Toast notification */}
      {toast && (
        <div
          className="fixed top-6 right-6 z-50 px-5 py-3 rounded-xl text-[14px] font-medium shadow-lg transition-all duration-300"
          style={{
            backgroundColor: '#22C55E',
            color: 'white'
          }}>
          {toast}
        </div>
      )}

      {/* ══ INVITE MEMBER CARD ══ */}
      <div
        className="rounded-2xl p-6"
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border)'
        }}>

        <div className="flex items-center justify-between mb-4">
          <div>
            <h2
              className="text-[18px] font-bold"
              style={{
                color: 'var(--text-primary)'
              }}>
              Invite a Member
            </h2>
            <p
              className="text-[13px] mt-1"
              style={{
                color: 'var(--text-secondary)'
              }}>
              Only people you invite can join {chamaName}.
            </p>
          </div>

          {!showInviteForm && (
            <button
              onClick={() => {
                setShowInviteForm(true)
                setInviteResult(null)
                setInviteError('')
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-semibold bg-[#22C55E] text-white hover:bg-[#16A34A] transition-colors">
              <span className="material-symbols-outlined text-[20px]">
                person_add
              </span>
              Invite Member
            </button>
          )}
        </div>

        {/* Invite form */}
        {showInviteForm && (
          <div
            className="rounded-xl p-5"
            style={{
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-strong)'
            }}>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">

              {/* Name field */}
              <div>
                <label
                  className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5"
                  style={{
                    color: 'var(--text-secondary)'
                  }}>
                  Name
                  <span className="ml-1 normal-case font-normal">
                    (optional)
                  </span>
                </label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={e => setInviteName(e.target.value)}
                  placeholder="Grace Wanjiku"
                  className="w-full px-4 py-2.5 rounded-xl border text-[14px] focus:outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E]"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              {/* Email field */}
              <div>
                <label
                  className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5"
                  style={{
                    color: 'var(--text-secondary)'
                  }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSendInvite()
                  }}
                  placeholder="grace@example.com"
                  className="w-full px-4 py-2.5 rounded-xl border text-[14px] focus:outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E]"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)'
                  }}
                  autoFocus
                />
              </div>
            </div>

            {inviteError && (
              <div className="rounded-xl p-3 mb-4 text-[13px]"
                style={{
                  backgroundColor: 'var(--red-bg)',
                  color: 'var(--red-text)',
                  border: '1px solid',
                  borderColor: 'var(--red)'
                }}>
                {inviteError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowInviteForm(false)
                  setInviteEmail('')
                  setInviteName('')
                  setInviteError('')
                }}
                className="px-5 py-2.5 rounded-xl border text-[14px] font-medium transition-colors"
                style={{
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)',
                  backgroundColor: 'var(--bg-card)'
                }}>
                Cancel
              </button>
              <button
                onClick={handleSendInvite}
                disabled={sending || !inviteEmail.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[14px] font-semibold bg-[#22C55E] text-white hover:bg-[#16A34A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {sending ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">
                      send
                    </span>
                    Send Invite Email
                  </>
                )}
              </button>
            </div>

          </div>
        )}

        {/* Show invite result (backup code) */}
        {inviteResult && (
          <div
            className="rounded-xl p-5 mt-4"
            style={{
              backgroundColor: '#F0FDF4',
              border: '1px solid #BBF7D0'
            }}>
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-[22px] text-[#16A34A] flex-shrink-0 mt-0.5"
                style={{
                  fontVariationSettings: "'FILL' 1"
                }}>
                check_circle
              </span>
              <div className="flex-1">
                <p className="text-[14px] font-semibold text-[#166534] mb-1">
                  {inviteResult.email_sent ? 'Invite email sent' : 'Invite created'}
                </p>
                <p className="text-[13px] text-[#15803D]">
                  {inviteResult.email_sent
                    ? 'If they do not receive it, share this backup code:'
                    : 'Email delivery failed. Share this code manually:'}
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <span className="text-[28px] font-bold tracking-widest text-[#16A34A] font-mono">
                    {inviteResult.code}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(inviteResult.code)
                      setToast('Code copied!')
                      setTimeout(() => setToast(''), 2000)
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-medium text-[#166534] bg-white border border-[#BBF7D0] hover:bg-[#F0FDF4]">
                    <span className="material-symbols-outlined text-[14px]">
                      content_copy
                    </span>
                    Copy
                  </button>
                </div>
                <p className="text-[11px] text-[#15803D] mt-2">
                  Valid for 48 hours. Member enters this code when signing up.
                </p>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ══ CURRENT MEMBERS LIST ══ */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border)'
        }}>

        <div className="px-6 py-4"
          style={{
            borderBottom: '1px solid var(--border)'
          }}>
          <h2
            className="text-[18px] font-bold"
            style={{
              color: 'var(--text-primary)'
            }}>
            Current Members
          </h2>
          <p
            className="text-[13px] mt-0.5"
            style={{
              color: 'var(--text-secondary)'
            }}>
            {members.filter(m => m.status === 'active').length} active members
          </p>
        </div>

        <div className="divide-y"
          style={{
            borderColor: 'var(--border)'
          }}>
          {members
            .filter(m => m.status === 'active')
            .map(member => (
            <div
              key={member.id}
              className="flex items-center justify-between px-6 py-4">

              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-bold flex-shrink-0"
                  style={{
                    backgroundColor: 'var(--bg-subtle)',
                    color: 'var(--green)'
                  }}>
                  {(member.profiles?.full_name || 'M')
                    .split(' ')
                    .map((n: string) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </div>

                {/* Name + email */}
                <div>
                  <p
                    className="text-[14px] font-medium"
                    style={{
                      color: 'var(--text-primary)'
                    }}>
                    {member.profiles?.full_name || 'Unknown'}
                  </p>
                  <p
                    className="text-[12px]"
                    style={{
                      color: 'var(--text-secondary)'
                    }}>
                    {member.profiles?.email || ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Role badge */}
                <span
                  className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
                  style={{
                    backgroundColor: ['chairlady', 'admin'].includes(member.role)
                      ? 'var(--bg-subtle)'
                      : 'var(--bg-muted)',
                    color: ['chairlady', 'admin'].includes(member.role)
                      ? 'var(--green)'
                      : 'var(--text-secondary)'
                  }}>
                  {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                </span>

                {/* Trust score */}
                <span
                  className="text-[13px] font-semibold"
                  style={{
                    color: member.trust_score >= 80
                      ? 'var(--green)'
                      : member.trust_score >= 50
                        ? 'var(--yellow)'
                        : 'var(--red)'
                  }}>
                  {member.trust_score}/100
                </span>

                {/* Remove button (not for self) */}
                {member.profiles?.id !== adminId && (
                  <button
                    onClick={() => handleRemoveMember(member)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                    style={{
                      color: 'var(--red)',
                      backgroundColor: 'transparent'
                    }}
                    title="Remove member">
                    <span className="material-symbols-outlined text-[18px]">
                      person_remove
                    </span>
                  </button>
                )}
              </div>

            </div>
          ))}

          {members.filter(m => m.status === 'active').length === 0 && (
            <div className="px-6 py-12 text-center">
              <span className="material-symbols-outlined text-[40px] mb-3 block"
                style={{
                  color: 'var(--text-muted)'
                }}>
                group
              </span>
              <p
                className="text-[14px]"
                style={{
                  color: 'var(--text-secondary)'
                }}>
                No members yet. Invite your first member above.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* ══ PENDING INVITES ══ */}
      {invites.filter(i => i.status === 'pending').length > 0 && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border)'
          }}>

          <div className="px-6 py-4"
            style={{
              borderBottom: '1px solid var(--border)'
            }}>
            <h2
              className="text-[18px] font-bold"
              style={{
                color: 'var(--text-primary)'
              }}>
              Pending Invites
            </h2>
            <p
              className="text-[13px] mt-0.5"
              style={{
                color: 'var(--text-secondary)'
              }}>
              These people have been invited but have not joined yet.
            </p>
          </div>

          <div className="divide-y"
            style={{
              borderColor: 'var(--border)'
            }}>
            {invites
              .filter(i => i.status === 'pending')
              .map(invite => {
                const expires = new Date(invite.expires_at)
                const isExpired = expires < new Date()
                const hoursLeft = Math.max(
                  0,
                  Math.round((expires.getTime() - Date.now()) / (1000 * 60 * 60))
                )

                return (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between px-6 py-4">

                    <div>
                      <p
                        className="text-[14px] font-medium"
                        style={{
                          color: 'var(--text-primary)'
                        }}>
                        {invite.invited_name || 'Unknown name'}
                      </p>
                      <p
                        className="text-[12px]"
                        style={{
                          color: 'var(--text-secondary)'
                        }}>
                        {invite.invited_email}
                      </p>
                      <p
                        className="text-[11px] mt-1"
                        style={{
                          color: isExpired ? 'var(--red)' : 'var(--text-muted)'
                        }}>
                        {isExpired ? 'Expired' : `Expires in ${hoursLeft}h`}
                        {' · Code: '}
                        <span className="font-mono font-bold">
                          {invite.token}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(invite.token)
                          setToast('Code copied!')
                          setTimeout(() => setToast(''), 2000)
                        }}
                        className="px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-colors"
                        style={{
                          borderColor: 'var(--border)',
                          color: 'var(--text-secondary)',
                          backgroundColor: 'var(--bg-card)'
                        }}>
                        Copy Code
                      </button>
                      <button
                        onClick={() => handleResendInvite(invite)}
                        className="px-3 py-1.5 rounded-lg text-[12px] font-medium bg-[#22C55E] text-white hover:bg-[#16A34A] transition-colors">
                        Resend
                      </button>
                    </div>

                  </div>
                )
              })}
          </div>

        </div>
      )}

    </div>
  )
}
