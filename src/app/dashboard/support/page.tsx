"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";

export default function SupportPage() {
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
      setTicketId("SC-" + Math.floor(100000 + Math.random() * 900000));
    }, 1500);
  };

  const resetForm = () => {
    setSubject("");
    setCategory("general");
    setMessage("");
    setSuccess(false);
  };

  const faqs = [
    { q: "How is my Chama trust score calculated?", a: "Your trust score is a weighted index calculated from your timely contributions (100% weight for M-Pesa automated receipts, 50% weight for manual cash confirmations) and loan repayment history." },
    { q: "Can I belong to multiple Chamas on SmartChama?", a: "Yes, SmartChama supports multi-chama membership. You can switch between active groups using the Group Switcher in the top portal navigation." },
    { q: "What is the Withdrawal Consent system?", a: "To prevent admin self-dealing, any withdrawal request initiated by a chama admin must be voted on and approved by a majority of active members before the funds can be released." },
    { q: "How do I deposit funds into my Chama?", a: "Click on 'New Contribution' from your dashboard sidebar or navigate to the Wallet page, enter the amount, and initiate an M-Pesa STK push contribution." }
  ];

  return (
    <div className="max-w-5xl p-6 md:p-8 font-inter text-[var(--text-main)] min-h-full">
      {/* Page Header */}
      <div className="mb-8">
        <p className="text-[12px] text-[#9CA3AF] dark:text-[#5a6e5a] font-medium mb-1 flex items-center gap-1">
          <span>Dashboard</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span>Support & Help Center</span>
        </p>
        
        <h1 className="text-[28px] font-bold text-[var(--text-main)] tracking-tight leading-tight">
          Help & Support Center
        </h1>
        <p className="text-[14px] text-[var(--text-muted)] mt-1">
          Find answers to common questions or reach out to the SmartChama customer support desk.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 columns: FAQ & Contact */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* FAQ */}
          <div className="card-bg border border-[var(--border)] rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-[var(--text-main)] font-geist mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#22C55E]">quiz</span>
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {faqs.map((faq, idx) => (
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
              Contact Us Directly
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="p-3 bg-[#F0FDF4] dark:bg-[#1f2a1f] text-[#22C55E] rounded-xl">
                  <span className="material-symbols-outlined">mail</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-main)]">Email Address</h4>
                  <p className="text-xs text-[var(--text-muted)] mt-1">We respond within 4 hours</p>
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
                  <h4 className="text-sm font-bold text-[var(--text-main)]">Phone Support</h4>
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
                <h3 className="text-lg font-bold text-[var(--text-main)] font-geist mb-2">Submit Support Ticket</h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">Fill in the details below to raise a ticket with our support engineers.</p>
                
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
                    <option value="general">General Inquiry</option>
                    <option value="payment">Deposits & M-Pesa</option>
                    <option value="loans">Loan Requests</option>
                    <option value="trust">Trust Score</option>
                    <option value="bug">Report a Bug</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-[var(--text-main)] mb-1.5">Message / Details</label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Describe your issue in detail..."
                    className="w-full bg-white dark:bg-[#1a1f1b] border border-[var(--border)] rounded-lg px-3 py-2 text-[13px] text-[var(--text-main)] focus:border-[#22C55E] focus:outline-hidden resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#22C55E] hover:bg-[#006e2f] text-white py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  {submitting ? "Submitting..." : "Submit Request"}
                </button>
              </form>
            ) : (
              <div className="text-center py-6 space-y-4">
                <div className="w-12 h-12 bg-[#F0FDF4] dark:bg-[#1f2a1f] rounded-full flex items-center justify-center mx-auto text-[#22C55E]">
                  <span className="material-symbols-outlined text-[32px]">check_circle</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-main)]">Ticket Submitted</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Ticket Reference:</p>
                  <p className="text-md font-mono font-bold text-[#22C55E] mt-0.5">{ticketId}</p>
                </div>
                <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
                  Thank you! Your request has been logged. Our customer support representatives will follow up shortly via email.
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
