"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleLogin = async () => {
    try {
      await supabase.auth.signInWithOAuth({ provider: 'google' });
    } catch (err) {
      setError("Failed to initialize Google login.");
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email address to reset your password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        setError(error.message);
      } else {
        setError("Password reset email sent. Please check your inbox.");
      }
    } catch (err) {
      setError("Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (authError || !authData.user) {
        setError("Invalid credentials. Please check your information and try again.");
        setLoading(false);
        return;
      }

      // Fetch member profile
      const { data: member } = await supabase
        .from('members')
        .select('role, chama_id, full_name')
        .eq('user_id', authData.user.id)
        .single();

      if (!member) {
        router.push('/onboarding');
        return;
      }

      if (member.role === 'admin' || member.role === 'chairlady' || member.role === 'treasurer') {
        router.push('/admin/dashboard');
      } else {
        router.push('/dashboard');
      }
      
    } catch (err: any) {
      setError("Invalid credentials. Please check your information and try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-inter">
      {/* Header */}
      <header className="absolute top-0 w-full p-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-black rounded-sm flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-sm"></div>
          </div>
          <span className="text-xl font-bold tracking-tight text-black">SmartChama</span>
        </div>
        <Link href="/signup" className="text-sm font-medium text-gray-500 hover:text-black transition-colors">
          Create account
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[400px]">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-black mb-2">Sign in</h1>
            <p className="text-sm text-gray-500">Enter your details below to access your account</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-black">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                Phone or Email
              </label>
              <input 
                type="text" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-black placeholder:text-gray-400 transition-all"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Password
                </label>
                <button type="button" onClick={handleForgotPassword} className="text-xs font-medium text-gray-500 hover:text-black bg-transparent border-none p-0 cursor-pointer transition-colors">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-black placeholder:text-gray-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black focus:outline-none text-xs font-medium uppercase tracking-wider"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-black text-white py-3 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors mt-2 disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-200"></div>
            <div className="text-xs uppercase tracking-wider text-gray-400 font-medium">Or</div>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          <div className="flex flex-col gap-3">
            <button type="button" onClick={handleGoogleLogin} className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-black py-3 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
              Continue with Google
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}