"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

export default function AdminSettingsPage() {
  const { member: adminMember, group } = useAuth();
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    contribution_amount: 0,
    late_penalty: 0,
    cycle_start: "",
    currency: "KSh"
  });

  useEffect(() => {
    if (group) {
      setFormData({
        name: group.name || "",
        contribution_amount: group.contribution_amount || 0,
        late_penalty: group.late_penalty || 0,
        cycle_start: group.cycle_start_date ? group.cycle_start_date.split('T')[0] : "",
        currency: group.currency || "KSh"
      });
      setLoading(false);
    }
  }, [group]);

  const handleSave = async () => {
    try {
      const { error } = await supabase.from('groups').update({
        name: formData.name,
        contribution_amount: formData.contribution_amount,
        late_penalty: formData.late_penalty,
        cycle_start_date: formData.cycle_start ? new Date(formData.cycle_start).toISOString() : null,
        currency: formData.currency
      }).eq('id', group?.id);

      if (error) throw error;

      await supabase.from('transactions').insert({
        group_id: group?.id,
        recorded_by: adminMember?.id,
        type: 'settings_update',
        amount: 0,
        notes: `Updated group settings: Name, Contribution, Penalty`,
        status: 'confirmed'
      });

      setToastMsg("Settings saved successfully!");
      setTimeout(() => setToastMsg(""), 3000);
    } catch (err) {
      alert("Error saving settings");
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-96 bg-white border border-[#E5E7EB] rounded-lg animate-pulse shadow-sm"></div>
      </div>
    );
  }

  return (
    <div className="p-8 font-inter relative min-h-full">
      {toastMsg && (
        <div className="fixed top-4 right-4 bg-[#22C55E] text-white px-4 py-2 rounded shadow-lg z-50 flex items-center gap-2 animate-fade-in">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span className="text-body-sm font-medium">{toastMsg}</span>
        </div>
      )}

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-headline-lg font-semibold text-on-surface font-geist">Group Settings</h1>
          <p className="text-body-sm text-secondary mt-1">Configure core chama parameters</p>
        </div>
        <button 
          onClick={handleSave}
          className="bg-[#22C55E] hover:bg-[#006e2f] text-white px-6 py-2 rounded text-body-sm font-medium transition-colors shadow-sm"
        >
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-6">
          {/* GENERAL INFO */}
          <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-sm p-6">
            <h2 className="text-headline-sm font-geist text-on-surface mb-6">General Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-label-caps text-secondary mb-2">Group Name</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  className="w-full border border-[#E5E7EB] rounded px-4 py-2 text-on-surface outline-none focus:border-[#22C55E] max-w-md" 
                />
              </div>
              <div>
                <label className="block text-label-caps text-secondary mb-2">Currency</label>
                <select 
                  value={formData.currency} 
                  onChange={e => setFormData({...formData, currency: e.target.value})} 
                  className="w-full border border-[#E5E7EB] rounded px-4 py-2 text-on-surface outline-none focus:border-[#22C55E] max-w-md bg-white"
                >
                  <option value="KSh">KES - Kenyan Shilling</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="UGX">UGX - Ugandan Shilling</option>
                </select>
              </div>
            </div>
          </div>

          {/* FINANCIAL RULES */}
          <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-sm p-6">
            <h2 className="text-headline-sm font-geist text-on-surface mb-6">Financial Rules</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-label-caps text-secondary mb-2">Standard Contribution Amount ({formData.currency})</label>
                <input 
                  type="number" 
                  value={formData.contribution_amount} 
                  onChange={e => setFormData({...formData, contribution_amount: Number(e.target.value)})} 
                  className="w-full border border-[#E5E7EB] rounded px-4 py-2 text-on-surface outline-none focus:border-[#22C55E] max-w-md" 
                />
                <p className="text-body-sm text-secondary mt-1">Expected amount per member per cycle.</p>
              </div>
              <div>
                <label className="block text-label-caps text-secondary mb-2">Late Payment Penalty ({formData.currency})</label>
                <input 
                  type="number" 
                  value={formData.late_penalty} 
                  onChange={e => setFormData({...formData, late_penalty: Number(e.target.value)})} 
                  className="w-full border border-[#E5E7EB] rounded px-4 py-2 text-on-surface outline-none focus:border-[#22C55E] max-w-md" 
                />
                <p className="text-body-sm text-secondary mt-1">Applied automatically when a payment misses the deadline.</p>
              </div>
              <div>
                <label className="block text-label-caps text-secondary mb-2">Cycle Start Date</label>
                <input 
                  type="date" 
                  value={formData.cycle_start} 
                  onChange={e => setFormData({...formData, cycle_start: e.target.value})} 
                  className="w-full border border-[#E5E7EB] rounded px-4 py-2 text-on-surface outline-none focus:border-[#22C55E] max-w-md" 
                />
              </div>
            </div>
          </div>

        </div>

        <div className="space-y-6">
          {/* LOAN SETTINGS (Placeholder info) */}
          <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-sm p-6">
            <h2 className="text-headline-sm font-geist text-on-surface mb-2">Loan Policies</h2>
            <p className="text-body-sm text-secondary mb-4">Manage interest rates, guarantor requirements, and maximum borrowing limits.</p>
            <button className="w-full bg-surface-container-low border border-[#E5E7EB] text-primary py-2 rounded text-body-sm font-medium hover:bg-gray-50 transition-colors">
              Configure Loan Policies
            </button>
          </div>

          {/* DANGER ZONE */}
          <div className="bg-white border border-red-200 rounded-lg shadow-sm p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-error"></div>
            <h2 className="text-headline-sm font-geist text-error mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined">warning</span>
              Danger Zone
            </h2>
            <p className="text-body-sm text-secondary mb-4">Irreversible actions that affect the entire group data.</p>
            
            <div className="space-y-3">
              <button className="w-full bg-white border border-red-200 text-error py-2 rounded text-body-sm font-medium hover:bg-red-50 transition-colors text-left px-4 flex justify-between items-center">
                Archive Group
                <span className="material-symbols-outlined text-[16px]">inventory_2</span>
              </button>
              <button className="w-full bg-error text-white py-2 rounded text-body-sm font-medium hover:bg-red-700 transition-colors text-left px-4 flex justify-between items-center">
                Delete Group
                <span className="material-symbols-outlined text-[16px]">delete_forever</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
