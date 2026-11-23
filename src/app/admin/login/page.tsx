"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { AuthShell } from "@/components/auth/AuthShell";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Button, Field, Notice, inputClass } from "@/components/ui";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      setError("Officials sign in with email. Use the email address on your account.");
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
          setError(`Incorrect email or password (${5 - newAttempts} attempts remaining).`);
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
        setError("This account is not a chair, treasurer, secretary or admin in any active group. Members can sign in on the member page.");
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
      
    } catch {
      setError("Could not sign in. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      aside="officials"
      title="Officials sign in"
      subtitle="For the people who run a group. You need an official role in at least one group."
      footer={
        <>
          Not an official?{" "}
          <Link href="/login" className="font-semibold text-brand underline-offset-4 hover:underline">
            Member sign in
          </Link>
        </>
      }
    >
      {error && <Notice tone="danger" className="mb-5">{error}</Notice>}
      <form onSubmit={handleLogin} className="space-y-5">
        <Field label="Email">
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className={inputClass}
          />
        </Field>
        <Field label="Password">
          <PasswordInput autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </Field>
        <Button type="submit" size="lg" variant="forest" disabled={loading} className="w-full">
          {loading ? "Checking your role…" : "Sign in as an official"}
        </Button>
      </form>
      <p className="mt-6 text-[14px] text-ink-3">
        Starting a new group?{" "}
        <Link href="/signup?role=admin" className="text-ink-2 font-medium underline underline-offset-4 hover:text-ink">Create an account first</Link>
      </p>
    </AuthShell>
  );
}
