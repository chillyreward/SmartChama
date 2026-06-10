"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [invite, setInvite] = useState<any>(null);
  const [validatingToken, setValidatingToken] = useState(!!token);

  useEffect(() => {
    if (token) {
      const validateToken = async () => {
        try {
          const { data, error } = await supabase
            .from('invite_tokens')
            .select('*, chamas(name)')
            .eq('token_code', token)
            .eq('is_used', false)
            .gt('expires_at', new Date().toISOString())
            .single();

          if (error || !data) {
            setError("Invalid or expired invite link. You can still sign up for a new account.");
          } else {
            setInvite(data);
          }
        } catch (err) {
          setError("Error validating invite link.");
        } finally {
          setValidatingToken(false);
        }
      };
      validateToken();
    }
  }, [token]);

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const formData = new FormData(e.currentTarget);
    const fullName = formData.get("full_name") as string;
    let phone = formData.get("phone") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const passwordConfirm = formData.get("password_confirm") as string;

    if (password !== passwordConfirm) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    // Clean up phone number
    phone = phone.replace(/\s+/g, '');
    if (phone.startsWith('0')) phone = phone.substring(1);
    const fullPhone = `+254${phone}`;

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: fullPhone
          }
        }
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (authData.user && invite) {
        // Create member record linked to invite.chama_id
        await supabase.from('members').insert({
          user_id: authData.user.id,
          chama_id: invite.chama_id,
          full_name: fullName,
          phone: fullPhone,
          role: 'member',
          status: 'active'
        });

        // Mark invite token as used
        await supabase.from('invite_tokens')
          .update({ is_used: true })
          .eq('token_code', token);
        
        router.push('/dashboard');
        return;
      }

      setSuccess("Check your email to confirm your account.");
    } catch (err) {
      setError("An unexpected error occurred during signup.");
    } finally {
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
        <Link href="/login" className="text-sm font-medium text-gray-500 hover:text-black transition-colors">
          Sign in
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6 py-24">
        <div className="w-full max-w-[400px]">
          
          {validatingToken ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Validating link...</p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-black mb-2">Create account</h1>
                <p className="text-sm text-gray-500">Free forever. No bank account required.</p>
              </div>

              {invite && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="text-sm font-bold text-green-900 mb-1">You've been invited!</h3>
                  <p className="text-sm text-green-800">
                    Join <span className="font-bold">{invite.chamas?.name}</span> and start contributing immediately.
                  </p>
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-black">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-black">
                  {success}
                </div>
              )}

              <form onSubmit={handleSignup} className="flex flex-col gap-5">
                
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Full Name</label>
                  <input 
                    type="text" 
                    name="full_name"
                    required
                    placeholder="Grace Wanjiku"
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-black placeholder:text-gray-400 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Phone Number</label>
                  <div className="flex border border-gray-200 rounded-lg focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-all overflow-hidden">
                    <div className="bg-gray-50 border-r border-gray-200 px-3 flex items-center justify-center">
                      <span className="text-sm text-gray-500 font-medium">+254</span>
                    </div>
                    <input 
                      type="tel" 
                      name="phone"
                      required
                      placeholder="712 345 678"
                      className="flex-1 px-4 py-3 text-sm text-black focus:outline-none placeholder:text-gray-400 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Email Address</label>
                  <input 
                    type="email" 
                    name="email"
                    required
                    placeholder="name@example.com"
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-black placeholder:text-gray-400 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Create Password</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"}
                      name="password"
                      required
                      placeholder="Min. 8 characters"
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

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Confirm Password</label>
                  <div className="relative">
                    <input 
                      type={showConfirmPassword ? "text" : "password"}
                      name="password_confirm"
                      required
                      placeholder="Re-enter password"
                      className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-black placeholder:text-gray-400 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black focus:outline-none text-xs font-medium uppercase tracking-wider"
                    >
                      {showConfirmPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-black text-white py-3 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors mt-4 disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? "Creating..." : "Create account"}
                </button>
              </form>

              <p className="text-left text-xs text-gray-500 mt-6 leading-relaxed">
                By signing up, you agree to our <Link href="#" className="underline hover:text-black">Terms of Service</Link> and <Link href="#" className="underline hover:text-black">Privacy Policy</Link>.
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center"><div className="w-8 h-8 border-4 border-[#22C55E] border-t-transparent rounded-full animate-spin"></div></div>}>
      <SignupContent />
    </Suspense>
  );
}
