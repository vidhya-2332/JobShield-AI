import { useEffect, useState } from 'react';
import { FileText, Download, Eye, ShieldAlert, ShieldCheck, Loader2 } from 'lucide-react';
import { fetchPredictions, type PredictionRecord } from '../lib/data';
import { exportReport, exportCSV } from '../lib/export';
import { RiskBadge, SkeletonCard, EmptyState } from '../components/ui';
import type { JobInput } from '../ml/types';
import type { Route } from '../lib/router';

function recordToJobInput(record: PredictionRecord): JobInput {
  const job = record.job;
  return {
    title: job?.title || '',
    company_name: job?.company_name || '',
    company_profile: job?.company_profile || '',
    website: job?.website || '',
    location: job?.location || '',
    salary: job?.salary || 0,
    salary_currency: job?.salary_currency || 'USD',
    employment_type: job?.employment_type || '',
    experience: job?.experience || '',
    education: job?.education || '',
    description: job?.description || '',
    requirements: job?.requirements || '',
    benefits: job?.benefits || '',
    questions: job?.questions || '',
    company_logo_url: job?.company_logo_url || '',
  };
}

function recordToResult(record: PredictionRecord) {
  return {
    prediction: record.prediction as 'fraudulent' | 'genuine',
    fraudProbability: Number(record.fraud_probability),
    riskScore: record.risk_score,
    confidenceScore: Number(record.confidence_score),
    ruleScore: record.rule_score,
    modelUsed: record.model_used,
    explanation: record.explanation,
    triggeredRules: record.triggered_rules || [],
    featureContributions: record.feature_contributions || [],
    positiveFactors: record.positive_factors || [],
    negativeFactors: record.negative_factors || [],
    recommendations: record.recommendations || [],
    nlpFeatures: { wordCount: 0, sentenceCount: 0, avgSentenceLength: 0, lexicalDiversity: 0, namedEntityDensity: 0, grammarQualityScore: 0, readabilityScore: 0, urgencyScore: 0, tooGoodToBeTrueScore: 0, tfidfTopTerms: [], posDistribution: {} },
    structuredFeatures: { hasCompanyProfile: false, hasWebsite: false, hasLogo: false, hasBenefits: false, hasQuestions: false, hasRequirements: false, hasLocation: false, salaryAnomaly: 0, salaryPercentile: 0, profileLength: 0, descriptionLength: 0, requirementsLength: 0, websiteTrustScore: 0 },
    riskLevel: (record.risk_score >= 80 ? 'critical' : record.risk_score >= 60 ? 'high' : record.risk_score >= 35 ? 'medium' : 'low') as 'low' | 'medium' | 'high' | 'critical',
  };
}

export function ReportsPage({ navigate }: { navigate: (r: Route) => void }) {
  const [records, setRecords] = useState<PredictionRecord[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);

  useEffect(() => {
    fetchPredictions(50).then(({ data }) => {
      setRecords(data);
      setLoading(false);
    });
  }, []);

  function handleExportPdf(record: PredictionRecord) {
    setExporting(record.id);
    const job = recordToJobInput(record);
    const result = recordToResult(record);
    exportReport(result as any, job);
    setTimeout(() => setExporting(null), 1000);
  }

  function handleExportAllCsv() {
    if (!records) return;
    const rows = records.map((r) => ({ job: recordToJobInput(r), result: recordToResult(r) as any }));
    exportCSV(rows, 'jobshield_all_reports.csv');
  }

  if (loading) {
    return <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}</div>;
  }

  if (!records || records.length === 0) {
    return (
      <EmptyState
        icon={<FileText className="w-12 h-12" />}
        title="No reports available"
        description="Analyze job postings to generate downloadable PDF and CSV reports."
        action={<button onClick={() => navigate('analyze')} className="btn-primary">Analyze a Job</button>}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-400">{records.length} reports available</p>
        <button onClick={handleExportAllCsv} className="btn-secondary">
          <Download className="w-4 h-4" /> Export All (CSV)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {records.map((r) => (
          <div key={r.id} className="glass-card p-5 hover:border-white/10 transition-all">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3 min-w-0">
                {r.prediction === 'fraudulent' ? (
                  <div className="w-10 h-10 rounded-xl bg-error-500/15 flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-5 h-5 text-error-400" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-success-500/15 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-success-400" />
                  </div>
                )}
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-ink-100 truncate">{r.job?.title || 'Untitled'}</h4>
                  <p className="text-xs text-ink-400 truncate">{r.job?.company_name || 'Unknown company'}</p>
                </div>
              </div>
              <RiskBadge level={r.risk_score >= 80 ? 'critical' : r.risk_score >= 60 ? 'high' : r.risk_score >= 35 ? 'medium' : 'low'} />
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="text-center p-2 rounded-lg bg-ink-800/40">
                <p className="text-xs text-ink-500">Risk</p>
                <p className="text-sm font-bold text-ink-200">{r.risk_score}</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-ink-800/40">
                <p className="text-xs text-ink-500">Fraud %</p>
                <p className="text-sm font-bold text-error-300">{(Number(r.fraud_probability) * 100).toFixed(0)}%</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-ink-800/40">
                <p className="text-xs text-ink-500">Confidence</p>
                <p className="text-sm font-bold text-primary-300">{(Number(r.confidence_score) * 100).toFixed(0)}%</p>
              </div>
            </div>

            <p className="text-xs text-ink-400 line-clamp-2 mb-4">{r.explanation}</p>

            <div className="flex items-center gap-2">
              <button onClick={() => handleExportPdf(r)} disabled={exporting === r.id} className="btn-primary flex-1 text-sm">
                {exporting === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                {exporting === r.id ? 'Preparing...' : 'PDF Report'}
              </button>
              <button onClick={() => navigate('history')} className="btn-secondary text-sm">
                <Eye className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-ink-500 mt-3">
              {new Date(r.created_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
