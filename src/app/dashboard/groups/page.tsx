// app/dashboard/groups/page.tsx
import { 
    Plus, 
    ArrowRightLeft,
    Search
  } from "lucide-react";
  
  const myGroups = [
    { id: 1, name: "Family Savings", id_code: "CHM-8829", role: "Admin", status: "Active", color: "from-emerald-600 to-emerald-800" },
    { id: 2, name: "Business Collective", id_code: "CHM-1043", role: "Member", status: "Active", color: "from-amber-600 to-amber-800" },
    { id: 3, name: "Education Fund", id_code: "CHM-5521", role: "Member", status: "Active", color: "from-blue-600 to-blue-800" },
    { id: 4, name: "Holiday Travel", id_code: "CHM-0092", role: "Admin", status: "Active", color: "from-orange-400 to-pink-600" },
  ];
  
  export default function GroupsPage() {
    return (
      <div className="space-y-6 lg:space-y-8">
        {/* Header */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search groups..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-200 placeholder:text-slate-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400">Dashboard</span>
            <span className="text-emerald-400 font-bold text-sm">My Groups</span>
            <span className="text-sm text-slate-400">Transactions</span>
            <span className="text-sm text-slate-400">Settings</span>
            <div className="size-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-600 ml-4" />
          </div>
        </header>
  
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight">My Groups</h1>
            <p className="text-slate-400 mt-2">Manage and switch between your active group savings accounts</p>
          </div>
          <button className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 px-6 rounded-full transition-colors">
            <Plus className="w-5 h-5" />
            <span>Create New Chama</span>
          </button>
        </div>
  
        {/* Groups Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {myGroups.map((group) => (
            <div key={group.id} className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden hover:border-emerald-500/30 transition-all group">
              <div className={`h-32 bg-gradient-to-br ${group.color} relative p-4`}>
                {group.role === "Admin" && (
                  <span className="absolute top-3 right-3 bg-white/20 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded">
                    ADMIN
                )}
              </div>
              <div className="p-4">
                <h3 className="text-white font-bold text-lg mb-1">{group.name}</h3>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-slate-500 text-sm">ID: {group.id_code}</span>
                  <span className="text-slate-400 text-sm font-medium">{group.role}</span>
                </div>
                <button className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-white font-medium py-2.5 rounded-xl transition-colors text-sm">
                  <ArrowRightLeft className="w-4 h-4" />
                  Switch to this Chama
                </button>
              </div>
            </div>
          ))}
        </div>
  
        {/* Floating Buttons */}
        <div className="fixed bottom-24 lg:bottom-8 right-4 lg:right-8">
          <button className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 px-6 rounded-full shadow-lg shadow-emerald-500/20 transition-colors">
            <Plus className="w-5 h-5" />
            Join a Chama
          </button>
        </div>
  
        {/* Pro Plan Card */}
        <div className="fixed bottom-24 lg:bottom-8 left-4 lg:left-80 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 max-w-xs">
          <p className="text-emerald-400 text-xs font-bold uppercase mb-1">Pro Plan</p>
          <p className="text-slate-400 text-xs mb-3">Manage up to 10 Chamas effortlessly.</p>
          <button className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold py-2 rounded-lg text-sm transition-colors">
            Upgrade Now
          </button>
        </div>
      </div>
    );
  }