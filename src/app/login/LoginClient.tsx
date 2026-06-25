'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getSupabaseBrowser } from '@/lib/supabase-browser';

export default function LoginClient() {
  const router = useRouter();
  const supabase = getSupabaseBrowser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error: authError } = await supabase.auth.signInWithPassword({ 
      email, password 
    });

    if (authError) {
      setError(
        authError.message.includes('Invalid')
          ? 'Incorrect email or password.'
          : authError.message.includes('confirmed')
          ? 'Please confirm your email first.'
          : 'Could not sign in. Please try again.'
      );
      setLoading(false);
      return;
    }

    const { data: memberships } = await supabase
      .from('chama_memberships')
      .select(`
        role, status,
        chamas_v2 ( id, name )
      `)
      .eq('profile_id', data.user.id)
      .eq('status', 'active');

    if (!memberships || memberships.length === 0) {
      router.push('/onboarding');
      return;
    }

    if (memberships.length > 1) {
      router.push('/select-group');
      return;
    }

    const m = memberships[0];
    sessionStorage.setItem('active_chama_id', (m.chamas_v2 as any).id);

    const isAdmin = ['admin', 'chairlady', 'treasurer', 'secretary'].includes(m.role);

    router.push(isAdmin ? '/admin/dashboard' : '/dashboard');
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
            Your contributions build more than savings. They build your financial identity.
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
      <div className="flex-1 flex items-center justify-center p-6 bg-white dark:bg-[#161d16] relative min-h-screen">
        
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

          <h1 className="text-[32px] font-bold text-[#161d16] dark:text-[#E8F0E4] text-center mb-2">Welcome back</h1>
          <p className="text-[#60645f] dark:text-[#8FA88F] text-[15px] text-center mb-8">Sign in to your account</p>

          {error && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-lg px-4 py-3 text-[14px] text-[#991b1b] dark:text-red-400 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
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
              <div className="flex justify-between mb-1.5">
                <label className="text-[11px] font-semibold text-[#60645f] dark:text-[#8FA88F] uppercase tracking-wider">Password</label>
                <button 
                  type="button"
                  onClick={async () => {
                    if (!email) {
                      setError('Enter your email address first.');
                      return;
                    }
                    await supabase.auth.resetPasswordForEmail(
                      email,
                      { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback` }
                    );
                    setError('');
                    alert('Password reset link sent to ' + email);
                  }}
                  className="text-[13px] text-[#006e2f] dark:text-[#4ae176] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Your password"
                required
                className="w-full border border-[#E5E7EB] dark:border-[#2d3d2d] rounded-lg px-4 py-3 text-[14px] text-[#161d16] dark:text-[#E8F0E4] bg-white dark:bg-[#1a2218] placeholder:text-[#9CA3AF] dark:placeholder:text-[#4a5e4a] focus:outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#22C55E] text-white py-3 rounded-lg text-[15px] font-semibold hover:bg-[#006e2f] transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-[14px] text-[#60645f] dark:text-[#8FA88F] mt-6">
            Do not have an account?{' '}
            <Link href="/signup" className="text-[#006e2f] dark:text-[#4ae176] font-semibold hover:underline">
              Get started free
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}
