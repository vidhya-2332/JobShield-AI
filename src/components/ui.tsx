import type { ReactNode } from 'react';

export function Badge({
  children,
  variant = 'neutral',
  size = 'md',
}: {
  children: ReactNode;
  variant?: 'neutral' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
}) {
  const variants = {
    neutral: 'bg-ink-800/60 text-ink-300 border-ink-700/50',
    success: 'bg-success-500/15 text-success-300 border-success-500/30',
    warning: 'bg-warning-500/15 text-warning-300 border-warning-500/30',
    error: 'bg-error-500/15 text-error-300 border-error-500/30',
    info: 'bg-primary-500/15 text-primary-300 border-primary-500/30',
  };
  const sizes = { sm: 'px-2 py-0.5 text-xs', md: 'px-3 py-1 text-sm' };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${variants[variant]} ${sizes[size]}`}>
      {children}
    </span>
  );
}

export function RiskBadge({ level }: { level: 'low' | 'medium' | 'high' | 'critical' }) {
  const config = {
    low: { variant: 'success' as const, label: 'Low Risk' },
    medium: { variant: 'warning' as const, label: 'Medium Risk' },
    high: { variant: 'error' as const, label: 'High Risk' },
    critical: { variant: 'error' as const, label: 'Critical Risk' },
  };
  const c = config[level];
  return (
    <Badge variant={c.variant}>
      <span className={`w-1.5 h-1.5 rounded-full ${level === 'low' ? 'bg-success-400' : level === 'medium' ? 'bg-warning-400' : 'bg-error-400 animate-pulse'}`} />
      {c.label}
    </Badge>
  );
}

export function SkeletonCard() {
  return (
    <div className="glass-card p-6 space-y-4">
      <div className="skeleton h-4 w-24" />
      <div className="skeleton h-10 w-32" />
      <div className="skeleton h-2 w-full" />
    </div>
  );
}

export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <svg className="animate-spin" width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
      {icon && <div className="mb-4 text-ink-500">{icon}</div>}
      <h3 className="text-lg font-semibold text-ink-200">{title}</h3>
      {description && <p className="mt-1 text-sm text-ink-400 max-w-sm">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
