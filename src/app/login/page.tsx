"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Lock, ArrowRight, ShieldCheck, Loader2, 
  Wallet, Eye, EyeOff
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate email format
    if (!email.includes("@")) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    try {
      console.log("=== Login Started ===");
      console.log("Email:", email);

      // Authenticate with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (authError) {
        console.error("Auth error:", authError);
        setError("Invalid credentials. Please check your email and password.");
        setLoading(false);
        return;
      }

      if (!authData.user) {
        setError("Invalid credentials. Please check your email and password.");
        setLoading(false);
        return;
      }

      console.log("✅ Authentication successful");
      console.log("User ID:", authData.user.id);

      // Check if user is an admin
      const { data: adminData } = await supabase
        .from('chama_admins')
        .select('*')
        .eq('email', email)
        .single();

      if (adminData) {
        console.log("✅ Admin account detected");
        router.push('/admin/dashboard');
        return;
      }

      // Check if user is a member
      const { data: memberData } = await supabase
        .from('members')
        .select('*')
        .eq('user_id', authData.user.id)
        .single();

      if (memberData) {
        console.log("✅ Member account detected");
        router.push('/dashboard');
        return;
      }

      // If neither admin nor member, sign out and show error
      await supabase.auth.signOut();
      setError("No account found. Please contact your administrator.");
      setLoading(false);
      
    } catch (err: any) {
      console.error("❌ Login error:", err);
      setError("Invalid credentials. Please check your information and try again.");
      setLoading(false);
    } finally {
      console.log("=== Login Ended ===");
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-900"></div>
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 blur-[100px] rounded-full"></div>

      <div className="w-full max-w-md relative z-10">
        
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl shadow-2xl shadow-emerald-500/10">
            <Wallet className="w-8 h-8 text-emerald-400" />
          </div>
        </div>

        {/* The Card */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 shadow-2xl">
          
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
              <p className="text-slate-400 text-sm">Sign in to access your account</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-emerald-500 uppercase tracking-widest mb-2 ml-1">
                  Email Address
                </label>
                <div className="relative">
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-white outline-none focus:border-emerald-500 focus:shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all placeholder:text-slate-600"
                  />
                  <ShieldCheck className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-500 uppercase tracking-widest mb-2 ml-1">
                  Password
                </label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-white outline-none focus:border-emerald-500 focus:shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all placeholder:text-slate-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-white hover:bg-emerald-50 text-black font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : (
                  <>
                    Sign In <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 space-y-3">
              <p className="text-center text-slate-500 text-sm">
                Don't have an account?{" "}
                <Link href="/signup" className="text-emerald-400 hover:text-emerald-300 font-bold">
                  Create Admin Account
                </Link>
              </p>
              <p className="text-center text-slate-500 text-sm">
                Have an invite code?{" "}
                <Link href="/member/signup" className="text-emerald-400 hover:text-emerald-300 font-bold">
                  Join as Member
                </Link>
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <p className="text-center text-slate-600 text-xs mt-8 flex items-center justify-center gap-2">
          <Lock className="w-3 h-3" /> 256-Bit End-to-End Encryption
        </p>

      </div>
    </div>
  );
}