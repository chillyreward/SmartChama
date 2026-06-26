"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";

export default function AdminSupportPage() {
  const { member, group } = useAuth();
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("general");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [ticketId, setTicketId] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) return;

    setSubmitting(true);
    // Simulate sending support request
    setTimeout(() => {
      setSubmitting(false);
      setSuccess(true);
      setTicketId("SC-ADM-" + Math.floor(100000 + Math.random() * 900000));
    }, 1500);
  };

  const resetForm = () => {
    setSubject("");
    setCategory("general");
    setMessage("");
    setSuccess(false);
  };

  const adminFaqs = [
    { q: "How do I hook up Safaricom M-Pesa webhook ingestion?", a: "Navigate to Settings → Payment Configurations. Choose 'Lipa Na M-Pesa Till Number' or 'M-Pesa Paybill', enter your credentials, and click Save. Our backend webhook routes will automatically record matching checkout receipt codes." },
    { q: "What triggers an Anti-Fraud warning flag?", a: "The Anti-Fraud system runs profiles scanning: (1) if a single phone number joins more than 5 chamas, (2) if a group has less than 3 active members 30 days after creation, or (3) if 100% of contributions are manually confirmed without genuine Safaricom M-Pesa receipts." },
    { q: "How do I release funds from the wallet?", a: "To prevent arbitrary withdrawal risks, initiating a withdrawal on the Wallet page logs a Withdrawal Consent request. Members receive a vote notification. Once a majority votes 'Approve', you can click 'Execute Withdrawal' to finalize." },
    { q: "Where can I view member contribution streaks and defaults?", a: "Go to the Members page and click on any specific member name. A behavior drawer opens outlining their consistency metrics,Streaks, and default rates." }
  ];

  return (
    <div className="max-w-5xl p-6 md:p-8 font-inter text-[var(--text-main)] min-h-full">
      {/* Page Header */}
      <div className="mb-8">
        <p className="text-[12px] text-[#9CA3AF] dark:text-[#5a6e5a] font-medium mb-1 flex items-center gap-1">
          <span>Admin Dashboard</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span>Support Desk</span>
        </p>
        
        <h1 className="text-[28px] font-bold text-[var(--text-main)] tracking-tight leading-tight">
          Admin Help Desk
        </h1>
        <p className="text-[14px] text-[var(--text-muted)] mt-1">
          Access group management guides, troubleshoot configuration issues, or speak to a support representative.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 columns: FAQ & Contact */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* FAQ */}
          <div className="card-bg border border-[var(--border)] rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-[var(--text-main)] font-geist mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#22C55E]">settings_accessibility</span>
              Administrator Guides & FAQ
            </h2>
            <div className="space-y-4">
              {adminFaqs.map((faq, idx) => (
                <div key={idx} className="border-b border-gray-100 dark:border-gray-800 pb-4 last:border-0 last:pb-0">
                  <h4 className="text-[14px] font-bold text-[var(--text-main)] mb-1">{faq.q}</h4>
                  <p className="text-[12.5px] text-[var(--text-muted)] leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CONTACT INFO */}
          <div className="card-bg border border-[var(--border)] rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-[var(--text-main)] font-geist mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#22C55E]">contact_support</span>
              Contact Admin Support Desk
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="p-3 bg-[#F0FDF4] dark:bg-[#1f2a1f] text-[#22C55E] rounded-xl">
                  <span className="material-symbols-outlined">mail</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-main)]">Priority Email</h4>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Admin SLA response: 2 hours</p>
                  <a href="mailto:support@smartchama.co.ke" className="text-sm font-semibold text-[#22C55E] hover:underline mt-1 block">
                    support@smartchama.co.ke
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-3 bg-[#F0FDF4] dark:bg-[#1f2a1f] text-[#22C55E] rounded-xl">
                  <span className="material-symbols-outlined">phone</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-main)]">Admin Helpline</h4>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Mon - Fri, 8AM - 5PM EAT</p>
                  <a href="tel:+254712345678" className="text-sm font-semibold text-[#22C55E] hover:underline mt-1 block">
                    +254 712 345 678
                  </a>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right column: Feedback form */}
        <div className="lg:col-span-1">
          <div className="card-bg border border-[var(--border)] rounded-2xl p-6 shadow-sm sticky top-24">
            {!success ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-lg font-bold text-[var(--text-main)] font-geist mb-2">Raise Support Ticket</h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">Fill in the details below. Admin queries are prioritized by our support team.</p>
                
                <div>
                  <label className="block text-[12px] font-semibold text-[var(--text-main)] mb-1.5">Subject</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="Brief summary of the issue"
                    className="w-full bg-white dark:bg-[#1a1f1b] border border-[var(--border)] rounded-lg px-3 py-2 text-[13px] text-[var(--text-main)] focus:border-[#22C55E] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-[var(--text-main)] mb-1.5">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full bg-white dark:bg-[#1a1f1b] border border-[var(--border)] rounded-lg px-3 py-2 text-[13px] text-[var(--text-main)] focus:border-[#22C55E] focus:outline-hidden"
                  >
                    <option value="general">General Admin Inquiry</option>
                    <option value="payment">M-Pesa Setup & Callback</option>
                    <option value="fraud">Fraud & Verification Flags</option>
                    <option value="compliance">Rules & Compliance Settings</option>
                    <option value="bug">Report a Dashboard Bug</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-[var(--text-main)] mb-1.5">Message / Details</label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Provide details about the configuration or error..."
                    className="w-full bg-white dark:bg-[#1a1f1b] border border-[var(--border)] rounded-lg px-3 py-2 text-[13px] text-[var(--text-main)] focus:border-[#22C55E] focus:outline-hidden resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#22C55E] hover:bg-[#006e2f] text-white py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  {submitting ? "Submitting..." : "Submit Admin Request"}
                </button>
              </form>
            ) : (
              <div className="text-center py-6 space-y-4">
                <div className="w-12 h-12 bg-[#F0FDF4] dark:bg-[#1f2a1f] rounded-full flex items-center justify-center mx-auto text-[#22C55E]">
                  <span className="material-symbols-outlined text-[32px]">check_circle</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-main)]">Priority Ticket Submitted</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Ticket Reference:</p>
                  <p className="text-md font-mono font-bold text-[#22C55E] mt-0.5">{ticketId}</p>
                </div>
                <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
                  Thank you! Your request has been logged in our priority admin queue. Our support desk will respond to your registered email shortly.
                </p>
                <button
                  onClick={resetForm}
                  className="bg-transparent border border-[var(--border)] hover:bg-gray-100 dark:hover:bg-[#1f2a1f] text-[var(--text-main)] px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Submit Another Ticket
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
