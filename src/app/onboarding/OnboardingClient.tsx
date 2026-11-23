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
    let isMounted = true;

    async function checkState() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!isMounted) return;

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
      
      if (!isMounted) return;

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

        if (!isMounted) return;
          
        if (memberships && memberships.length > 0) {
          const chamaIds = memberships.map(m => m.chama_id);
          const { data: validChamas } = await supabase
            .from('chamas_v2')
            .select('id')
            .in('id', chamaIds);

          if (!isMounted) return;

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
          setStep(2);
        }
      } else {
        setStep(1);
      }
      setLoading(false);
    }

    checkState();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const [groupCode, setGroupCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  const handleJoinChama = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = groupCode.trim().toUpperCase();
    if (!cleanCode || !user) return;
    setJoining(true);
    setJoinError('');

    try {
      const res = await fetch('/api/chamas/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          group_code: cleanCode
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setJoinError(data.error || 'Failed to join group. Check your code and try again.');
        setJoining(false);
        return;
      }

      const chamaId = data.chama_id;
      if (chamaId) {
        sessionStorage.setItem('active_chama_id', chamaId);
        localStorage.setItem('sc_last_chama_id', chamaId);
        document.cookie = `active_chama_id=${chamaId}; path=/; max-age=${60 * 60 * 24 * 30}`;
      }

      await refreshMemberData();
      router.push('/dashboard');
    } catch (err: any) {
      setJoinError('Network error. Please check your connection and try again.');
    } finally {
      setJoining(false);
    }
  };

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

    // Save profile record
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        full_name: profileForm.full_name,
        phone_number: phone,
        email: user.email
      });

    if (profileError) {
      if (profileError.code === '23505') {
        setError('This phone number is already registered.');
      } else {
        setError('Failed to save profile. Please try again.');
      }
      setSaving(false);
      return;
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
      await refreshMemberData();
      router.push('/admin/dashboard');
    } catch (err) {
      setError('An unexpected error occurred.');
      setSaving(false);
    }
  };

  const handleLogout = signOut;

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--ak-surface-2)] dark:bg-[var(--ak-page)] flex items-center justify-center">
        <span className="w-8 h-8 border-4 border-[var(--ak-brand-ink)] border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex font-inter bg-[var(--ak-surface-2)] dark:bg-[var(--ak-page)] text-[var(--ak-text)] dark:text-[var(--ak-brand-ink)]">
      {/* LEFT PANEL */}
      <div className="hidden md:flex w-1/2 bg-[var(--ak-page)] flex-col justify-between p-12 relative overflow-hidden shrink-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[var(--ak-solid)]/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[var(--ak-solid)]/20 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="relative z-10">
          <Link href="/" className="inline-block mb-12">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Akibora"
                width={48}
                height={48}
                className="h-12 w-12 object-contain brightness-0 invert"
                priority
              />
              <span className="text-[22px] font-bold text-white tracking-tight">
                Akibora
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
              : "Create your Chama to start recording contributions, running your merry-go-round, and building trust."}
          </p>
          
          <div className="flex gap-2 mt-12">
            <div className={`h-1.5 w-12 rounded-full ${step >= 1 ? 'bg-[var(--ak-solid)]' : 'bg-white/20'}`}></div>
            <div className={`h-1.5 w-12 rounded-full ${step >= 2 ? 'bg-[var(--ak-solid)]' : 'bg-white/20'}`}></div>
          </div>
        </div>

        <div className="text-body-sm text-gray-500 relative z-10">
          Akibora Technologies Ltd
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-full md:w-1/2 flex flex-col bg-[var(--ak-surface-2)] dark:bg-[var(--ak-page)] relative">
        <div className="absolute top-6 right-6 z-10">
          <button onClick={handleLogout} className="text-body-sm text-[var(--ak-text-2)] dark:text-[var(--ak-text-3)] hover:text-[var(--ak-text)] dark:hover:text-[var(--ak-brand-ink)] font-medium transition-colors">
            Sign out
          </button>
        </div>

        {step === 2 && (
          <div className="absolute top-6 left-6 z-10 md:hidden">
            <button 
              onClick={() => setStep(1)} 
              className="text-[var(--ak-text-2)] dark:text-[var(--ak-text-3)] hover:text-[var(--ak-text)] dark:hover:text-[var(--ak-brand-ink)] flex items-center gap-1 text-body-sm font-medium"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              Back
            </button>
          </div>
        )}
        
        <div className="flex-1 flex items-center justify-center p-6 sm:p-8 pb-28 md:pb-8">
          <div className="w-full max-w-md bg-transparent md:bg-white md:dark:bg-[var(--ak-surface)] md:border border-[var(--ak-line)] dark:border-[var(--ak-line)] rounded-2xl p-0 md:p-8 sm:p-10 md:shadow-sm">
            {error && (
              <div className="mb-6 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded text-[#991b1b] dark:text-red-400 text-body-sm text-center">
                {error}
              </div>
            )}

            {/* Mobile Step Indicator */}
            <div className="md:hidden flex justify-center gap-2 mb-6">
              <div className={`h-1.5 w-8 rounded-full ${step >= 1 ? 'bg-[var(--ak-solid)]' : 'bg-[var(--ak-raised)] dark:bg-[var(--ak-raised)]'}`}></div>
              <div className={`h-1.5 w-8 rounded-full ${step >= 2 ? 'bg-[var(--ak-solid)]' : 'bg-[var(--ak-raised)] dark:bg-[var(--ak-raised)]'}`}></div>
            </div>

            {step === 1 && (
              <>
                <div className="mb-8">
                  <h1 className="text-[28px] font-geist font-bold text-[var(--ak-text)] dark:text-[var(--ak-brand-ink)]">Complete Profile</h1>
                  <p className="text-body-md text-[var(--ak-text-2)] dark:text-[var(--ak-text-3)] mt-1">Please provide your contact details.</p>
                </div>

                <form id="onboarding-profile-form" onSubmit={handleProfileSubmit} className="flex flex-col gap-5">
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--ak-text-2)] dark:text-[var(--ak-text-3)] uppercase tracking-wider mb-2">Full Name</label>
                    <input 
                      type="text" 
                      required
                      value={profileForm.full_name}
                      onChange={(e) => setProfileForm({...profileForm, full_name: e.target.value})}
                      placeholder="e.g. Grace Wanjiku"
                      className="w-full border border-[var(--ak-line)] dark:border-[var(--ak-line)] rounded-lg px-4 py-3 text-[var(--ak-text)] dark:text-[var(--ak-brand-ink)] bg-white dark:bg-[var(--ak-surface)] placeholder:text-[var(--ak-text-3)] dark:placeholder:text-[var(--ak-text-2)] focus:outline-none focus:border-[var(--ak-brand-ink)] focus:ring-1 focus:ring-[var(--ak-brand-ink)]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--ak-text-2)] dark:text-[var(--ak-text-3)] uppercase tracking-wider mb-2">Phone Number</label>
                    <div className="flex border border-[var(--ak-line)] dark:border-[var(--ak-line)] rounded-lg focus-within:border-[var(--ak-brand-ink)] focus-within:ring-1 focus-within:ring-[var(--ak-brand-ink)] overflow-hidden bg-white dark:bg-[var(--ak-surface)]">
                      <div className="bg-[var(--ak-surface-2)] dark:bg-[var(--ak-raised)] border-r border-[var(--ak-line)] dark:border-[var(--ak-line)] px-3 py-3 flex items-center justify-center">
                        <span className="text-body-sm text-[var(--ak-text-2)] dark:text-[var(--ak-text-3)] font-bold">+254</span>
                      </div>
                      <input 
                        type="tel" 
                        required
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                        placeholder="712 345 678"
                        className="flex-1 px-4 py-3 text-[var(--ak-text)] dark:text-[var(--ak-brand-ink)] bg-transparent focus:outline-none placeholder:text-[var(--ak-text-3)] dark:placeholder:text-[var(--ak-text-2)]"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={saving}
                    className="hidden md:flex w-full bg-[var(--ak-solid)] text-white py-3.5 rounded-lg text-body-sm font-semibold hover:bg-[var(--ak-solid)] transition-colors mt-2 disabled:opacity-70 justify-center items-center"
                  >
                    {saving ? 'Saving...' : 'Continue'}
                  </button>
                </form>
              </>
            )}

            {step === 2 && (
              <>
                <div className="mb-6">
                  <h1 className="text-[28px] font-geist font-bold text-[var(--ak-text)] dark:text-[var(--ak-brand-ink)]">Get Started with a Chama</h1>
                  <p className="text-body-md text-[var(--ak-text-2)] dark:text-[var(--ak-text-3)] mt-1">Join an existing group with an invite code, or create a new one.</p>
                </div>

                {/* JOIN EXISTING GROUP SECTION */}
                <div className="border border-[var(--ak-line)] dark:border-[var(--ak-line)] rounded-xl p-5 mb-8 bg-white dark:bg-[var(--ak-surface)]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-[var(--ak-brand-ink)]">group_add</span>
                    <h2 className="text-[16px] font-bold text-[var(--ak-text)] dark:text-[var(--ak-brand-ink)]">Join an Existing Group</h2>
                  </div>
                  <p className="text-[13px] text-[var(--ak-text-2)] dark:text-[var(--ak-text-3)] mb-4">
                    Have a 6-character group invite code from your Chama admin? Enter it below:
                  </p>

                  {joinError && (
                    <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 text-xs font-medium">
                      {joinError}
                    </div>
                  )}

                  <form onSubmit={handleJoinChama} className="flex flex-col sm:flex-row gap-3">
                    <input 
                      type="text" 
                      maxLength={10}
                      required
                      value={groupCode}
                      onChange={(e) => setGroupCode(e.target.value.toUpperCase())}
                      placeholder="ENTER CODE (e.g. AB12CD)"
                      className="flex-1 tracking-widest font-mono font-bold uppercase border border-[var(--ak-line)] dark:border-[var(--ak-line)] rounded-lg px-4 py-3 text-[var(--ak-text)] dark:text-[var(--ak-brand-ink)] bg-white dark:bg-[var(--ak-page)] placeholder:text-[var(--ak-text-3)] dark:placeholder:text-[var(--ak-text-2)] focus:outline-none focus:border-[var(--ak-brand-ink)] focus:ring-1 focus:ring-[var(--ak-brand-ink)]"
                    />
                    <button 
                      type="submit" 
                      disabled={joining || !groupCode.trim()}
                      className="bg-[var(--ak-solid)] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[var(--ak-solid)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
                    >
                      {joining ? 'Joining...' : 'Join Group'}
                    </button>
                  </form>
                </div>

                {/* VISUAL DIVIDER */}
                <div className="relative flex items-center justify-center my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[var(--ak-line)] dark:border-[var(--ak-line)]" />
                  </div>
                  <div className="relative px-4 bg-white dark:bg-[var(--ak-page)] text-[11px] font-bold uppercase tracking-widest text-[var(--ak-text-2)] dark:text-[var(--ak-text-3)]">
                    — OR CREATE A NEW GROUP —
                  </div>
                </div>

                <form id="onboarding-chama-form" onSubmit={handleCreateChama} className="flex flex-col gap-5">
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--ak-text-2)] dark:text-[var(--ak-text-3)] uppercase tracking-wider mb-2">Group Name</label>
                    <input 
                      type="text" 
                      required
                      value={chamaForm.name}
                      onChange={(e) => setChamaForm({...chamaForm, name: e.target.value})}
                      placeholder="e.g. Vision 2030 Investment Group"
                      className="w-full border border-[var(--ak-line)] dark:border-[var(--ak-line)] rounded-lg px-4 py-3 text-[var(--ak-text)] dark:text-[var(--ak-brand-ink)] bg-white dark:bg-[var(--ak-surface)] placeholder:text-[var(--ak-text-3)] dark:placeholder:text-[var(--ak-text-2)] focus:outline-none focus:border-[var(--ak-brand-ink)] focus:ring-1 focus:ring-[var(--ak-brand-ink)]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--ak-text-2)] dark:text-[var(--ak-text-3)] uppercase tracking-wider mb-2">Default Contribution (KSh)</label>
                    <input 
                      type="number" 
                      required
                      min="100"
                      value={chamaForm.contribution_amount}
                      onChange={(e) => setChamaForm({...chamaForm, contribution_amount: e.target.value})}
                      placeholder="e.g. 5000"
                      className="w-full border border-[var(--ak-line)] dark:border-[var(--ak-line)] rounded-lg px-4 py-3 text-[var(--ak-text)] dark:text-[var(--ak-brand-ink)] bg-white dark:bg-[var(--ak-surface)] placeholder:text-[var(--ak-text-3)] dark:placeholder:text-[var(--ak-text-2)] focus:outline-none focus:border-[var(--ak-brand-ink)] focus:ring-1 focus:ring-[var(--ak-brand-ink)]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--ak-text-2)] dark:text-[var(--ak-text-3)] uppercase tracking-wider mb-2">Frequency</label>
                    <select 
                      value={chamaForm.contribution_frequency}
                      onChange={(e) => setChamaForm({...chamaForm, contribution_frequency: e.target.value})}
                      className="w-full border border-[var(--ak-line)] dark:border-[var(--ak-line)] rounded-lg px-4 py-3 text-[var(--ak-text)] dark:text-[var(--ak-brand-ink)] bg-white dark:bg-[var(--ak-surface)] focus:outline-none focus:border-[var(--ak-brand-ink)] focus:ring-1 focus:ring-[var(--ak-brand-ink)]"
                    >
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>

                  {/* PAYMENT SETUP */}
                  <div className="border-t border-[var(--ak-line)] dark:border-[var(--ak-line)] pt-5 mt-5">
                    <label className="block text-[13px] font-bold text-[var(--ak-text)] dark:text-[var(--ak-brand-ink)] mb-3 text-left">
                      Where will members send money?
                    </label>

                    <div className="flex flex-col gap-3 mb-4 text-left">
                      {[
                        { value: 'till', label: 'Till Number (Lipa na M-Pesa)' },
                        { value: 'paybill', label: 'Paybill Number' },
                        { value: 'phone', label: 'Phone Number (Send Money)' }
                      ].map(option => (
                        <label key={option.value} className="flex items-center gap-3 cursor-pointer text-body-sm text-[var(--ak-text)] dark:text-[var(--ak-brand-ink)]">
                          <input 
                            type="radio" 
                            name="payment_type"
                            value={option.value}
                            checked={chamaForm.payment_type === option.value}
                            onChange={(e) => setChamaForm({...chamaForm, payment_type: e.target.value})}
                            className="text-[var(--ak-brand-ink)] focus:ring-[var(--ak-brand-ink)]"
                          />
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </div>

                    {chamaForm.payment_type === 'till' && (
                      <div className="space-y-4 text-left">
                        <div>
                          <label className="block text-[11px] font-semibold text-[var(--ak-text-2)] dark:text-[var(--ak-text-3)] uppercase tracking-wider mb-2">Till Number (5-6 digits)</label>
                          <input 
                            type="text" 
                            required
                            value={chamaForm.till_number}
                            onChange={(e) => setChamaForm({...chamaForm, till_number: e.target.value})}
                            placeholder="e.g. 543210"
                            className="w-full border border-[var(--ak-line)] dark:border-[var(--ak-line)] rounded-lg px-4 py-3 text-[var(--ak-text)] dark:text-[var(--ak-brand-ink)] bg-white dark:bg-[var(--ak-surface)] focus:outline-none focus:border-[var(--ak-brand-ink)]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-[var(--ak-text-2)] dark:text-[var(--ak-text-3)] uppercase tracking-wider mb-2">Account Name</label>
                          <input 
                            type="text" 
                            required
                            value={chamaForm.account_name}
                            onChange={(e) => setChamaForm({...chamaForm, account_name: e.target.value})}
                            placeholder="e.g. VISION 2030 CHAMA"
                            className="w-full border border-[var(--ak-line)] dark:border-[var(--ak-line)] rounded-lg px-4 py-3 text-[var(--ak-text)] dark:text-[var(--ak-brand-ink)] bg-white dark:bg-[var(--ak-surface)] focus:outline-none focus:border-[var(--ak-brand-ink)]"
                          />
                        </div>
                      </div>
                    )}

                    {chamaForm.payment_type === 'paybill' && (
                      <div className="space-y-4 text-left">
                        <div>
                          <label className="block text-[11px] font-semibold text-[var(--ak-text-2)] dark:text-[var(--ak-text-3)] uppercase tracking-wider mb-2">Paybill Number</label>
                          <input 
                            type="text" 
                            required
                            value={chamaForm.paybill_number}
                            onChange={(e) => setChamaForm({...chamaForm, paybill_number: e.target.value})}
                            placeholder="e.g. 247247"
                            className="w-full border border-[var(--ak-line)] dark:border-[var(--ak-line)] rounded-lg px-4 py-3 text-[var(--ak-text)] dark:text-[var(--ak-brand-ink)] bg-white dark:bg-[var(--ak-surface)] focus:outline-none focus:border-[var(--ak-brand-ink)]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-[var(--ak-text-2)] dark:text-[var(--ak-text-3)] uppercase tracking-wider mb-2">Account Number</label>
                          <input 
                            type="text" 
                            required
                            value={chamaForm.account_number}
                            onChange={(e) => setChamaForm({...chamaForm, account_number: e.target.value})}
                            placeholder="e.g. CHAMA2030"
                            className="w-full border border-[var(--ak-line)] dark:border-[var(--ak-line)] rounded-lg px-4 py-3 text-[var(--ak-text)] dark:text-[var(--ak-brand-ink)] bg-white dark:bg-[var(--ak-surface)] focus:outline-none focus:border-[var(--ak-brand-ink)]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-[var(--ak-text-2)] dark:text-[var(--ak-text-3)] uppercase tracking-wider mb-2">Account Name</label>
                          <input 
                            type="text" 
                            required
                            value={chamaForm.account_name}
                            onChange={(e) => setChamaForm({...chamaForm, account_name: e.target.value})}
                            placeholder="e.g. VISION 2030 CHAMA"
                            className="w-full border border-[var(--ak-line)] dark:border-[var(--ak-line)] rounded-lg px-4 py-3 text-[var(--ak-text)] dark:text-[var(--ak-brand-ink)] bg-white dark:bg-[var(--ak-surface)] focus:outline-none focus:border-[var(--ak-brand-ink)]"
                          />
                        </div>
                      </div>
                    )}

                    {chamaForm.payment_type === 'phone' && (
                      <div className="space-y-4 text-left">
                        <div>
                          <label className="block text-[11px] font-semibold text-[var(--ak-text-2)] dark:text-[var(--ak-text-3)] uppercase tracking-wider mb-2">Phone Number</label>
                          <input 
                            type="tel" 
                            required
                            value={chamaForm.phone_number}
                            onChange={(e) => setChamaForm({...chamaForm, phone_number: e.target.value})}
                            placeholder="e.g. +254712345678"
                            className="w-full border border-[var(--ak-line)] dark:border-[var(--ak-line)] rounded-lg px-4 py-3 text-[var(--ak-text)] dark:text-[var(--ak-brand-ink)] bg-white dark:bg-[var(--ak-surface)] focus:outline-none focus:border-[var(--ak-brand-ink)]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-[var(--ak-text-2)] dark:text-[var(--ak-text-3)] uppercase tracking-wider mb-2">Account Name</label>
                          <input 
                            type="text" 
                            required
                            value={chamaForm.account_name}
                            onChange={(e) => setChamaForm({...chamaForm, account_name: e.target.value})}
                            placeholder="e.g. Grace Wanjiku"
                            className="w-full border border-[var(--ak-line)] dark:border-[var(--ak-line)] rounded-lg px-4 py-3 text-[var(--ak-text)] dark:text-[var(--ak-brand-ink)] bg-white dark:bg-[var(--ak-surface)] focus:outline-none focus:border-[var(--ak-brand-ink)]"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <button 
                    type="submit" 
                    disabled={saving}
                    className="hidden md:flex w-full bg-[var(--ak-solid)] text-white py-3.5 rounded-lg text-body-sm font-semibold hover:bg-[var(--ak-solid)] transition-colors mt-2 disabled:opacity-70 justify-center items-center gap-2"
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
        <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 pb-safe bg-white dark:bg-[var(--ak-page)] border-t border-[var(--ak-line)] dark:border-[var(--ak-line)] z-20">
          <button 
            type="submit"
            form={step === 1 ? 'onboarding-profile-form' : 'onboarding-chama-form'}
            disabled={saving}
            className="w-full bg-[var(--ak-solid)] text-white py-4 rounded-xl text-[16px] font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? 'Processing...' : step === 1 ? 'Continue' : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  );
}
