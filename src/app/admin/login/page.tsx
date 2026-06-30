"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Lock, ArrowRight, ShieldCheck, Loader2, 
  Wallet, Eye, EyeOff, Crown
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AdminLoginPage() {
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
      console.log("=== Admin Login Started ===");
      console.log("Email:", email);

      // Step 1: Authenticate with Supabase Auth (email + password)
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

      console.log(" Authentication successful");
      console.log("User ID:", authData.user.id);

      // Step 2: Query chama_admins table to verify admin authorization
      const { data: adminData, error: adminError } = await supabase
        .from('chama_admins')
        .select('*')
        .eq('admin_user_id', authData.user.id)
        .single();

      console.log("Admin query result:", adminData);
      console.log("Admin query error:", adminError);

      // Step 3: Check if user is an admin
      if (adminError || !adminData) {
        console.error(" User is not an admin");
        // Sign out the user since they're not authorized
        await supabase.auth.signOut();
        setError("Access denied. Admin credentials required.");
        setLoading(false);
        return;
      }

      // Step 4: Success - User is authorized as admin
      console.log(" Admin authorization successful!");
      console.log("Admin Name:", adminData.full_name);

      // Redirect to admin dashboard
      router.push(`/admin/dashboard`);
      
    } catch (err: any) {
      console.error(" Login error:", err);
      setError("Invalid credentials. Please check your information and try again.");
    } finally {
      setLoading(false);
      console.log("=== Admin Login Ended ===");
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-900"></div>
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-500/10 blur-[100px] rounded-full"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-500/5 blur-[100px] rounded-full"></div>

      <div className="w-full max-w-md relative z-10">
        
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="bg-slate-900 border border-amber-800 p-3 rounded-2xl shadow-2xl shadow-amber-500/10">
            <Crown className="w-8 h-8 text-amber-400" />
          </div>
        </div>

        {/* The Card */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-amber-500/20 rounded-[32px] p-8 shadow-2xl">
          
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-4 py-2 rounded-full mb-4">
                <Crown className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Admin Access</span>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Chama Admin Login</h1>
              <p className="text-slate-400 text-sm">Sign in to manage your chama</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-amber-500 uppercase tracking-widest mb-2 ml-1">
                  Admin Email
                </label>
                <div className="relative">
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-white outline-none focus:border-amber-500 focus:shadow-[0_0_20px_rgba(251,191,36,0.2)] transition-all placeholder:text-slate-600"
                  />
                  <ShieldCheck className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-500 uppercase tracking-widest mb-2 ml-1">
                  Password
                </label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-white outline-none focus:border-amber-500 focus:shadow-[0_0_20px_rgba(251,191,36,0.2)] transition-all placeholder:text-slate-600"
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
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(251,191,36,0.3)]"
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

            <div className="mt-6 pt-6 border-t border-slate-800">
              <p className="text-center text-slate-500 text-sm">
                Don't have an admin account? <Link href="/admin/signup" className="text-amber-400 hover:text-amber-300 font-bold">Create Chama</Link>
              </p>
              <p className="text-center text-slate-500 text-sm mt-2">
                Member login? <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-bold">Click here</Link>
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <p className="text-center text-slate-600 text-xs mt-8 flex items-center justify-center gap-2">
          <Lock className="w-3 h-3" /> Admin Portal - Secure Access
        </p>

      </div>
    </div>
  );
}
