"use client";
import { MIcon } from '@/components/ui/MIcon';

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
        .select('*, author:profiles(full_name)')
        .eq('chama_id', group.id)
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !group?.id) throw new Error('Please sign in again.');
      const { error } = await supabase.from('announcements').insert({
        chama_id: group.id,
        author_id: user.id,
        title: title.trim(),
        message: message.trim(),
        is_important: isImportant
      });
      if (error) throw error;

      // In-app notification for every active member
      const { data: members } = await supabase
        .from('chama_memberships')
        .select('profile_id')
        .eq('chama_id', group.id)
        .eq('status', 'active');
      const notifs = (members || [])
        .filter(m => m.profile_id)
        .map(m => ({
          profile_id: m.profile_id,
          chama_id: group.id,
          type: 'announcement',
          title: isImportant ? `Important: ${title.trim()}` : title.trim(),
          message: message.trim().slice(0, 300)
        }));
      if (notifs.length) await supabase.from('notifications').insert(notifs);

      setToastMsg("Announcement sent to all members!");
      setTimeout(() => setToastMsg(""), 3000);
      setShowModal(false);
      setTitle("");
      setMessage("");
      setIsImportant(false);
      fetchData();
    } catch (err: any) {
      alert("Error sending announcement: " + (err?.message || 'please try again'));
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this announcement?")) {
      try {
        const { error } = await supabase.from('announcements').delete().eq('id', id);
        if (error) throw error;
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
        <div className="fixed top-4 right-4 bg-[var(--ak-surface)] dark:bg-[var(--ak-tint)] text-white dark:text-[var(--ak-text)] px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-3 animate-fade-in-down">
          <MIcon name="check_circle"  className="text-[var(--ak-brand-ink)]" />
          <span className="text-body-sm font-medium">{toastMsg}</span>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8">
        <div>
          <p className="text-[12px] text-[var(--ak-text-3)] dark:text-[var(--ak-text-2)] font-medium mb-1 flex items-center gap-1">
            <span>Admin Dashboard</span>
            <MIcon name="chevron_right"  className="text-[14px]" />
            <span>Announcements</span>
          </p>
          <h1 className="text-[28px] font-bold text-[var(--text-main)] tracking-tight leading-tight">Announcements</h1>
          <p className="text-[14px] text-[var(--text-muted)] mt-1">Broadcast messages to all group members</p>
        </div>
        <div>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-[var(--ak-solid)] hover:bg-[var(--ak-solid)] text-white px-4 py-2 rounded-lg text-xs font-semibold transition-all shadow-sm flex items-center gap-2"
          >
            <MIcon name="campaign"  className="text-[18px]" />
            New Announcement
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {announcements.length === 0 ? (
          <div className="card-bg border border-[var(--border)] rounded-2xl p-12 text-center text-[var(--text-muted)] shadow-sm">
            <MIcon name="campaign"  className="text-[48px] mb-4 text-[var(--ak-text-3)] dark:text-[var(--ak-text-2)]" />
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
                  <MIcon name="delete"  className="text-[18px]" />
                </button>
              </div>
              
              <p className="text-sm text-[var(--text-main)] whitespace-pre-wrap leading-relaxed mb-6 font-medium">
                {ann.message}
              </p>
              
              <div className="flex items-center gap-2 pt-4 border-t border-[var(--border)] text-xs text-[var(--text-muted)]">
                <div className="w-6 h-6 rounded-full bg-transparent text-[var(--brand-green)] text-[var(--brand-green)] flex items-center justify-center font-bold text-[10px] shadow-sm">
                  {ann.author?.full_name ? ann.author.full_name.charAt(0) : 'A'}
                </div>
                <span>Posted by <span className="font-semibold text-[var(--text-main)]">{ann.author?.full_name || 'Admin'}</span></span>
                <span>•</span>
                <span>{new Date(ann.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* NEW ANNOUNCEMENT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-[var(--ak-page)]/50 dark:bg-[var(--ak-page)]/75 flex items-center justify-center z-50 p-4 transition-opacity backdrop-blur-sm">
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
                  className="w-full border border-[var(--border)] bg-transparent text-[var(--text-main)] rounded-lg px-4 py-2 outline-none focus:border-[var(--ak-brand-ink)]" 
                />
              </div>
              <div>
                <label className="block text-label-caps text-[var(--text-muted)] mb-2 font-semibold">Message</label>
                <textarea 
                  rows={5} 
                  value={message} 
                  onChange={e => setMessage(e.target.value)} 
                  placeholder="Write your message here..."
                  className="w-full border border-[var(--border)] bg-transparent text-[var(--text-main)] rounded-lg px-4 py-2 outline-none focus:border-[var(--ak-brand-ink)] resize-none"
                />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isImportant}
                  onChange={e => setIsImportant(e.target.checked)}
                  className="w-4 h-4 text-[var(--ak-brand-ink)] rounded border-gray-300 dark:border-gray-700 bg-transparent focus:ring-[var(--ak-brand-ink)]"
                />
                <div>
                  <div className="text-sm font-semibold text-[var(--text-main)]">Mark as Important</div>
                  <div className="text-xs text-[var(--text-muted)] mt-0.5">Pins to the top of member dashboards</div>
                </div>
              </label>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowModal(false)} className="flex-1 bg-transparent border border-[var(--border)] rounded-lg py-2 text-body-sm font-medium hover:bg-gray-50 dark:hover:bg-[var(--ak-raised)]">Cancel</button>
              <button onClick={handleSend} disabled={!title || !message} className="flex-1 bg-[var(--ak-solid)] disabled:opacity-50 text-white rounded-lg py-2 text-body-sm font-medium hover:bg-[var(--ak-solid)] flex items-center justify-center gap-2 transition-all">
                <MIcon name="send"  className="text-[18px]" />
                Send Now
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
