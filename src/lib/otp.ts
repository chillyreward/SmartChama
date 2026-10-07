import { createHash, randomInt, timingSafeEqual } from 'crypto'

export const OTP_TTL_MS = 5 * 60 * 1000
export const OTP_MAX_ATTEMPTS = 5

export function generateOtp(): string {
  return randomInt(100000, 1000000).toString()
}

// Codes are stored hashed (bound to the phone) so a database read doesn't leak live codes
export function hashOtp(phone: string, code: string): string {
  const pepper = process.env.OTP_PEPPER || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  return createHash('sha256').update(`${pepper}:${phone}:${code}`).digest('hex')
}

export function otpMatches(phone: string, code: string, storedHash: string): boolean {
  const a = Buffer.from(hashOtp(phone, code))
  const b = Buffer.from(storedHash)
  return a.length === b.length && timingSafeEqual(a, b)
}

export function normalizeKenyanPhone(raw: string): string {
  let phone = String(raw).replace(/[\s-]/g, '')
  if (phone.startsWith('+')) return phone
  if (phone.startsWith('254')) return '+' + phone
  if (phone.startsWith('0')) phone = phone.slice(1)
  return '+254' + phone
}
