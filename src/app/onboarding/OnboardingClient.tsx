'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { signOut } from '@/lib/auth-helpers';

export default function OnboardingClient() {
  const router = useRouter();
  const { refreshMemberData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');

  // Forms
  const [profileForm, setProfileForm] = useState({ full_name: '', phone: '' });
  const [chamaForm, setChamaForm] = useState({ 
    name: '', 
    contribution_amount: '', 
    contribution_frequency: 'monthly',
    payment_type: 'till',
    till_number: '',
    paybill_number: '',
    account_number: '',
    phone_number: '',
    account_name: ''
  });

  useEffect(() => {
    async function checkState() {
      const { data: { user } } = await supabase.auth.getUser();
      const session = user ? { user } : null;
      if (!session) {
        router.push('/login');
        return;
      }
      setUser(session.user);

      if (session.user.user_metadata?.full_name) {
        setProfileForm(prev => ({ ...prev, full_name: session.user.user_metadata.full_name }));
      }
      if (session.user.user_metadata?.phone) {
        setProfileForm(prev => ({ ...prev, phone: session.user.user_metadata.phone }));
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (profile && profile.full_name && profile.phone_number) {
        setProfileForm(prev => ({ 
          ...prev, 
          full_name: profile.full_name || prev.full_name,
          phone: profile.phone_number || prev.phone
        }));
        
        const { data: memberships } = await supabase
          .from('chama_memberships')
          .select('chama_id, role')
          .eq('profile_id', session.user.id)
          .eq('status', 'active');
          
        if (memberships && memberships.length > 0) {
          const chamaIds = memberships.map(m => m.chama_id);
          const { data: validChamas } = await supabase
            .from('chamas_v2')
            .select('id')
            .in('id', chamaIds);

          if (validChamas && validChamas.length > 0) {
            let activeChamaId = null;
            if (typeof document !== 'undefined') {
              const match = document.cookie.match(new RegExp('(^| )active_chama_id=([^;]+)'));
              if (match) activeChamaId = match[2];
            }
            if (!activeChamaId || !validChamas.some(c => c.id === activeChamaId)) {
              const firstValidId = validChamas[0].id;
              if (typeof document !== 'undefined') {
                document.cookie = `active_chama_id=${firstValidId}; path=/; max-age=${60 * 60 * 24 * 30}`;
              }
            }
            router.push('/dashboard');
            return;
          } else {
            setStep(2);
          }
        } else {
          setStep(2); // Has profile, needs chama
        }
      } else {
        setStep(1); // Needs profile
      }
      setLoading(false);
    }
    checkState();
  }, [router]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    
    let phone = profileForm.phone.replace(/\s/g,'');
    if (phone.startsWith('0')) {
      phone = '+254' + phone.slice(1);
    }
    if (!phone.startsWith('+254')) {
      phone = '+254' + phone;
    }

    // Save profile via server API (bypasses RLS)
    const res = await fetch('/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.id,
        full_name: profileForm.full_name.trim(),
        phone_number: phone || null,
        email: user.email || ''
      })
    })

    const result = await res.json()

    if (!res.ok) {
      console.error('Profile save failed:', result)
      setError(result.error?.includes('phone') 
        ? 'This phone number is already registered.' 
        : `Failed to save profile: ${result.error || 'Please try again.'}`)
      setSaving(false)
      return
    }

    setStep(2);
    setSaving(false);
  };

  const handleCreateChama = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    
    try {
      const res = await fetch('/api/chamas/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: user.id,
          email: user.email,
          full_name: profileForm.full_name,
          phone: profileForm.phone,
          chama_name: chamaForm.name,
          contribution_amount: chamaForm.contribution_amount,
          contribution_frequency: chamaForm.contribution_frequency,
          payment_type: chamaForm.payment_type,
          till_number: chamaForm.till_number,
          paybill_number: chamaForm.paybill_number,
          account_number: chamaForm.account_number,
          phone_number: chamaForm.phone_number,
          account_name: chamaForm.account_name
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create group');
        setSaving(false);
        return;
      }

      document.cookie = `active_chama_id=${data.chama_id}; path=/; max-age=${60 * 60 * 24 * 30}`;
      sessionStorage.setItem('active_chama_id', data.chama_id);
      // Hard redirect so AuthProvider reloads with fresh membership
      window.location.href = '/admin/dashboard';
    } catch (err) {
      setError('An unexpected error occurred.');
      setSaving(false);
    }
  };

  const handleLogout = signOut;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0B0F0C] flex items-center justify-center">
        <span className="w-8 h-8 border-4 border-[#22C55E] border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex font-inter bg-[#FAFAFA] dark:bg-[#0B0F0C] text-[#161d16] dark:text-[#E8F0E4]">
      {/* LEFT PANEL */}
      <div className="hidden md:flex w-1/2 bg-[#0B0F0C] flex-col justify-between p-12 relative overflow-hidden shrink-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#22C55E]/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#006e2f]/20 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="relative z-10">
          <Link href="/" className="inline-block mb-12">
            <div className="flex items-center gap-3">
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
          </Link>
        </div>

        <div className="relative z-10">
          <h2 className="text-[40px] font-geist font-bold text-white max-w-md leading-tight">
            {step === 1 ? "Let's set up your profile." : "Let's set up your group."}
          </h2>
          <p className="text-[18px] text-gray-400 mt-4 max-w-sm leading-relaxed">
            {step === 1 
              ? "We need a few details to create your verifiable financial identity." 
              : "Create your Chama to start recording contributions, tracking loans, and building trust."}
          </p>
          
          <div className="flex gap-2 mt-12">
            <div className={`h-1.5 w-12 rounded-full ${step >= 1 ? 'bg-[#22C55E]' : 'bg-white/20'}`}></div>
            <div className={`h-1.5 w-12 rounded-full ${step >= 2 ? 'bg-[#22C55E]' : 'bg-white/20'}`}></div>
          </div>
        </div>

        <div className="text-body-sm text-gray-500 relative z-10">
          SmartChama Technologies Ltd
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-full md:w-1/2 flex flex-col bg-[#FAFAFA] dark:bg-[#0B0F0C] relative">
        <div className="absolute top-6 right-6 z-10">
          <button onClick={handleLogout} className="text-body-sm text-[#60645f] dark:text-[#8FA88F] hover:text-[#161d16] dark:hover:text-[#E8F0E4] font-medium transition-colors">
            Sign out
          </button>
        </div>

        {step === 2 && (
          <div className="absolute top-6 left-6 z-10 md:hidden">
            <button 
              onClick={() => setStep(1)} 
              className="text-[#60645f] dark:text-[#8FA88F] hover:text-[#161d16] dark:hover:text-[#E8F0E4] flex items-center gap-1 text-body-sm font-medium"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              Back
            </button>
          </div>
        )}
        
        <div className="flex-1 flex items-center justify-center p-6 sm:p-8 pb-28 md:pb-8">
          <div className="w-full max-w-md bg-transparent md:bg-white md:dark:bg-[#161d16] md:border border-[#E5E7EB] dark:border-[#2d3d2d] rounded-2xl p-0 md:p-8 sm:p-10 md:shadow-sm">
            {error && (
              <div className="mb-6 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded text-[#991b1b] dark:text-red-400 text-body-sm text-center">
                {error}
              </div>
            )}

            {/* Mobile Step Indicator */}
            <div className="md:hidden flex justify-center gap-2 mb-6">
              <div className={`h-1.5 w-8 rounded-full ${step >= 1 ? 'bg-[#22C55E]' : 'bg-[#E5E7EB] dark:bg-[#2d3d2d]'}`}></div>
              <div className={`h-1.5 w-8 rounded-full ${step >= 2 ? 'bg-[#22C55E]' : 'bg-[#E5E7EB] dark:bg-[#2d3d2d]'}`}></div>
            </div>

            {step === 1 && (
              <>
                <div className="mb-8">
                  <h1 className="text-[28px] font-geist font-bold text-[#161d16] dark:text-[#E8F0E4]">Complete Profile</h1>
                  <p className="text-body-md text-[#60645f] dark:text-[#8FA88F] mt-1">Please provide your contact details.</p>
                </div>

                <form onSubmit={handleProfileSubmit} className="flex flex-col gap-5">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#60645f] dark:text-[#8FA88F] uppercase tracking-wider mb-2">Full Name</label>
                    <input 
                      type="text" 
                      required
                      value={profileForm.full_name}
                      onChange={(e) => setProfileForm({...profileForm, full_name: e.target.value})}
                      placeholder="e.g. Grace Wanjiku"
                      className="w-full border border-[#E5E7EB] dark:border-[#2d3d2d] rounded-lg px-4 py-3 text-[#161d16] dark:text-[#E8F0E4] bg-white dark:bg-[#1a2218] placeholder:text-[#9CA3AF] dark:placeholder:text-[#4a5e4a] focus:outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#60645f] dark:text-[#8FA88F] uppercase tracking-wider mb-2">Phone Number</label>
                    <div className="flex border border-[#E5E7EB] dark:border-[#2d3d2d] rounded-lg focus-within:border-[#22C55E] focus-within:ring-1 focus-within:ring-[#22C55E] overflow-hidden bg-white dark:bg-[#1a2218]">
                      <div className="bg-[#FAFAFA] dark:bg-[#1f2a1f] border-r border-[#E5E7EB] dark:border-[#2d3d2d] px-3 py-3 flex items-center justify-center">
                        <span className="text-body-sm text-[#60645f] dark:text-[#8FA88F] font-bold">+254</span>
                      </div>
                      <input 
                        type="tel" 
                        required
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                        placeholder="712 345 678"
                        className="flex-1 px-4 py-3 text-[#161d16] dark:text-[#E8F0E4] bg-transparent focus:outline-none placeholder:text-[#9CA3AF] dark:placeholder:text-[#4a5e4a]"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={saving}
                    className="hidden md:flex w-full bg-[#22C55E] text-white py-3.5 rounded-lg text-body-sm font-semibold hover:bg-[#006e2f] transition-colors mt-2 disabled:opacity-70 justify-center items-center"
                  >
                    {saving ? 'Saving...' : 'Continue'}
                  </button>
                </form>
              </>
            )}

            {step === 2 && (
              <>
                <div className="mb-8">
                  <h1 className="text-[28px] font-geist font-bold text-[#161d16] dark:text-[#E8F0E4]">Create a Group</h1>
                  <p className="text-body-md text-[#60645f] dark:text-[#8FA88F] mt-1">Set up your Chama to start adding members.</p>
                </div>

                <div className="bg-[#edf6ea] dark:bg-[#1a2a1a] border border-[#22C55E]/30 dark:border-[#2d3d2d] rounded-lg p-4 mb-6 flex gap-3 items-start">
                  <span className="material-symbols-outlined text-[#006e2f] dark:text-[#4ae176] shrink-0">info</span>
                  <div className="text-body-sm text-[#3d4a3d] dark:text-[#8FA88F]">
                    If you were invited to an existing group, ask your admin for the invite link.
                  </div>
                </div>

                <form onSubmit={handleCreateChama} className="flex flex-col gap-5">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#60645f] dark:text-[#8FA88F] uppercase tracking-wider mb-2">Group Name</label>
                    <input 
                      type="text" 
                      required
                      value={chamaForm.name}
                      onChange={(e) => setChamaForm({...chamaForm, name: e.target.value})}
                      placeholder="e.g. Vision 2030 Investment Group"
                      className="w-full border border-[#E5E7EB] dark:border-[#2d3d2d] rounded-lg px-4 py-3 text-[#161d16] dark:text-[#E8F0E4] bg-white dark:bg-[#1a2218] placeholder:text-[#9CA3AF] dark:placeholder:text-[#4a5e4a] focus:outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#60645f] dark:text-[#8FA88F] uppercase tracking-wider mb-2">Default Contribution (KSh)</label>
                    <input 
                      type="number" 
                      required
                      min="100"
                      value={chamaForm.contribution_amount}
                      onChange={(e) => setChamaForm({...chamaForm, contribution_amount: e.target.value})}
                      placeholder="e.g. 5000"
                      className="w-full border border-[#E5E7EB] dark:border-[#2d3d2d] rounded-lg px-4 py-3 text-[#161d16] dark:text-[#E8F0E4] bg-white dark:bg-[#1a2218] placeholder:text-[#9CA3AF] dark:placeholder:text-[#4a5e4a] focus:outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#60645f] dark:text-[#8FA88F] uppercase tracking-wider mb-2">Frequency</label>
                    <select 
                      value={chamaForm.contribution_frequency}
                      onChange={(e) => setChamaForm({...chamaForm, contribution_frequency: e.target.value})}
                      className="w-full border border-[#E5E7EB] dark:border-[#2d3d2d] rounded-lg px-4 py-3 text-[#161d16] dark:text-[#E8F0E4] bg-white dark:bg-[#1a2218] focus:outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E]"
                    >
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>

                  {/* PAYMENT SETUP */}
                  <div className="border-t border-[#E5E7EB] dark:border-[#2d3d2d] pt-5 mt-5">
                    <label className="block text-[13px] font-bold text-[#161d16] dark:text-[#E8F0E4] mb-3 text-left">
                      Where will members send money?
                    </label>

                    <div className="flex flex-col gap-3 mb-4 text-left">
                      {[
                        { value: 'till', label: 'Till Number (Lipa na M-Pesa)' },
                        { value: 'paybill', label: 'Paybill Number' },
                        { value: 'phone', label: 'Phone Number (Send Money)' }
                      ].map(option => (
                        <label key={option.value} className="flex items-center gap-3 cursor-pointer text-body-sm text-[#161d16] dark:text-[#E8F0E4]">
                          <input 
                            type="radio" 
                            name="payment_type"
                            value={option.value}
                            checked={chamaForm.payment_type === option.value}
                            onChange={(e) => setChamaForm({...chamaForm, payment_type: e.target.value})}
                            className="text-[#22C55E] focus:ring-[#22C55E]"
                          />
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </div>

                    {chamaForm.payment_type === 'till' && (
                      <div className="space-y-4 text-left">
                        <div>
                          <label className="block text-[11px] font-semibold text-[#60645f] dark:text-[#8FA88F] uppercase tracking-wider mb-2">Till Number (5-6 digits)</label>
                          <input 
                            type="text" 
                            required
                            value={chamaForm.till_number}
                            onChange={(e) => setChamaForm({...chamaForm, till_number: e.target.value})}
                            placeholder="e.g. 543210"
                            className="w-full border border-[#E5E7EB] dark:border-[#2d3d2d] rounded-lg px-4 py-3 text-[#161d16] dark:text-[#E8F0E4] bg-white dark:bg-[#1a2218] focus:outline-none focus:border-[#22C55E]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-[#60645f] dark:text-[#8FA88F] uppercase tracking-wider mb-2">Account Name</label>
                          <input 
                            type="text" 
                            required
                            value={chamaForm.account_name}
                            onChange={(e) => setChamaForm({...chamaForm, account_name: e.target.value})}
                            placeholder="e.g. VISION 2030 CHAMA"
                            className="w-full border border-[#E5E7EB] dark:border-[#2d3d2d] rounded-lg px-4 py-3 text-[#161d16] dark:text-[#E8F0E4] bg-white dark:bg-[#1a2218] focus:outline-none focus:border-[#22C55E]"
                          />
                        </div>
                      </div>
                    )}

                    {chamaForm.payment_type === 'paybill' && (
                      <div className="space-y-4 text-left">
                        <div>
                          <label className="block text-[11px] font-semibold text-[#60645f] dark:text-[#8FA88F] uppercase tracking-wider mb-2">Paybill Number</label>
                          <input 
                            type="text" 
                            required
                            value={chamaForm.paybill_number}
                            onChange={(e) => setChamaForm({...chamaForm, paybill_number: e.target.value})}
                            placeholder="e.g. 247247"
                            className="w-full border border-[#E5E7EB] dark:border-[#2d3d2d] rounded-lg px-4 py-3 text-[#161d16] dark:text-[#E8F0E4] bg-white dark:bg-[#1a2218] focus:outline-none focus:border-[#22C55E]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-[#60645f] dark:text-[#8FA88F] uppercase tracking-wider mb-2">Account Number</label>
                          <input 
                            type="text" 
                            required
                            value={chamaForm.account_number}
                            onChange={(e) => setChamaForm({...chamaForm, account_number: e.target.value})}
                            placeholder="e.g. CHAMA2030"
                            className="w-full border border-[#E5E7EB] dark:border-[#2d3d2d] rounded-lg px-4 py-3 text-[#161d16] dark:text-[#E8F0E4] bg-white dark:bg-[#1a2218] focus:outline-none focus:border-[#22C55E]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-[#60645f] dark:text-[#8FA88F] uppercase tracking-wider mb-2">Account Name</label>
                          <input 
                            type="text" 
                            required
                            value={chamaForm.account_name}
                            onChange={(e) => setChamaForm({...chamaForm, account_name: e.target.value})}
                            placeholder="e.g. VISION 2030 CHAMA"
                            className="w-full border border-[#E5E7EB] dark:border-[#2d3d2d] rounded-lg px-4 py-3 text-[#161d16] dark:text-[#E8F0E4] bg-white dark:bg-[#1a2218] focus:outline-none focus:border-[#22C55E]"
                          />
                        </div>
                      </div>
                    )}

                    {chamaForm.payment_type === 'phone' && (
                      <div className="space-y-4 text-left">
                        <div>
                          <label className="block text-[11px] font-semibold text-[#60645f] dark:text-[#8FA88F] uppercase tracking-wider mb-2">Phone Number</label>
                          <input 
                            type="tel" 
                            required
                            value={chamaForm.phone_number}
                            onChange={(e) => setChamaForm({...chamaForm, phone_number: e.target.value})}
                            placeholder="e.g. +254712345678"
                            className="w-full border border-[#E5E7EB] dark:border-[#2d3d2d] rounded-lg px-4 py-3 text-[#161d16] dark:text-[#E8F0E4] bg-white dark:bg-[#1a2218] focus:outline-none focus:border-[#22C55E]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-[#60645f] dark:text-[#8FA88F] uppercase tracking-wider mb-2">Account Name</label>
                          <input 
                            type="text" 
                            required
                            value={chamaForm.account_name}
                            onChange={(e) => setChamaForm({...chamaForm, account_name: e.target.value})}
                            placeholder="e.g. Grace Wanjiku"
                            className="w-full border border-[#E5E7EB] dark:border-[#2d3d2d] rounded-lg px-4 py-3 text-[#161d16] dark:text-[#E8F0E4] bg-white dark:bg-[#1a2218] focus:outline-none focus:border-[#22C55E]"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <button 
                    type="submit" 
                    disabled={saving}
                    className="hidden md:flex w-full bg-[#22C55E] text-white py-3.5 rounded-lg text-body-sm font-semibold hover:bg-[#006e2f] transition-colors mt-2 disabled:opacity-70 justify-center items-center gap-2"
                  >
                    {saving ? 'Creating...' : (
                      <>
                        Create Group
                        <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>

        {/* Fixed Continue Button on Mobile */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 pb-safe bg-white dark:bg-[#0B0F0C] border-t border-[#E5E7EB] dark:border-[#1a2a1a] z-20">
          <button 
            onClick={() => {
              const form = document.querySelector('form');
              if (form) form.requestSubmit();
            }}
            disabled={saving}
            className="w-full bg-[#22C55E] text-white py-4 rounded-xl text-[16px] font-semibold flex items-center justify-center gap-2"
          >
            {saving ? 'Processing...' : step === 1 ? 'Continue' : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  );
}
