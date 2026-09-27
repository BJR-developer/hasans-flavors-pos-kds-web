'use client';

import React from 'react';
import { ArrowLeft, LucideIcon } from 'lucide-react';

// Shared building blocks so every page looks and reads the same.

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 bg-canvas min-h-[calc(100vh-56px)]">
      <div className="max-w-[1480px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">{children}</div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  onBack,
  actions,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
      <div className="flex items-start gap-2">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mt-1 p-1.5 rounded-lg border border-line bg-white hover:bg-neutral-50 text-ink-soft"
            title="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <div>
          <h1 className="text-2xl font-black text-ink tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-muted mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

export function Card({
  children,
  className = '',
  padded = true,
}: {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div className={`bg-white rounded-2xl border border-line shadow-2xs ${padded ? 'p-5' : ''} ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ title, hint, right }: { title: string; hint?: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div>
        <h2 className="text-base font-extrabold text-ink">{title}</h2>
        {hint && <p className="text-sm text-muted mt-0.5">{hint}</p>}
      </div>
      {right}
    </div>
  );
}

type Tone = 'default' | 'green' | 'red' | 'amber' | 'blue' | 'dark';

const TILE_TONES: Record<Tone, string> = {
  default: 'bg-white border-line text-ink',
  green: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  red: 'bg-rose-50 border-rose-200 text-rose-900',
  amber: 'bg-amber-50 border-amber-200 text-amber-900',
  blue: 'bg-blue-50 border-blue-200 text-blue-900',
  dark: 'bg-ink border-ink text-white',
};

export function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'default',
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: LucideIcon;
  tone?: Tone;
}) {
  return (
    <div className={`p-4 sm:p-5 rounded-2xl border shadow-2xs ${TILE_TONES[tone]}`}>
      <div className="flex items-center justify-between gap-2">
        <span className={`text-sm font-semibold ${tone === 'dark' ? 'text-neutral-300' : 'opacity-70'}`}>{label}</span>
        {Icon && <Icon className="w-4 h-4 opacity-60" />}
      </div>
      <p className="text-2xl sm:text-3xl font-black mt-1 tracking-tight">{value}</p>
      {hint && <p className={`text-xs mt-1 ${tone === 'dark' ? 'text-neutral-400' : 'opacity-70'}`}>{hint}</p>}
    </div>
  );
}

const BADGE_TONES: Record<Tone, string> = {
  default: 'bg-neutral-100 text-neutral-700',
  green: 'bg-emerald-100 text-emerald-800',
  red: 'bg-rose-100 text-rose-800',
  amber: 'bg-amber-100 text-amber-900',
  blue: 'bg-blue-100 text-blue-800',
  dark: 'bg-ink text-white',
};

export function Badge({ children, tone = 'default' }: { children: React.ReactNode; tone?: Tone }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${BADGE_TONES[tone]}`}>
      {children}
    </span>
  );
}

export function EmptyState({ title, hint, icon: Icon }: { title: string; hint?: string; icon?: LucideIcon }) {
  return (
    <div className="py-12 text-center">
      {Icon && <Icon className="w-8 h-8 mx-auto text-neutral-300 mb-2" />}
      <p className="text-sm font-semibold text-ink-soft">{title}</p>
      {hint && <p className="text-sm text-muted mt-1">{hint}</p>}
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center p-12 bg-canvas min-h-[calc(100vh-56px)]">
      <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'dark' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md';
}) {
  const variants = {
    primary: 'bg-brand hover:bg-brand-dark text-white',
    dark: 'bg-ink hover:bg-black text-white',
    secondary: 'bg-white border border-line hover:border-neutral-400 text-ink',
    ghost: 'text-ink-soft hover:bg-neutral-100',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  };
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2.5 text-sm' };
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}

// Date range presets shared by reports
export type DatePreset = 'today' | 'yesterday' | 'last_7_days' | 'this_month' | 'custom';

export function presetRange(preset: DatePreset, customFrom?: string, customTo?: string): { from: number; to: number; label: string } {
  const now = new Date();
  const dayStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dayEnd = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime();
  const fmt = (ts: number) => new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
  switch (preset) {
    case 'yesterday': {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      return { from: dayStart(y), to: dayEnd(y), label: `Yesterday (${fmt(dayStart(y))})` };
    }
    case 'last_7_days': {
      const s = new Date(now);
      s.setDate(s.getDate() - 6);
      return { from: dayStart(s), to: dayEnd(now), label: `Last 7 days (${fmt(dayStart(s))} – ${fmt(dayEnd(now))})` };
    }
    case 'this_month': {
      const s = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: s.getTime(), to: dayEnd(now), label: now.toLocaleDateString([], { month: 'long', year: 'numeric' }) };
    }
    case 'custom': {
      const f = customFrom ? new Date(`${customFrom}T00:00:00`) : now;
      const t = customTo ? new Date(`${customTo}T00:00:00`) : now;
      return { from: dayStart(f), to: dayEnd(t), label: `${fmt(dayStart(f))} – ${fmt(dayEnd(t))}` };
    }
    default:
      return { from: dayStart(now), to: dayEnd(now), label: `Today (${fmt(dayStart(now))})` };
  }
}

export function toDateInput(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function DatePresetBar({
  preset,
  onPreset,
  customFrom,
  customTo,
  onCustomFrom,
  onCustomTo,
  children,
}: {
  preset: DatePreset;
  onPreset: (p: DatePreset) => void;
  customFrom: string;
  customTo: string;
  onCustomFrom: (v: string) => void;
  onCustomTo: (v: string) => void;
  children?: React.ReactNode;
}) {
  const presets: { id: DatePreset; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: 'last_7_days', label: 'Last 7 days' },
    { id: 'this_month', label: 'This month' },
    { id: 'custom', label: 'Custom' },
  ];
  return (
    <Card className="!p-3 sm:!p-4">
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {presets.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onPreset(p.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                preset === p.id ? 'bg-ink text-white' : 'bg-neutral-50 text-ink-soft hover:bg-neutral-100 border border-line'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {preset === 'custom' && (
          <div className="flex items-center gap-2 text-sm">
            <input type="date" value={customFrom} onChange={(e) => onCustomFrom(e.target.value)} className="px-2 py-1.5 rounded-lg border border-line bg-white" />
            <span className="text-muted">to</span>
            <input type="date" value={customTo} onChange={(e) => onCustomTo(e.target.value)} className="px-2 py-1.5 rounded-lg border border-line bg-white" />
          </div>
        )}
        {children && <div className="lg:ml-auto flex items-center gap-2 flex-wrap">{children}</div>}
      </div>
    </Card>
  );
}
