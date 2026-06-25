"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

export default function AdminAnnouncementsPage() {
  const { member: adminMember, group } = useAuth();
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  const [toastMsg, setToastMsg] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isImportant, setIsImportant] = useState(false);

  const fetchData = async () => {
    if (!adminMember || !group) return;
    try {
      setLoading(true);
      const { data } = await supabase
        .from('announcements')
        .select('*, members(full_name)')
        .eq('group_id', group.id)
        .order('created_at', { ascending: false });
      
      setAnnouncements(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [adminMember, group]);

  const handleSend = async () => {
    try {
      await supabase.from('announcements').insert({
        group_id: group?.id,
        author_id: adminMember?.id,
        title,
        message,
        is_important: isImportant,
        created_at: new Date().toISOString()
      });

      // Insert global notifications for all members
      const { data: members } = await supabase.from('members').select('id').eq('group_id', group?.id).eq('status', 'active');
      if (members) {
        const notifs = members.map(m => ({
          group_id: group?.id,
          member_id: m.id,
          type: 'announcement',
          message: `New announcement: ${title}`,
          read: false
        }));
        await supabase.from('notifications').insert(notifs);
      }

      setToastMsg("Announcement sent to all members!");
      setTimeout(() => setToastMsg(""), 3000);
      setShowModal(false);
      setTitle("");
      setMessage("");
      setIsImportant(false);
      fetchData();
    } catch (err) {
      alert("Error sending announcement");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this announcement?")) {
      try {
        await supabase.from('announcements').delete().eq('id', id);
        fetchData();
      } catch (err) {
        alert("Error deleting");
      }
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-[1280px] mx-auto w-full font-inter">
        <div className="card-bg border border-[var(--border)] rounded-2xl h-96 animate-pulse shadow-sm"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1280px] mx-auto w-full font-inter relative min-h-full text-[var(--text-main)]">
      {toastMsg && (
        <div className="fixed top-4 right-4 bg-[#161d16] dark:bg-[#E8F0E4] text-white dark:text-[#161d16] px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-3 animate-fade-in-down">
          <span className="material-symbols-outlined text-[#22C55E]">check_circle</span>
          <span className="text-body-sm font-medium">{toastMsg}</span>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8">
        <div>
          <p className="text-[12px] text-[#9CA3AF] dark:text-[#5a6e5a] font-medium mb-1 flex items-center gap-1">
            <span>Admin Dashboard</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span>Announcements</span>
          </p>
          <h1 className="text-[28px] font-bold text-[var(--text-main)] tracking-tight leading-tight">Announcements</h1>
          <p className="text-[14px] text-[var(--text-muted)] mt-1">Broadcast messages to all group members</p>
        </div>
        <div>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-[#22C55E] hover:bg-[#006e2f] text-white px-4 py-2 rounded-lg text-xs font-semibold transition-all shadow-sm flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">campaign</span>
            New Announcement
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {announcements.length === 0 ? (
          <div className="card-bg border border-[var(--border)] rounded-2xl p-12 text-center text-[var(--text-muted)] shadow-sm">
            <span className="material-symbols-outlined text-[48px] mb-4 text-[#9CA3AF] dark:text-[#5a6e5a]">campaign</span>
            <div className="text-lg font-bold font-geist text-[var(--text-main)]">No announcements yet</div>
            <div className="text-xs mt-1 text-[var(--text-muted)]">Send your first broadcast to the group.</div>
          </div>
        ) : (
          announcements.map(ann => (
            <div key={ann.id} className="card-bg border border-[var(--border)] rounded-2xl p-6 shadow-sm relative group transition-all hover:shadow-md">
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-3 items-center">
                  {ann.is_important && (
                    <span className="bg-red-50 dark:bg-red-950/20 text-[#ba1a1a] dark:text-[#ffb4ab] border border-red-100 dark:border-red-900/30 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                      Important
                    </span>
                  )}
                  <h3 className="text-lg font-bold font-geist text-[var(--text-main)]">{ann.title}</h3>
                </div>
                <button 
                  onClick={() => handleDelete(ann.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
              
              <p className="text-sm text-[var(--text-main)] whitespace-pre-wrap leading-relaxed mb-6 font-medium">
                {ann.message}
              </p>
              
              <div className="flex items-center gap-2 pt-4 border-t border-[var(--border)] text-xs text-[var(--text-muted)]">
                <div className="w-6 h-6 rounded-full bg-transparent text-[var(--brand-green)] text-[var(--brand-green)] flex items-center justify-center font-bold text-[10px] shadow-sm">
                  {ann.members?.full_name ? ann.members.full_name.charAt(0) : 'A'}
                </div>
                <span>Posted by <span className="font-semibold text-[var(--text-main)]">{ann.members?.full_name || 'Admin'}</span></span>
                <span>•</span>
                <span>{new Date(ann.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* NEW ANNOUNCEMENT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-[#0B0F0C]/50 dark:bg-[#0B0F0C]/75 flex items-center justify-center z-50 p-4 transition-opacity backdrop-blur-sm">
          <div className="card-bg border border-[var(--border)] rounded-2xl p-6 w-full max-w-lg shadow-2xl text-[var(--text-main)]">
            <h2 className="text-headline-sm font-geist font-bold text-[var(--text-main)] mb-6">Create Announcement</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-label-caps text-[var(--text-muted)] mb-2 font-semibold">Title</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  placeholder="e.g. Upcoming December Meeting"
                  className="w-full border border-[var(--border)] bg-transparent text-[var(--text-main)] rounded-lg px-4 py-2 outline-none focus:border-[#22C55E]" 
                />
              </div>
              <div>
                <label className="block text-label-caps text-[var(--text-muted)] mb-2 font-semibold">Message</label>
                <textarea 
                  rows={5} 
                  value={message} 
                  onChange={e => setMessage(e.target.value)} 
                  placeholder="Write your message here..."
                  className="w-full border border-[var(--border)] bg-transparent text-[var(--text-main)] rounded-lg px-4 py-2 outline-none focus:border-[#22C55E] resize-none"
                />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isImportant}
                  onChange={e => setIsImportant(e.target.checked)}
                  className="w-4 h-4 text-[#22C55E] rounded border-gray-300 dark:border-gray-700 bg-transparent focus:ring-[#22C55E]"
                />
                <div>
                  <div className="text-sm font-semibold text-[var(--text-main)]">Mark as Important</div>
                  <div className="text-xs text-[var(--text-muted)] mt-0.5">Pins to the top of member dashboards</div>
                </div>
              </label>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowModal(false)} className="flex-1 bg-transparent border border-[var(--border)] rounded-lg py-2 text-body-sm font-medium hover:bg-gray-50 dark:hover:bg-[#1f2a1f]">Cancel</button>
              <button onClick={handleSend} disabled={!title || !message} className="flex-1 bg-[#22C55E] disabled:opacity-50 text-white rounded-lg py-2 text-body-sm font-medium hover:bg-[#006e2f] flex items-center justify-center gap-2 transition-all">
                <span className="material-symbols-outlined text-[18px]">send</span>
                Send Now
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
