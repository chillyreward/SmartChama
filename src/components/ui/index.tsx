import Link from 'next/link';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { ComponentProps, ReactNode } from 'react';

export function cn(...parts: Parameters<typeof clsx>) {
  return twMerge(clsx(...parts));
}

/* ------------------------------------------------------------------ */
/* Logo                                                                */
/* ------------------------------------------------------------------ */
export function RingMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 30 30" aria-hidden="true" className={className}>
      <circle cx="15" cy="15" r="12" fill="none" stroke="#7CE3A6" strokeWidth="3" strokeDasharray="3 2.2" />
      <circle cx="15" cy="15" r="5" fill="#7CE3A6" />
    </svg>
  );
}

export function Logo({ href = '/', size = 'md', className }: { href?: string | null; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const s = { sm: [22, 'text-[21px]'], md: [28, 'text-[26px]'], lg: [40, 'text-[40px]'] }[size] as [number, string];
  const inner = (
    <>
      <RingMark size={s[0]} />
      <span className={cn('font-display leading-none tracking-[-0.02em]', s[1])}>akibora</span>
    </>
  );
  if (href === null) return <span className={cn('inline-flex items-center gap-2.5', className)}>{inner}</span>;
  return (
    <Link href={href} className={cn('inline-flex items-center gap-2.5 rounded-md', className)} aria-label="Akibora home">
      {inner}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */
type Variant = 'primary' | 'mint' | 'outline' | 'ghost' | 'forest' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', extra?: string) {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-colors',
    'disabled:opacity-50 disabled:pointer-events-none select-none',
    size === 'sm' && 'h-9 px-4 text-[13px]',
    size === 'md' && 'h-11 px-5 text-[15px]',
    size === 'lg' && 'h-[54px] px-7 text-base',
    variant === 'primary' && 'bg-primary text-on-primary hover:opacity-90',
    variant === 'mint' && 'bg-mint text-forest hover:bg-[#9BEBBD]',
    variant === 'forest' && 'bg-forest text-[#EEF4EF] hover:bg-canopy',
    variant === 'outline' && 'border border-line-strong text-ink hover:bg-raised font-medium',
    variant === 'ghost' && 'text-ink-2 hover:bg-raised hover:text-ink font-medium',
    variant === 'danger' && 'bg-danger-soft text-danger-ink hover:opacity-90',
    extra,
  );
}

export function Button({ variant, size, className, ...rest }: ComponentProps<'button'> & { variant?: Variant; size?: Size }) {
  return <button type="button" className={buttonClass(variant, size, className)} {...rest} />;
}

export function ButtonLink({ variant, size, className, ...rest }: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...rest} />;
}

/* ------------------------------------------------------------------ */
/* Surfaces                                                            */
/* ------------------------------------------------------------------ */
type Tone = 'surface' | 'sage' | 'forest' | 'lavender' | 'plain';

export function Panel({
  tone = 'surface', className, children, as: As = 'section', ...rest
}: { tone?: Tone; className?: string; children: ReactNode; as?: 'section' | 'div' | 'article' } & Omit<ComponentProps<'section'>, 'children' | 'ref'>) {
  return (
    <As
      className={cn(
        'rounded-[24px] p-5 sm:p-6 min-w-0',
        tone === 'surface' && 'bg-surface border border-line text-ink',
        tone === 'sage' && 'bg-sage text-sage-ink',
        tone === 'forest' && 'bg-forest text-[#EEF4EF]',
        tone === 'lavender' && 'bg-lavender text-lavender-ink',
        className,
      )}
      {...rest}
    >
      {children}
    </As>
  );
}

export function PanelTitle({ children, action, className, id }: { children: ReactNode; action?: ReactNode; className?: string; id?: string }) {
  return (
    <div className={cn('flex items-center justify-between gap-3', className)}>
      <h2 id={id} className="font-display text-[22px] sm:text-[24px] leading-tight tracking-[-0.01em]">{children}</h2>
      {action}
    </div>
  );
}

export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('text-[14px] text-current opacity-75', className)}>{children}</div>;
}

/* ------------------------------------------------------------------ */
/* Money                                                               */
/* ------------------------------------------------------------------ */
export function formatKsh(n: number | null | undefined, opts: { compact?: boolean } = {}) {
  const v = Number(n || 0);
  if (opts.compact && Math.abs(v) >= 100000) {
    return `KSh ${(v / 1000).toLocaleString('en-KE', { maximumFractionDigits: 0 })}k`;
  }
  return `KSh ${v.toLocaleString('en-KE', { maximumFractionDigits: 0 })}`;
}

export function Money({ value, className, compact }: { value: number | null | undefined; className?: string; compact?: boolean }) {
  return <span className={cn('font-money', className)}>{formatKsh(value, { compact })}</span>;
}

/* ------------------------------------------------------------------ */
/* Status chips: colour is never the only signal                       */
/* ------------------------------------------------------------------ */
export type ChipKind = 'paid' | 'late' | 'pending' | 'failed' | 'info' | 'welfare' | 'neutral';

export function Chip({ kind = 'neutral', children, className }: { kind?: ChipKind; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 h-[26px] px-2.5 rounded-full text-[12px] font-semibold whitespace-nowrap',
        kind === 'paid' && 'bg-tint text-brand',
        kind === 'late' && 'bg-amber-soft text-amber-ink',
        kind === 'pending' && 'border border-dashed border-line-strong text-ink-2',
        kind === 'failed' && 'bg-danger-soft text-danger-ink',
        kind === 'welfare' && 'bg-lavender text-lavender-ink',
        kind === 'info' && 'bg-sage text-sage-ink',
        kind === 'neutral' && 'bg-surface-2 text-ink-2',
        className,
      )}
    >
      {kind === 'paid' && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" aria-hidden="true"><path d="M5 12l5 5L20 7" /></svg>}
      {(kind === 'late' || kind === 'failed') && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v6" /></svg>}
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Segmented meter (trust score, progress)                             */
/* ------------------------------------------------------------------ */
export function Meter({ value, max = 100, segments = 30, height = 28, className, label, offClass = 'bg-raised' }: { value: number; max?: number; segments?: number; height?: number; className?: string; label?: string; offClass?: string }) {
  const filled = Math.round((Math.max(0, Math.min(value, max)) / max) * segments);
  return (
    <div role="meter" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} aria-label={label} className={cn('flex gap-[3px]', className)} style={{ height }}>
      {Array.from({ length: segments }, (_, i) => {
        const on = i < filled;
        const t = i / segments;
        return (
          <span
            key={i}
            className={cn('flex-1 rounded-[2px]', !on && offClass)}
            style={on ? { background: t < 0.3 ? '#3D7A5A' : t < 0.6 ? '#5BB287' : '#7CE3A6' } : undefined}
          />
        );
      })}
    </div>
  );
}

export function Ticks({ total, done, className }: { total: number; done: number; className?: string }) {
  return (
    <div className={cn('flex gap-[3px]', className)} aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={cn('flex-1 h-[6px] rounded-[2px]', i < done ? 'bg-mint' : 'bg-line-strong/60')} />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The woven ring with member seats                                     */
/* ------------------------------------------------------------------ */
export type Seat = { initials: string; state: 'received' | 'current' | 'upcoming' | 'me' };

export function WovenRing({
  size = 320, seats = [], children, label, seatSize, className,
}: { size?: number; seats?: Seat[]; children?: ReactNode; label?: string; seatSize?: number; className?: string }) {
  const seat = seatSize ?? Math.max(26, Math.round(size * 0.12));
  const r = size / 2 - seat / 2 - 2;
  const currentIdx = Math.max(0, seats.findIndex((s) => s.state === 'current'));
  return (
    <div role={label ? 'img' : undefined} aria-label={label} className={cn('relative shrink-0', className)} style={{ width: size, height: size }}>
      <div className="ak-weave ak-weave-adapt absolute inset-0" style={{ ['--ring-inner' as string]: `${Math.round((1 - (seat + 8) / (size / 2)) * 100)}%` }} />
      {seats.map((s, i) => {
        const a = ((-90 + (i - currentIdx) * (360 / seats.length)) * Math.PI) / 180;
        const x = size / 2 + r * Math.cos(a) - seat / 2;
        const y = size / 2 + r * Math.sin(a) - seat / 2;
        return (
          <span
            key={i}
            aria-hidden="true"
            className={cn(
              'absolute rounded-full flex items-center justify-center font-semibold border-[1.5px]',
              s.state === 'current' && 'bg-mint text-forest border-mint ak-pulse',
              s.state === 'received' && 'bg-sage text-forest border-sage',
              s.state === 'me' && 'bg-lavender text-forest border-lavender',
              s.state === 'upcoming' && 'bg-[#12271D] text-[#C9DACF] border-[#3D6B54]',
            )}
            style={{ left: x, top: y, width: seat, height: seat, fontSize: Math.max(10, seat * 0.3) }}
          >
            {s.initials}
          </span>
        );
      })}
      <div
        className="absolute rounded-full bg-[#12271D] text-[#EEF4EF] flex flex-col items-center justify-center text-center p-4"
        style={{ inset: seat + 14 }}
      >
        {children}
      </div>
    </div>
  );
}

export function initialsOf(name?: string | null) {
  if (!name) return '?';
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] || '') + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase();
}

/* ------------------------------------------------------------------ */
/* Empty / error states                                                 */
/* ------------------------------------------------------------------ */
export function EmptyState({ title, children, action, className }: { title: string; children?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-start gap-2 py-6', className)}>
      <div className="font-display text-[20px]">{title}</div>
      {children && <p className="text-[14px] text-ink-2 max-w-[48ch]">{children}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
