import { redirect } from 'next/navigation'

// Legacy page: inserted into `chama_admins` and created chamas from the browser.
// Admin sign-up now lives at /signup?role=admin (server-side /api/chamas/create).
export default function AdminSignupRedirect() {
  redirect('/signup?role=admin')
}
