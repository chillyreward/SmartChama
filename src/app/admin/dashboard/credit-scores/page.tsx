"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import CreditScoreCard from '@/components/CreditScoreCard';
import { Shield, Users, TrendingUp, Award, Search, Filter } from 'lucide-react';

export default function CreditScoresPage() {
  const [loading, setLoading] = useState(true);
  const [chamas, setChamas] = useState<any[]>([]);
  const [selectedChama, setSelectedChama] = useState<string>('');
  const [members, setMembers] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [view, setView] = useState<'chama' | 'member'>('chama');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchChamas();
  }, []);

  useEffect(() => {
    if (selectedChama) {
      fetchMembers(selectedChama);
    }
  }, [selectedChama]);

  const fetchChamas = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get admin ID
      const { data: adminData } = await supabase
        .from('chama_admins')
        .select('id')
        .eq('email', user.email)
        .single();

      if (!adminData) return;

      // Fetch chamas
      const { data: chamasData, error } = await supabase
        .from('chamas')
        .select('*')
        .eq('admin_id', adminData.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching chamas:', error);
      } else {
        setChamas(chamasData || []);
        if (chamasData && chamasData.length > 0) {
          setSelectedChama(chamasData[0].id);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async (chamaId: string) => {
    try {
      const { data: membersData, error } = await supabase
        .from('members')
        .select('*')
        .eq('chama_id', chamaId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching members:', error);
      } else {
        setMembers(membersData || []);
        if (membersData && membersData.length > 0) {
          setSelectedMember(membersData[0].id);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const filteredMembers = members.filter(m => 
    m.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.phone_number.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white mb-2">Credit Scores</h1>
        <p className="text-slate-400">Monitor financial health and creditworthiness</p>
      </div>

      {/* View Toggle */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setView('chama')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
            view === 'chama'
              ? 'bg-amber-500 text-black'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Award className="w-5 h-5" />
          Chama Scores
        </button>
        <button
          onClick={() => setView('member')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
            view === 'member'
              ? 'bg-emerald-500 text-black'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Shield className="w-5 h-5" />
          Member Scores
        </button>
      </div>

      {/* Chama View */}
      {view === 'chama' && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Chama Selector */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                Select Chama
              </h3>
              
              <div className="space-y-2">
                {chamas.map((chama) => (
                  <button
                    key={chama.id}
                    onClick={() => setSelectedChama(chama.id)}
                    className={`w-full text-left p-4 rounded-xl transition-all ${
                      selectedChama === chama.id
                        ? 'bg-amber-500/20 border-2 border-amber-500'
                        : 'bg-slate-950/50 border border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-white mb-1">{chama.name}</div>
                    <div className="text-xs text-slate-400">
                      Created {new Date(chama.created_at).toLocaleDateString()}
                    </div>
                  </button>
                ))}
              </div>

              {chamas.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-sm">
                  No chamas found. Create one to get started.
                </div>
              )}
            </div>
          </div>

          {/* Credit Score Display */}
          <div className="lg:col-span-2">
            {selectedChama ? (
              <CreditScoreCard type="chama" id={selectedChama} />
            ) : (
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center">
                <Award className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                <p className="text-slate-400">Select a chama to view credit score</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Member View */}
      {view === 'member' && (
        <div className="space-y-6">
          {/* Chama Selector */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <label className="block text-white font-bold mb-3">Select Chama</label>
            <select
              value={selectedChama}
              onChange={(e) => setSelectedChama(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500"
            >
              {chamas.map((chama) => (
                <option key={chama.id} value={chama.id}>
                  {chama.name}
                </option>
              ))}
            </select>
          </div>

          {selectedChama && (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Member List */}
              <div className="lg:col-span-1">
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                  <div className="mb-4">
                    <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                      <Users className="w-5 h-5 text-emerald-400" />
                      Members ({filteredMembers.length})
                    </h3>
                    
                    {/* Search */}
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search members..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-white text-sm outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {filteredMembers.map((member) => (
                      <button
                        key={member.id}
                        onClick={() => setSelectedMember(member.id)}
                        className={`w-full text-left p-3 rounded-xl transition-all ${
                          selectedMember === member.id
                            ? 'bg-emerald-500/20 border-2 border-emerald-500'
                            : 'bg-slate-950/50 border border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold">
                            {member.full_name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-white text-sm truncate">
                              {member.full_name}
                            </div>
                            <div className="text-xs text-slate-400 truncate">
                              {member.phone_number}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {filteredMembers.length === 0 && (
                    <div className="text-center py-8 text-slate-500 text-sm">
                      {searchTerm ? 'No members found' : 'No members in this chama'}
                    </div>
                  )}
                </div>
              </div>

              {/* Credit Score Display */}
              <div className="lg:col-span-2">
                {selectedMember ? (
                  <CreditScoreCard type="member" id={selectedMember} />
                ) : (
                  <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center">
                    <Shield className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                    <p className="text-slate-400">Select a member to view credit score</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <h4 className="text-white font-bold">Member Scores</h4>
          </div>
          <p className="text-slate-400 text-sm">
            Individual credit scores range from 300-850, similar to FICO scores. Higher scores Access better loan terms.
          </p>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Award className="w-5 h-5 text-amber-400" />
            </div>
            <h4 className="text-white font-bold">Chama Ratings</h4>
          </div>
          <p className="text-slate-400 text-sm">
            Group ratings from AAA to D measure overall health. High ratings attract institutional partnerships.
          </p>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <h4 className="text-white font-bold">Improve Scores</h4>
          </div>
          <p className="text-slate-400 text-sm">
            Consistent payments, low defaults, and member retention boost scores. Monitor regularly for best results.
          </p>
        </div>
      </div>
    </div>
  );
}
