import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, PieChart, Activity, Database } from 'lucide-react';
import { fetchDashboardStats, type DashboardStats } from '../lib/data';
import { DonutChart, BarChart, LineChart, HorizontalBarChart } from '../components/Charts';
import { SkeletonCard, EmptyState } from '../components/ui';
import { FEATURE_IMPORTANCE } from '../ml/model_metrics';

export function AnalyticsPage() {
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (!stats || stats.total === 0) {
    return (
      <EmptyState
        icon={<BarChart3 className="w-12 h-12" />}
        title="No analytics data yet"
        description="Analyze job postings to populate analytics charts and trends."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-5">
          <p className="text-xs text-ink-400">Total Analyzed</p>
          <p className="text-2xl font-bold text-ink-100 mt-1">{stats.total}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs text-ink-400">Fraud Rate</p>
          <p className="text-2xl font-bold text-error-300 mt-1">
            {((stats.fraudulent / stats.total) * 100).toFixed(1)}%
          </p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs text-ink-400">Avg Risk Score</p>
          <p className="text-2xl font-bold text-warning-300 mt-1">{stats.avgRisk}/100</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs text-ink-400">Genuine Rate</p>
          <p className="text-2xl font-bold text-success-300 mt-1">
            {((stats.genuine / stats.total) * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-4 h-4 text-primary-400" />
            <h3 className="text-sm font-semibold text-ink-200">Fraud vs Genuine Distribution</h3>
          </div>
          <div className="flex items-center justify-center">
            <DonutChart
              segments={[
                { label: 'Genuine', value: stats.genuine, color: '#10b981' },
                { label: 'Fraudulent', value: stats.fraudulent, color: '#f43f5e' },
              ]}
              centerValue={`${stats.total}`}
              centerLabel="Jobs"
              size={220}
            />
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-primary-400" />
            <h3 className="text-sm font-semibold text-ink-200">Monthly Prediction Volume</h3>
          </div>
          {stats.monthly.some((m) => m.count > 0) ? (
            <BarChart
              data={stats.monthly.map((m) => ({ label: m.month, value: m.count, sub: m.fraudulent }))}
              color="#3b82f6"
              formatValue={(v) => `${v}`}
            />
          ) : (
            <div className="h-[200px] flex items-center justify-center text-sm text-ink-500">No data</div>
          )}
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-error-400" />
            <h3 className="text-sm font-semibold text-ink-200">Fraud Rate Trend (%)</h3>
          </div>
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
            <div className="h-[200px] flex items-center justify-center text-sm text-ink-500">No data</div>
          )}
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-4 h-4 text-accent-400" />
            <h3 className="text-sm font-semibold text-ink-200">Risk Level Breakdown</h3>
          </div>
          <HorizontalBarChart
            data={[
              { label: 'Low Risk', value: stats.byRiskLevel.low, color: 'linear-gradient(to right, #10b981, #34d399)' },
              { label: 'Medium Risk', value: stats.byRiskLevel.medium, color: 'linear-gradient(to right, #eab308, #facc15)' },
              { label: 'High Risk', value: stats.byRiskLevel.high, color: 'linear-gradient(to right, #f59e0b, #fbbf24)' },
              { label: 'Critical Risk', value: stats.byRiskLevel.critical, color: 'linear-gradient(to right, #f43f5e, #fb7185)' },
            ]}
            formatValue={(v) => `${v}`}
          />
        </div>
      </div>

      {/* Feature importance */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-primary-400" />
          <h3 className="text-sm font-semibold text-ink-200">Model Feature Importance (Gradient Boosting)</h3>
        </div>
        <HorizontalBarChart
          data={FEATURE_IMPORTANCE.map((f) => ({
            label: f.feature.replace(/_/g, ' '),
            value: f.importance,
            color: 'linear-gradient(to right, #3b82f6, #06b6d4)',
          }))}
          formatValue={(v) => v.toFixed(3)}
        />
      </div>
    </div>
  );
}
