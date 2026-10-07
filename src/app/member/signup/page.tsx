import { redirect } from 'next/navigation'

// Legacy page: wrote to the old `members` / `invite_tokens.token_code` schema.
// Member sign-up now lives at /signup?role=member (joins via join_chama_by_code).
export default async function MemberSignupRedirect({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; code?: string }>
}) {
  const { token, code } = await searchParams
  const joinCode = code || token
  redirect(joinCode ? `/signup?role=member&code=${encodeURIComponent(joinCode)}` : '/signup?role=member')
}
