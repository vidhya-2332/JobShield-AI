import { useEffect, useState } from 'react';
import { History, ShieldAlert, ShieldCheck, Trash2, Search, Eye } from 'lucide-react';
import { fetchHistory, deletePrediction, type HistoryRecord } from '../lib/data';
import { SkeletonCard, EmptyState } from '../components/ui';
import type { Route } from '../lib/router';

export function HistoryPage({ navigate }: { navigate: (r: Route) => void }) {
  const [records, setRecords] = useState<HistoryRecord[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  async function load() {
    setLoading(true);
    const { data } = await fetchHistory(200);
    setRecords(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: string) {
    await deletePrediction(id);
    load();
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (!records || records.length === 0) {
    return (
      <EmptyState
        icon={<History className="w-12 h-12" />}
        title="No prediction history"
        description="Your analyzed job postings will appear here for future reference."
        action={<button onClick={() => navigate('analyze')} className="btn-primary">Analyze a Job</button>}
      />
    );
  }

  const filtered = records.filter((r) =>
    r.job_title.toLowerCase().includes(search.toLowerCase()) ||
    r.company_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-ink-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by job title or company..."
            className="glass-input pl-10"
          />
        </div>
        <span className="text-sm text-ink-400">{filtered.length} records</span>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-ink-400 text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-medium">Job Title</th>
                <th className="text-left px-4 py-3 font-medium">Company</th>
                <th className="text-left px-4 py-3 font-medium">Prediction</th>
                <th className="text-left px-4 py-3 font-medium">Risk Score</th>
                <th className="text-left px-4 py-3 font-medium">Fraud %</th>
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                  <td className="px-4 py-3 text-ink-200 font-medium max-w-[220px] truncate">{r.job_title || '—'}</td>
                  <td className="px-4 py-3 text-ink-400 max-w-[160px] truncate">{r.company_name || '—'}</td>
                  <td className="px-4 py-3">
                    {r.prediction_label === 'fraudulent' ? (
                      <span className="flex items-center gap-1.5 text-error-300">
                        <ShieldAlert className="w-4 h-4" /> Fraudulent
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-success-300">
                        <ShieldCheck className="w-4 h-4" /> Genuine
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-ink-200">{r.risk_score}</span>
                    <span className="text-ink-500">/100</span>
                  </td>
                  <td className="px-4 py-3 text-ink-300">{(r.fraud_probability * 100).toFixed(1)}%</td>
                  <td className="px-4 py-3 text-ink-400 text-xs">
                    {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => navigate('reports')}
                        className="p-1.5 rounded-lg text-ink-400 hover:text-primary-300 hover:bg-primary-500/10 transition-all"
                        title="View report"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(r.prediction_id)}
                        className="p-1.5 rounded-lg text-ink-400 hover:text-error-300 hover:bg-error-500/10 transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
