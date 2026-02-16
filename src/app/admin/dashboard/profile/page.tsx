"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { User, Mail, Phone, MapPin, Calendar, Edit2, Save, Crown, Loader2 } from "lucide-react";

export default function ProfilePage() {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    joined: ""
  });
  const [stats, setStats] = useState({
    chamasCreated: 0,
    totalMembers: 0,
    totalManaged: 0
  });

  useEffect(() => {
    fetchAdminProfile();
  }, []);

  const fetchAdminProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No user logged in');
        setLoading(false);
        return;
      }

      // Fetch admin profile
      const { data: adminData, error: adminError } = await supabase
        .from('chama_admins')
        .select('*')
        .eq('admin_user_id', user.id)
        .single();

      if (adminError) {
        console.error('Error fetching admin profile:', adminError);
      } else if (adminData) {
        setProfile({
          name: adminData.full_name || "Admin User",
          email: adminData.email || user.email || "admin@smartchama.com",
          phone: adminData.phone_number || "254712345678",
          location: "Nairobi, Kenya",
          joined: adminData.created_at 
            ? new Date(adminData.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            : "January 2026"
        });
      }

      // Fetch stats
      const { data: chamasData, error: chamasError } = await supabase
        .from('chamas')
        .select('id, total_balance', { count: 'exact' })
        .eq('created_by', user.id);

      if (!chamasError && chamasData) {
        const totalBalance = chamasData.reduce((sum, chama) => sum + (parseFloat(chama.total_balance) || 0), 0);
        setStats({
          chamasCreated: chamasData.length,
          totalMembers: 0, // Will need to count members across all chamas
          totalManaged: totalBalance
        });
      }

    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { error } = await supabase
        .from('chama_admins')
        .update({
          full_name: profile.name,
          phone_number: profile.phone
        })
        .eq('admin_user_id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        alert('Failed to update profile');
      } else {
        setEditing(false);
        alert('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to update profile');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      
      <div>
        <h1 className="text-3xl font-black text-white">Profile</h1>
        <p className="text-slate-400 mt-1">Manage your personal information</p>
      </div>

      {/* PROFILE CARD */}
      <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-8">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* AVATAR */}
          <div className="flex flex-col items-center gap-4">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-4xl font-bold text-black relative">
              {profile.name.charAt(0)}
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center border-4 border-slate-900">
                <Crown className="w-5 h-5 text-black" />
              </div>
            </div>
            <button className="text-sm text-amber-400 hover:text-amber-300 font-bold">
              Change Photo
            </button>
          </div>

          {/* INFO */}
          <div className="flex-1 space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Full Name</label>
              <div className="flex items-center gap-3 p-4 bg-slate-950 rounded-xl border border-slate-800">
                <User className="w-5 h-5 text-slate-500" />
                {editing ? (
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({...profile, name: e.target.value})}
                    className="flex-1 bg-transparent text-white outline-none"
                  />
                ) : (
                  <span className="text-white">{profile.name}</span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Email</label>
              <div className="flex items-center gap-3 p-4 bg-slate-950 rounded-xl border border-slate-800">
                <Mail className="w-5 h-5 text-slate-500" />
                <span className="text-white">{profile.email}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Phone</label>
              <div className="flex items-center gap-3 p-4 bg-slate-950 rounded-xl border border-slate-800">
                <Phone className="w-5 h-5 text-slate-500" />
                {editing ? (
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({...profile, phone: e.target.value})}
                    className="flex-1 bg-transparent text-white outline-none"
                  />
                ) : (
                  <span className="text-white">{profile.phone}</span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Location</label>
              <div className="flex items-center gap-3 p-4 bg-slate-950 rounded-xl border border-slate-800">
                <MapPin className="w-5 h-5 text-slate-500" />
                {editing ? (
                  <input
                    type="text"
                    value={profile.location}
                    onChange={(e) => setProfile({...profile, location: e.target.value})}
                    className="flex-1 bg-transparent text-white outline-none"
                  />
                ) : (
                  <span className="text-white">{profile.location}</span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Member Since</label>
              <div className="flex items-center gap-3 p-4 bg-slate-950 rounded-xl border border-slate-800">
                <Calendar className="w-5 h-5 text-slate-500" />
                <span className="text-white">{profile.joined}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="mt-8 pt-8 border-t border-slate-800 flex gap-4">
          {editing ? (
            <>
              <button
                onClick={handleSave}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                Save Changes
              </button>
              <button
                onClick={() => setEditing(false)}
                className="px-6 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Edit2 className="w-5 h-5" />
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <p className="text-slate-400 text-sm mb-2">Chamas Created</p>
          <p className="text-3xl font-black text-white">{stats.chamasCreated}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <p className="text-slate-400 text-sm mb-2">Total Members</p>
          <p className="text-3xl font-black text-white">{stats.totalMembers}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <p className="text-slate-400 text-sm mb-2">Total Managed</p>
          <p className="text-3xl font-black text-white">KES {stats.totalManaged.toLocaleString()}</p>
        </div>
      </div>

    </div>
  );
}
