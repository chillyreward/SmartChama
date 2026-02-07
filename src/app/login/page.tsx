"use client"; // <--- THIS IS NEW (Allows typing)

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet, Users, AtSign, Sun, Shield, TrendingUp, Bell } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState(""); // Stores what you type
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulating a login delay for realism
    setTimeout(() => {
      // Redirect to dashboard WITH your name
      router.push(`/dashboard?user=${encodeURIComponent(name || "Member")}`);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-500 p-1.5 rounded-lg">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-slate-900">SmartChama</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Welcome Back</h1>
            <p className="text-slate-500">Login to manage your savings</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Your Name</label>
              <div className="relative">
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Lenny" 
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900" 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="block w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-full transition-colors text-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Logging in..." : "Login to Dashboard"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}