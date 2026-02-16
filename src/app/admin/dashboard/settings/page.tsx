"use client";

import { useState } from "react";
import { 
  Bell, Lock, Globe, Palette, Shield, Database,
  Save, CheckCircle
} from "lucide-react";

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      
      <div>
        <h1 className="text-3xl font-black text-white">Settings</h1>
        <p className="text-slate-400 mt-1">Manage your account preferences and security</p>
      </div>

      {saved && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <p className="text-emerald-400 font-bold">Settings saved successfully!</p>
        </div>
      )}

      {/* NOTIFICATIONS */}
      <div className="bg-slate-900 border border-slate-800 rounded-[24px] p-6">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="w-6 h-6 text-amber-400" />
          <h2 className="text-xl font-bold text-white">Notifications</h2>
        </div>
        
        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 bg-slate-950 rounded-xl cursor-pointer hover:bg-slate-800 transition-colors">
            <div>
              <p className="font-bold text-white">Email Notifications</p>
              <p className="text-sm text-slate-400">Receive updates about transactions and activities</p>
            </div>
            <input
              type="checkbox"
              checked={notifications}
              onChange={(e) => setNotifications(e.target.checked)}
              className="w-5 h-5"
            />
          </label>
          
          <label className="flex items-center justify-between p-4 bg-slate-950 rounded-xl cursor-pointer hover:bg-slate-800 transition-colors">
            <div>
              <p className="font-bold text-white">SMS Alerts</p>
              <p className="text-sm text-slate-400">Get instant alerts for important events</p>
            </div>
            <input type="checkbox" className="w-5 h-5" />
          </label>
        </div>
      </div>

      {/* SECURITY */}
      <div className="bg-slate-900 border border-slate-800 rounded-[24px] p-6">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-6 h-6 text-amber-400" />
          <h2 className="text-xl font-bold text-white">Security</h2>
        </div>
        
        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 bg-slate-950 rounded-xl cursor-pointer hover:bg-slate-800 transition-colors">
            <div>
              <p className="font-bold text-white">Two-Factor Authentication</p>
              <p className="text-sm text-slate-400">Add an extra layer of security to your account</p>
            </div>
            <input
              type="checkbox"
              checked={twoFactor}
              onChange={(e) => setTwoFactor(e.target.checked)}
              className="w-5 h-5"
            />
          </label>
          
          <button className="w-full p-4 bg-slate-950 rounded-xl text-left hover:bg-slate-800 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-white">Change Password</p>
                <p className="text-sm text-slate-400">Update your account password</p>
              </div>
              <Lock className="w-5 h-5 text-slate-500" />
            </div>
          </button>
        </div>
      </div>

      {/* PREFERENCES */}
      <div className="bg-slate-900 border border-slate-800 rounded-[24px] p-6">
        <div className="flex items-center gap-3 mb-6">
          <Palette className="w-6 h-6 text-amber-400" />
          <h2 className="text-xl font-bold text-white">Preferences</h2>
        </div>
        
        <div className="space-y-4">
          <div className="p-4 bg-slate-950 rounded-xl">
            <label className="block mb-2">
              <p className="font-bold text-white mb-1">Language</p>
              <p className="text-sm text-slate-400 mb-3">Choose your preferred language</p>
            </label>
            <select className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-white outline-none focus:border-amber-500">
              <option>English</option>
              <option>Kiswahili</option>
              <option>Gĩkũyũ</option>
            </select>
          </div>
          
          <div className="p-4 bg-slate-950 rounded-xl">
            <label className="block mb-2">
              <p className="font-bold text-white mb-1">Currency</p>
              <p className="text-sm text-slate-400 mb-3">Display amounts in</p>
            </label>
            <select className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-white outline-none focus:border-amber-500">
              <option>KES - Kenyan Shilling</option>
              <option>USD - US Dollar</option>
              <option>EUR - Euro</option>
            </select>
          </div>
        </div>
      </div>

      {/* SAVE BUTTON */}
      <button
        onClick={handleSave}
        className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
      >
        <Save className="w-5 h-5" />
        Save Changes
      </button>

    </div>
  );
}
