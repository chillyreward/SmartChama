"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Lock, ArrowRight, ShieldCheck, Loader2, 
  Eye, EyeOff, Crown, User
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (lockedUntil && Date.now() < lockedUntil) {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
      setError(`Too many login attempts. Try again in ${remaining} seconds.`);
      return;
    }

    setLoading(true);
    setError("");

    // Validate email format
    if (!email.includes("@")) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    try {
      const cleanEmail = email.trim();

      // Step 1: Authenticate with Supabase Auth (email + password)
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password,
      });

      if (authError || !authData.user) {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        if (newAttempts >= 5) {
          setLockedUntil(Date.now() + 60000);
          setAttempts(0);
          setError("Too many failed login attempts. Account locked for 60 seconds.");
        } else {
          setError(`Invalid credentials. ${5 - newAttempts} attempts remaining.`);
        }
        setLoading(false);
        return;
      }

      // Step 2: Query chama_memberships table to verify admin authorization
      const { data: memberships, error: memberError } = await supabase
        .from('chama_memberships')
        .select('role, status, chama_id, chamas_v2!inner(id, name)')
        .eq('profile_id', authData.user.id)
        .eq('status', 'active')
        .in('role', ['admin', 'chairlady', 'treasurer', 'secretary']);

      if (memberError || !memberships || memberships.length === 0) {
        // Sign out user since they lack admin role
        await supabase.auth.signOut();
        setError("Access denied. You do not have admin permissions in any Chama.");
        setLoading(false);
        return;
      }

      const activeMembership = memberships[0];
      const chamaId = (activeMembership.chamas_v2 as any)?.id || activeMembership.chama_id;

      if (chamaId) {
        sessionStorage.setItem('active_chama_id', chamaId);
        localStorage.setItem('sc_last_chama_id', chamaId);
        document.cookie = `active_chama_id=${chamaId}; path=/; max-age=${60 * 60 * 24 * 30}`;
      }

      // Redirect to admin dashboard
      router.push(`/admin/dashboard`);
      
    } catch (err: any) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-300"
      style={{ backgroundColor: 'var(--bg-page)' }}
    >
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#22C55E] via-emerald-500 to-[#16A34A]"></div>

      <div className="w-full max-w-md relative z-10">
        
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div 
            className="p-3 rounded-2xl shadow-xl transition-colors"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <Crown className="w-8 h-8 text-[#22C55E]" />
          </div>
        </div>

        {/* The Card */}
        <div 
          className="rounded-[32px] p-8 shadow-2xl transition-colors"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-8">
              <div 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
                style={{ backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border)' }}
              >
                <Crown className="w-4 h-4 text-[#22C55E]" />
                <span className="text-xs font-bold text-[#22C55E] uppercase tracking-wider">Admin Access</span>
              </div>
              <h1 
                className="text-2xl font-bold mb-2 font-geist"
                style={{ color: 'var(--text-primary)' }}
              >
                Chama Admin Login
              </h1>
              <p 
                className="text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                Sign in to manage your chama
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl text-sm" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label 
                  className="block text-xs font-bold uppercase tracking-widest mb-2 ml-1"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Admin Email
                </label>
                <div className="relative">
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="w-full rounded-xl px-4 py-4 outline-none focus:border-[#22C55E] transition-all"
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      borderColor: 'var(--border)',
                      borderWidth: '1px',
                      color: 'var(--text-primary)'
                    }}
                  />
                  <ShieldCheck className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                </div>
              </div>

              <div>
                <label 
                  className="block text-xs font-bold uppercase tracking-widest mb-2 ml-1"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Password
                </label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-xl px-4 py-4 outline-none focus:border-[#22C55E] transition-all"
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      borderColor: 'var(--border)',
                      borderWidth: '1px',
                      color: 'var(--text-primary)'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : (
                  <>
                    <Crown className="w-4 h-4" />
                    Admin Sign In 
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Demo accounts section */}
            <div className="mt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
                <span className="text-[12px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Try a demo account
                </span>
                <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Admin demo button */}
                <button
                  type="button"
                  onClick={() => {
                    setEmail('demo.admin@smartchama.co.ke');
                    setPassword('DemoAdmin2024!');
                  }}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all hover:border-[#22C55E]"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-input)' }}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-subtle)' }}>
                    <Crown className="w-4 h-4 text-[#22C55E]" />
                  </div>
                  <div className="text-center">
                    <p className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Admin Demo
                    </p>
                  </div>
                </button>

                {/* Member demo button */}
                <button
                  type="button"
                  onClick={() => {
                    setEmail('demo.member@smartchama.co.ke');
                    setPassword('DemoMember2024!');
                  }}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all hover:border-[#22C55E]"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-input)' }}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-subtle)' }}>
                    <User className="w-4 h-4 text-[#22C55E]" />
                  </div>
                  <div className="text-center">
                    <p className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Member Demo
                    </p>
                  </div>
                </button>
              </div>
              <p className="text-[11px] text-center mt-2" style={{ color: 'var(--text-muted)' }}>
                Clicking a demo button auto-fills test credentials.
              </p>
            </div>

            <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
              <p className="text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                Don't have an admin account? <Link href="/admin/signup" className="text-[#22C55E] hover:underline font-bold">Create Chama</Link>
              </p>
              <p className="text-center text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                Member login? <Link href="/login" className="text-[#22C55E] hover:underline font-bold">Click here</Link>
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <p className="text-center text-xs mt-8 flex items-center justify-center gap-2" style={{ color: 'var(--text-muted)' }}>
          <Lock className="w-3 h-3" /> Admin Portal - Secure Access
        </p>

      </div>
    </div>
  );
}
