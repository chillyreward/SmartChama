// app/dashboard/profile/page.tsx
import { 
    User, 
    Shield, 
    Users, 
    CreditCard, 
    Settings,
    Rocket,
    Moon,
    Bell,
    Eye,
    Camera
  } from "lucide-react";
  
  const sidebarItems = [
    { name: "Profile Overview", icon: User, active: true },
    { name: "Security", icon: Shield, active: false },
    { name: "Group Preferences", icon: Users, active: false },
    { name: "Contributions", icon: CreditCard, active: false },
    { name: "App Settings", icon: Settings, active: false },
  ];
  
  const preferences = [
    { name: "Dark Mode", description: "Switch between light and dark themes", icon: Moon, enabled: true },
    { name: "Push Notifications", description: "Alerts for contribution deadlines and group payouts", icon: Bell, enabled: true },
    { name: "Profile Visibility", description: "Allow other Chama members to find you", icon: Eye, enabled: false },
  ];
  
  export default function ProfilePage() {
    return (
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Sidebar */}
        <aside className="w-full lg:w-80 flex-shrink-0">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-8">
              <div className="size-14 rounded-full bg-gradient-to-br from-slate-700 to-slate-600 border-2 border-emerald-500 relative">
                <div className="absolute bottom-0 right-0 bg-emerald-500 p-1.5 rounded-full border-2 border-slate-900">
                  <Camera className="w-3 h-3 text-slate-950" />
                </div>
              </div>
              <div>
                <h2 className="text-white font-bold">Kwame Mensah</h2>
                <p className="text-emerald-400 text-xs font-bold uppercase tracking-wider">Gold Member</p>
              </div>
            </div>
  
            <nav className="space-y-1">
              {sidebarItems.map((item) => (
                <button
                  key={item.name}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${item.active ? 'bg-emerald-500 text-slate-950 font-semibold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-sm">{item.name}</span>
                </button>
              ))}
            </nav>
  
            <div className="mt-8 pt-6 border-t border-slate-800">
              <button className="w-full flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 font-bold py-3 rounded-full transition-all text-sm">
                <Rocket className="w-4 h-4" />
                Upgrade Plan
              </button>
            </div>
          </div>
        </aside>
  
        {/* Main Content */}
        <div className="flex-1 space-y-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-white">Account Settings</h1>
            <p className="text-slate-400 mt-1">Manage your personal information, security, and contribution targets.</p>
          </div>
  
          {/* Tabs */}
          <div className="border-b border-slate-800">
            <div className="flex gap-8">
              {["Personal Info", "Security", "Group Preferences"].map((tab, idx) => (
                <button 
                  key={tab}
                  className={`pb-4 text-sm font-bold border-b-2 transition-colors ${idx === 0 ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
  
          {/* Profile Card */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="size-20 rounded-full bg-gradient-to-br from-slate-700 to-slate-600 border-4 border-slate-800 relative">
                  <div className="absolute bottom-0 right-0 bg-emerald-500 p-2 rounded-full border-2 border-slate-900">
                    <Camera className="w-4 h-4 text-slate-950" />
                  </div>
                </div>
                <div>
                  <h3 className="text-white text-xl font-bold">Kwame Mensah</h3>
                  <p className="text-slate-400 text-sm">kwame.m@fintech.africa</p>
                  <p className="text-emerald-400/70 text-xs mt-1">Joined January 2024</p>
                </div>
              </div>
              <button className="px-6 py-2.5 bg-slate-800 text-white rounded-full font-bold text-sm hover:bg-slate-700 transition-colors">
                Update Profile
              </button>
            </div>
          </div>
  
          {/* Savings Goal */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <svg className="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
                </svg>
              </div>
              <h3 className="text-white text-lg font-bold">Savings Goal</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-slate-400 text-xs font-bold uppercase mb-1">Monthly Target</p>
                  <p className="text-3xl font-black text-emerald-400">KES 45,000</p>
                </div>
                <p className="text-slate-400 text-sm font-medium">75% achieved</p>
              </div>
              <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>
          </div>
  
          {/* Preferences */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800">
              <h3 className="text-white text-lg font-bold">Preferences</h3>
            </div>
            <div className="divide-y divide-slate-800">
              {preferences.map((pref) => (
                <div key={pref.name} className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                      <pref.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">{pref.name}</p>
                      <p className="text-slate-500 text-xs">{pref.description}</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked={pref.enabled} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
  
          {/* Danger Zone */}
          <div className="bg-rose-950/20 border border-rose-900/30 rounded-2xl p-6">
            <h3 className="text-rose-400 text-sm font-bold uppercase tracking-wider mb-4">Danger Zone</h3>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-white font-bold text-sm">Deactivate Account</p>
                <p className="text-slate-500 text-xs">This will temporarily disable your account and hide your profile</p>
              </div>
              <button className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-6 py-2 rounded-full text-sm transition-colors">
                Deactivate
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }