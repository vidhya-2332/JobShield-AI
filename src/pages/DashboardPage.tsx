import { useEffect, useState } from 'react';
import {
  Briefcase, AlertTriangle, ShieldCheck, Gauge, Cpu,
  TrendingUp, ArrowUpRight, ArrowDownRight, ScanSearch,
} from 'lucide-react';
import { fetchDashboardStats, type DashboardStats } from '../lib/data';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { DonutChart, BarChart, LineChart } from '../components/Charts';
import { SkeletonCard, EmptyState } from '../components/ui';
import { BEST_MODEL } from '../ml/model_metrics';
import type { Route } from '../lib/router';

function StatCard({
  icon: Icon,
  label,
  value,
  decimals = 0,
  suffix = '',
  trend,
  gradient,
  delay = 0,
}: {
  icon: typeof Briefcase;
  label: string;
  value: number;
  decimals?: number;
  suffix?: string;
  trend?: { up: boolean; pct: string };
  gradient: string;
  delay?: number;
}) {
  return (
    <div className="stat-card animate-fade-in-up" style={{ animationDelay: `${delay}s` }}>
      <div className="flex items-start justify-between">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${gradient}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend && (
          <span className={`flex items-center gap-1 text-xs font-medium ${trend.up ? 'text-success-400' : 'text-error-400'}`}>
            {trend.up ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {trend.pct}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold text-ink-100">
          <AnimatedNumber value={value} decimals={decimals} suffix={suffix} />
        </p>
        <p className="text-sm text-ink-400 mt-1">{label}</p>
      </div>
    </div>
  );
}

export function DashboardPage({ navigate }: { navigate: (r: Route) => void }) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats().then(({ data }) => {
      setStats(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (!stats || stats.total === 0) {
    return (
      <EmptyState
        icon={<ScanSearch className="w-12 h-12" />}
        title="No predictions yet"
        description="Analyze your first job posting to see dashboard analytics, risk distributions, and trends here."
        action={
          <button onClick={() => navigate('analyze')} className="btn-primary">
            <ScanSearch className="w-4 h-4" /> Analyze a Job
          </button>
        }
      />
    );
  }

  const fraudRate = stats.total > 0 ? (stats.fraudulent / stats.total) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard icon={Briefcase} label="Jobs Analyzed" value={stats.total} gradient="bg-gradient-to-br from-primary-500 to-primary-600" delay={0} />
        <StatCard icon={AlertTriangle} label="Fraudulent Jobs" value={stats.fraudulent} gradient="bg-gradient-to-br from-error-500 to-error-600" delay={0.05} />
        <StatCard icon={ShieldCheck} label="Genuine Jobs" value={stats.genuine} gradient="bg-gradient-to-br from-success-500 to-success-600" delay={0.1} />
        <StatCard icon={Gauge} label="Avg Risk Score" value={stats.avgRisk} suffix="/100" gradient="bg-gradient-to-br from-warning-500 to-warning-600" delay={0.15} />
        <StatCard icon={Cpu} label="Model Accuracy" value={BEST_MODEL.accuracy * 100} decimals={1} suffix="%" gradient="bg-gradient-to-br from-accent-500 to-accent-600" delay={0.2} />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Fraud distribution donut */}
        <div className="glass-card p-6 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
          <h3 className="text-sm font-semibold text-ink-200 mb-1">Fraud Distribution</h3>
          <p className="text-xs text-ink-500 mb-4">Genuine vs fraudulent postings</p>
          <div className="flex items-center justify-center py-2">
            <DonutChart
              segments={[
                { label: 'Genuine', value: stats.genuine, color: '#10b981' },
                { label: 'Fraudulent', value: stats.fraudulent, color: '#f43f5e' },
              ]}
              centerValue={`${stats.total}`}
              centerLabel="Total"
            />
          </div>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-success-500" />
              <span className="text-sm text-ink-300">Genuine ({stats.genuine})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-error-500" />
              <span className="text-sm text-ink-300">Fraudulent ({stats.fraudulent})</span>
            </div>
          </div>
        </div>

        {/* Monthly predictions */}
        <div className="glass-card p-6 lg:col-span-2 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-ink-200">Monthly Predictions</h3>
            <span className="flex items-center gap-1 text-xs text-success-400">
              <TrendingUp className="w-3.5 h-3.5" /> Last 6 months
            </span>
          </div>
          <p className="text-xs text-ink-500 mb-4">Prediction volume over time</p>
          {stats.monthly.some((m) => m.count > 0) ? (
            <BarChart
              data={stats.monthly.map((m) => ({ label: m.month, value: m.count, sub: m.fraudulent }))}
              color="#3b82f6"
              formatValue={(v) => `${v}`}
            />
          ) : (
            <div className="h-[200px] flex items-center justify-center text-sm text-ink-500">
              Not enough data for trend
            </div>
          )}
          <div className="flex gap-4 mt-4 text-xs">
            <span className="flex items-center gap-1.5 text-ink-400">
              <span className="w-3 h-3 rounded bg-primary-500" /> Total
            </span>
            <span className="flex items-center gap-1.5 text-ink-400">
              <span className="w-3 h-3 rounded bg-error-500" /> Fraudulent
            </span>
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Risk levels */}
        <div className="glass-card p-6 animate-fade-in-up" style={{ animationDelay: '0.35s' }}>
          <h3 className="text-sm font-semibold text-ink-200 mb-1">Risk Level Distribution</h3>
          <p className="text-xs text-ink-500 mb-4">Breakdown by risk tier</p>
          <div className="space-y-3">
            {([
              { label: 'Low Risk', value: stats.byRiskLevel.low, color: '#10b981' },
              { label: 'Medium Risk', value: stats.byRiskLevel.medium, color: '#eab308' },
              { label: 'High Risk', value: stats.byRiskLevel.high, color: '#f59e0b' },
              { label: 'Critical Risk', value: stats.byRiskLevel.critical, color: '#f43f5e' },
            ]).map((r) => {
              const max = Math.max(stats.byRiskLevel.low, stats.byRiskLevel.medium, stats.byRiskLevel.high, stats.byRiskLevel.critical, 1);
              return (
                <div key={r.label} className="flex items-center gap-3">
                  <span className="text-sm text-ink-300 w-24">{r.label}</span>
                  <div className="flex-1 h-7 bg-ink-800/50 rounded-lg overflow-hidden">
                    <div
                      className="h-full rounded-lg transition-all duration-700"
                      style={{ width: `${(r.value / max) * 100}%`, background: r.color }}
                    />
                  </div>
                  <span className="text-sm font-medium text-ink-200 w-8 text-right">{r.value}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Fraud rate trend */}
        <div className="glass-card p-6 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <h3 className="text-sm font-semibold text-ink-200 mb-1">Fraud Rate Trend</h3>
          <p className="text-xs text-ink-500 mb-4">Monthly fraud percentage</p>
          {stats.monthly.some((m) => m.count > 0) ? (
            <LineChart
              data={stats.monthly.map((m) => ({
                label: m.month,
                value: m.count > 0 ? (m.fraudulent / m.count) * 100 : 0,
              }))}
              color="#f43f5e"
              formatValue={(v) => `${v.toFixed(0)}%`}
            />
          ) : (
            <div className="h-[200px] flex items-center justify-center text-sm text-ink-500">
              Not enough data for trend
            </div>
          )}
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-ink-400">Overall fraud rate</span>
            <span className="font-semibold text-error-400">{fraudRate.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
