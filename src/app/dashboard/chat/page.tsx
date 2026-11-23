'use client';

import { useEffect, useRef, useState } from 'react';
import { SendHorizontal, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { OFFICIAL_ROLES } from '@/components/shell/nav';
import { Avatar, Notice, cn } from '@/components/ui';

type Msg = { id: string; chama_id: string; member_id: string; content: string; created_at: string; name?: string };

function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const y = new Date(); y.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === y.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function GroupChatPage() {
  const { member, group } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const isOfficial = OFFICIAL_ROLES.includes(member?.role || '');

  useEffect(() => {
    if (!group?.id) return;
    let cancelled = false;
    (async () => {
      const [m, p] = await Promise.all([
        supabase.from('chama_messages').select('id, chama_id, member_id, content, created_at').eq('chama_id', group.id).order('created_at', { ascending: false }).limit(150),
        supabase.from('chama_memberships').select('id, profiles(full_name)').eq('chama_id', group.id),
      ]);
      if (cancelled) return;
      if (m.error) setError('Messages did not load. Check your connection and refresh.');
      const map: Record<string, string> = {};
      (p.data || []).forEach((r: { id: string; profiles: { full_name?: string } | { full_name?: string }[] | null }) => {
        const prof = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
        map[r.id] = prof?.full_name || 'Member';
      });
      setNames(map);
      setMessages(((m.data as Msg[]) || []).reverse());
      setLoading(false);
    })();

    const channel = supabase
      .channel(`group-chat-${group.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chama_messages', filter: `chama_id=eq.${group.id}` }, (payload) => {
        const row = payload.new as Msg;
        setMessages((prev) => (prev.some((x) => x.id === row.id) ? prev : [...prev, row]));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'chama_messages' }, (payload) => {
        const old = payload.old as { id: string };
        setMessages((prev) => prev.filter((x) => x.id !== old.id));
      })
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [group?.id]);

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [messages.length]);

  const send = async () => {
    const content = text.trim();
    if (!content || !member?.id || !group?.id || sending) return;
    setSending(true);
    setError('');
    const { data, error: err } = await supabase
      .from('chama_messages')
      .insert({ chama_id: group.id, member_id: member.id, content: content.slice(0, 2000) })
      .select('id, chama_id, member_id, content, created_at')
      .single();
    setSending(false);
    if (err) { setError('Your message was not sent. Try again.'); return; }
    setText('');
    if (data) setMessages((prev) => (prev.some((x) => x.id === data.id) ? prev : [...prev, data as Msg]));
  };

  const remove = async (id: string) => {
    const { error: err } = await supabase.from('chama_messages').delete().eq('id', id);
    if (!err) setMessages((prev) => prev.filter((x) => x.id !== id));
  };

  let lastDay = '';
  return (
    <div className="flex flex-col h-[calc(100dvh-196px)] lg:h-[calc(100dvh-64px)] -mb-4">
      <div className="flex items-end justify-between gap-4 pb-4 border-b border-line">
        <div>
          <h1 className="font-display text-[30px] sm:text-[36px] leading-tight">Group chat</h1>
          <p className="text-[14px] text-ink-3 mt-0.5">Everyone in {group?.name || 'the group'} can read this.</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-1" aria-live="polite">
        {loading && <p className="text-[14px] text-ink-3">Loading messages…</p>}
        {!loading && messages.length === 0 && (
          <div className="m-auto text-center max-w-[40ch]">
            <p className="font-display text-[24px]">Say jambo to the group</p>
            <p className="text-[14px] text-ink-3 mt-1">Questions about a payment, the next meeting or the merry-go-round all go here.</p>
          </div>
        )}
        {messages.map((m, i) => {
          const mine = m.member_id === member?.id;
          const name = names[m.member_id] || m.name || 'Member';
          const day = dayLabel(m.created_at);
          const showDay = day !== lastDay;
          lastDay = day;
          const prev = messages[i - 1];
          const grouped = !showDay && prev && prev.member_id === m.member_id;
          return (
            <div key={m.id}>
              {showDay && <div className="text-center text-[12px] text-ink-3 my-3">{day}</div>}
              <div className={cn('group flex gap-2.5 items-end', mine && 'flex-row-reverse', grouped ? 'mt-0.5' : 'mt-2')}>
                <span className={cn(grouped && 'invisible')}><Avatar name={mine ? member?.full_name : name} size={30} tone={mine ? 'lavender' : 'sage'} /></span>
                <div className={cn('max-w-[78%] sm:max-w-[60%]')}>
                  {!grouped && !mine && <div className="text-[12px] text-ink-3 mb-1 ml-1">{name}</div>}
                  <div className={cn('px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap break-words rounded-[18px]', mine ? 'bg-primary text-on-primary rounded-br-md' : 'bg-surface border border-line rounded-bl-md')}>
                    {m.content}
                  </div>
                  <div className={cn('flex items-center gap-2 mt-1 text-[11px] text-ink-3', mine ? 'justify-end mr-1' : 'ml-1')}>
                    {new Date(m.created_at).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                    {(mine || isOfficial) && (
                      <button type="button" onClick={() => remove(m.id)} aria-label="Delete message" className="opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-danger">
                        <Trash2 size={13} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {error && <Notice tone="danger" className="mb-2">{error}</Notice>}
      <form className="pt-3 border-t border-line flex items-end gap-2" onSubmit={(e) => { e.preventDefault(); send(); }}>
        <label className="flex-1">
          <span className="sr-only">Message</span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            rows={1}
            maxLength={2000}
            placeholder="Write to the group"
            className="w-full max-h-40 resize-none px-5 py-3.5 rounded-[24px] bg-surface border border-line text-[16px] placeholder:text-ink-3 focus:outline-none focus:border-line-strong"
          />
        </label>
        <button type="submit" disabled={!text.trim() || sending} aria-label="Send" className="w-[52px] h-[52px] rounded-full bg-primary text-on-primary flex items-center justify-center disabled:opacity-40 shrink-0">
          <SendHorizontal size={20} aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}
