'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getSupabaseBrowser } from '@/lib/supabase-browser';

export default function SignupClient() {
  const router = useRouter();
  const supabase = getSupabaseBrowser();

  const [fullName, setFullName] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.match(/[A-Z]/) && password.match(/[a-z]/)) strength++;
  if (password.match(/[0-9!@#$%^&*]/)) strength++;

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      setLoading(false);
      return;
    }

    let phone = phoneInput.replace(/\s/g, '');
    if (phone.startsWith('0')) {
      phone = '+254' + phone.slice(1);
    }
    if (!phone.startsWith('+254')) {
      phone = '+254' + phone;
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { 
          full_name: fullName, 
          phone_number: phone 
        }
      }
    });

    if (authError) {
      setError(
        authError.message.includes('already registered')
          ? 'An account with this email already exists.'
          : authError.message
      );
      setLoading(false);
      return;
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user!.id,
        full_name: fullName,
        phone_number: phone,
        email: email
      });

    if (profileError) {
      if (profileError.code === '23505') {
        setError('This phone number is already registered.');
      } else {
        setError('Account created but profile setup failed. Contact support.');
      }
      setLoading(false);
      return;
    }

    try {
      await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          message: `Welcome to SmartChama, ${fullName}. Your account is ready. Sign in at ${process.env.NEXT_PUBLIC_APP_URL}`
        })
      });
    } catch (e) {
      console.error('Welcome SMS failed:', e);
    }

    router.push('/onboarding');
  }

  return (
    <div className="min-h-screen flex bg-[#FAFAFA] dark:bg-[#0B0F0C] text-[#161d16] dark:text-[#E8F0E4]">
      {/* Left dark panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-[#0B0F0C] p-12 shrink-0">
        <div className="flex items-center gap-3 mb-12">
          <Image
            src="/logo.png"
            alt="SmartChama"
            width={48}
            height={48}
            className="h-12 w-12 object-contain brightness-0 invert"
            priority
          />
          <span className="text-[22px] font-bold text-white tracking-tight">
            SmartChama
          </span>
        </div>

        <div>
          <p className="text-white text-[32px] font-bold leading-tight max-w-sm">
            Join thousands of Kenyan savings groups already building their financial future.
          </p>

          <div className="mt-10 space-y-4">
            {[
              ['shield', '256-bit encryption'],
              ['payments', 'M-Pesa connected'],
              ['verified_user', 'Tamper-proof ledger']
            ].map(([icon, text]) => (
              <div key={text} className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#22C55E] text-[20px]">{icon}</span>
                <span className="text-gray-400 text-[14px]">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-gray-600 text-[13px]">
          SmartChama Technologies Ltd. Nairobi, Kenya.
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 py-12 overflow-y-auto bg-white dark:bg-[#161d16] relative min-h-screen">
        
        {/* Logo shown on mobile since left panel is hidden */}
        <div className="lg:hidden absolute top-6 left-6 flex items-center gap-2">
          <Image
            src="/favicon.svg"
            alt="SmartChama"
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
          />
          <span className="text-[18px] font-bold text-[#161d16] dark:text-[#E8F0E4]">
            SmartChama
          </span>
        </div>

        {/* Form card */}
        <div className="w-full max-w-md pt-16 lg:pt-0">

          <div className="flex items-center gap-3 justify-center mb-8">
            <Image
              src="/logo.png"
              alt="SmartChama"
              width={48}
              height={48}
              className="h-12 w-12 object-contain"
              priority
            />
            <span className="text-[24px] font-bold tracking-tight text-[#161d16] dark:text-[#E8F0E4]">
              SmartChama
            </span>
          </div>

          <h1 className="text-[32px] font-bold text-[#161d16] dark:text-[#E8F0E4] text-center mb-2">Create an account</h1>
          <p className="text-[#60645f] dark:text-[#8FA88F] text-[15px] text-center mb-8">Get started with SmartChama</p>

          {error && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-lg px-4 py-3 text-[14px] text-[#991b1b] dark:text-red-400 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-[#60645f] dark:text-[#8FA88F] uppercase tracking-wider mb-1.5">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Jane Doe"
                required
                className="w-full border border-[#E5E7EB] dark:border-[#2d3d2d] rounded-lg px-4 py-3 text-[14px] text-[#161d16] dark:text-[#E8F0E4] bg-white dark:bg-[#1a2218] placeholder:text-[#9CA3AF] dark:placeholder:text-[#4a5e4a] focus:outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#60645f] dark:text-[#8FA88F] uppercase tracking-wider mb-1.5">Phone Number</label>
              <input
                type="tel"
                value={phoneInput}
                onChange={e => setPhoneInput(e.target.value)}
                placeholder="07XX XXX XXX"
                required
                className="w-full border border-[#E5E7EB] dark:border-[#2d3d2d] rounded-lg px-4 py-3 text-[14px] text-[#161d16] dark:text-[#E8F0E4] bg-white dark:bg-[#1a2218] placeholder:text-[#9CA3AF] dark:placeholder:text-[#4a5e4a] focus:outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#60645f] dark:text-[#8FA88F] uppercase tracking-wider mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full border border-[#E5E7EB] dark:border-[#2d3d2d] rounded-lg px-4 py-3 text-[14px] text-[#161d16] dark:text-[#E8F0E4] bg-white dark:bg-[#1a2218] placeholder:text-[#9CA3AF] dark:placeholder:text-[#4a5e4a] focus:outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#60645f] dark:text-[#8FA88F] uppercase tracking-wider mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min 8 characters"
                required
                minLength={8}
                className="w-full border border-[#E5E7EB] dark:border-[#2d3d2d] rounded-lg px-4 py-3 text-[14px] text-[#161d16] dark:text-[#E8F0E4] bg-white dark:bg-[#1a2218] placeholder:text-[#9CA3AF] dark:placeholder:text-[#4a5e4a] focus:outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] transition-colors"
              />
              {password.length > 0 && (
                <div className="mt-2 h-1 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      strength === 1 ? 'w-1/3 bg-red-500' : 
                      strength === 2 ? 'w-2/3 bg-yellow-500' : 
                      strength === 3 ? 'w-full bg-green-500' : 'w-0'
                    }`}
                  ></div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#60645f] dark:text-[#8FA88F] uppercase tracking-wider mb-1.5">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                required
                minLength={8}
                className="w-full border border-[#E5E7EB] dark:border-[#2d3d2d] rounded-lg px-4 py-3 text-[14px] text-[#161d16] dark:text-[#E8F0E4] bg-white dark:bg-[#1a2218] placeholder:text-[#9CA3AF] dark:placeholder:text-[#4a5e4a] focus:outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#22C55E] text-white py-3 rounded-lg text-[15px] font-semibold hover:bg-[#006e2f] transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-4"
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          <p className="text-center text-[14px] text-[#60645f] dark:text-[#8FA88F] mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-[#006e2f] dark:text-[#4ae176] font-semibold hover:underline">
              Log in instead
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}
