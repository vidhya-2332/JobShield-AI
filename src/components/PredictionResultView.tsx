import {
  ShieldCheck, ShieldAlert, Gauge, TrendingUp, TrendingDown,
  Lightbulb, CheckCircle2, XCircle, AlertTriangle, FileText, Download,
} from 'lucide-react';
import type { PredictionResult, JobInput } from '../ml/types';
import { GaugeChart, HorizontalBarChart } from './Charts';
import { Badge, RiskBadge } from './ui';
import { AnimatedNumber } from './AnimatedNumber';

function Section({ title, icon: Icon, children }: { title: string; icon: typeof ShieldCheck; children: React.ReactNode }) {
  return (
    <div className="glass-card p-6 animate-fade-in-up">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4 text-primary-400" />
        <h3 className="text-sm font-semibold text-ink-200">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export function PredictionResultView({
  result,
  job: _job,
  onExport,
}: {
  result: PredictionResult;
  job: JobInput;
  onExport: () => void;
}) {
  const isFraud = result.prediction === 'fraudulent';

  return (
    <div className="space-y-4">
      {/* Hero result banner */}
      <div
        className={`glass-card p-8 relative overflow-hidden animate-scale-in ${
          isFraud ? 'border-error-500/30' : 'border-success-500/30'
        }`}
      >
        <div
          className={`absolute -top-20 -right-20 w-64 h-64 rounded-full blur-[80px] ${
            isFraud ? 'bg-error-500/20' : 'bg-success-500/20'
          }`}
        />
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${
                isFraud
                  ? 'bg-gradient-to-br from-error-500 to-error-600 shadow-lg shadow-error-500/30'
                  : 'bg-gradient-to-br from-success-500 to-success-600 shadow-lg shadow-success-500/30'
              }`}
            >
              {isFraud ? <ShieldAlert className="w-8 h-8 text-white" /> : <ShieldCheck className="w-8 h-8 text-white" />}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className={`text-2xl font-bold ${isFraud ? 'text-error-300' : 'text-success-300'}`}>
                  {isFraud ? 'Fraudulent' : 'Genuine'}
                </h2>
                <RiskBadge level={result.riskLevel} />
              </div>
              <p className="text-sm text-ink-400 max-w-xl">{result.explanation}</p>
            </div>
          </div>
          <button onClick={onExport} className="btn-secondary shrink-0">
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>
      </div>

      {/* Key metrics row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
          <div className="flex items-center gap-2 text-ink-400 text-xs mb-2">
            <Gauge className="w-3.5 h-3.5" /> Risk Score
          </div>
          <p className="text-2xl font-bold text-ink-100">
            <AnimatedNumber value={result.riskScore} suffix="/100" />
          </p>
        </div>
        <div className="glass-card p-5 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-2 text-ink-400 text-xs mb-2">
            <TrendingUp className="w-3.5 h-3.5" /> Fraud Probability
          </div>
          <p className="text-2xl font-bold text-error-300">
            <AnimatedNumber value={result.fraudProbability * 100} decimals={1} suffix="%" />
          </p>
        </div>
        <div className="glass-card p-5 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          <div className="flex items-center gap-2 text-ink-400 text-xs mb-2">
            <ShieldCheck className="w-3.5 h-3.5" /> Confidence
          </div>
          <p className="text-2xl font-bold text-primary-300">
            <AnimatedNumber value={result.confidenceScore * 100} decimals={0} suffix="%" />
          </p>
        </div>
        <div className="glass-card p-5 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center gap-2 text-ink-400 text-xs mb-2">
            <AlertTriangle className="w-3.5 h-3.5" /> Rule Score
          </div>
          <p className="text-2xl font-bold text-warning-300">
            <AnimatedNumber value={result.ruleScore} suffix="/100" />
          </p>
        </div>
      </div>

      {/* Gauge + triggered rules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="glass-card p-6 flex flex-col items-center justify-center animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
          <h3 className="text-sm font-semibold text-ink-200 mb-2 self-start">Risk Gauge</h3>
          <GaugeChart value={result.riskScore} label="Risk Score" />
        </div>

        <div className="glass-card p-6 lg:col-span-2 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-warning-400" />
            <h3 className="text-sm font-semibold text-ink-200">Triggered Rules ({result.triggeredRules.length})</h3>
          </div>
          {result.triggeredRules.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-success-300 py-4">
              <CheckCircle2 className="w-4 h-4" /> No fraud rules triggered — this posting passed all rule checks.
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
              {result.triggeredRules.map((rule, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-ink-800/40 border border-white/5">
                  <XCircle className="w-4 h-4 text-error-400 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-ink-200">{rule.rule.replace(/_/g, ' ')}</span>
                      <Badge variant="error" size="sm">+{rule.weight}</Badge>
                    </div>
                    <p className="text-xs text-ink-400 mt-0.5">{rule.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Feature contributions (SHAP-style) */}
      <Section title="Feature Importance (SHAP-style)" icon={TrendingUp}>
        <HorizontalBarChart
          data={result.featureContributions.slice(0, 10).map((c) => ({
            label: c.feature,
            value: Math.abs(c.contribution),
            color: c.direction === 'positive'
              ? 'linear-gradient(to right, #f43f5e, #fb7185)'
              : 'linear-gradient(to right, #10b981, #34d399)',
          }))}
          formatValue={(v) => v.toFixed(3)}
        />
        <div className="flex gap-4 mt-4 text-xs">
          <span className="flex items-center gap-1.5 text-ink-400">
            <span className="w-3 h-3 rounded bg-error-500" /> Increases fraud risk
          </span>
          <span className="flex items-center gap-1.5 text-ink-400">
            <span className="w-3 h-3 rounded bg-success-500" /> Decreases fraud risk
          </span>
        </div>
      </Section>

      {/* Positive / negative factors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Section title="Positive Factors (fraud signals)" icon={TrendingUp}>
          {result.positiveFactors.length === 0 ? (
            <p className="text-sm text-ink-500 py-2">No significant fraud signals detected.</p>
          ) : (
            <ul className="space-y-2">
              {result.positiveFactors.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-ink-300">
                  <TrendingUp className="w-4 h-4 text-error-400 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          )}
        </Section>
        <Section title="Negative Factors (legitimacy signals)" icon={TrendingDown}>
          {result.negativeFactors.length === 0 ? (
            <p className="text-sm text-ink-500 py-2">No significant legitimacy signals detected.</p>
          ) : (
            <ul className="space-y-2">
              {result.negativeFactors.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-ink-300">
                  <TrendingDown className="w-4 h-4 text-success-400 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      {/* NLP features */}
      <Section title="NLP Feature Analysis" icon={FileText}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Word Count', value: result.nlpFeatures.wordCount },
            { label: 'Sentence Count', value: result.nlpFeatures.sentenceCount },
            { label: 'Avg Sentence Length', value: result.nlpFeatures.avgSentenceLength.toFixed(1) },
            { label: 'Lexical Diversity', value: result.nlpFeatures.lexicalDiversity.toFixed(3) },
            { label: 'Entity Density', value: result.nlpFeatures.namedEntityDensity.toFixed(4) },
            { label: 'Grammar Quality', value: `${result.nlpFeatures.grammarQualityScore.toFixed(0)}/100` },
            { label: 'Readability', value: `${result.nlpFeatures.readabilityScore.toFixed(0)}/100` },
            { label: 'Urgency Score', value: result.nlpFeatures.urgencyScore.toFixed(2) },
          ].map((m) => (
            <div key={m.label} className="p-3 rounded-xl bg-ink-800/40 border border-white/5">
              <p className="text-xs text-ink-500">{m.label}</p>
              <p className="text-lg font-semibold text-ink-100 mt-1">{m.value}</p>
            </div>
          ))}
        </div>
        {result.nlpFeatures.tfidfTopTerms.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-ink-500 mb-2">Top TF-IDF Terms</p>
            <div className="flex flex-wrap gap-2">
              {result.nlpFeatures.tfidfTopTerms.map((t, i) => (
                <span key={i} className="px-3 py-1 rounded-lg bg-primary-500/10 border border-primary-500/20 text-xs text-primary-300 font-mono">
                  {t.term} <span className="text-ink-500">{t.score.toFixed(3)}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </Section>

      {/* Recommendations */}
      <Section title="Safety Recommendations" icon={Lightbulb}>
        <ul className="space-y-3">
          {result.recommendations.map((r, i) => (
            <li key={i} className="flex items-start gap-3 p-3 rounded-xl bg-warning-500/5 border border-warning-500/10">
              <Lightbulb className="w-4 h-4 text-warning-400 mt-0.5 shrink-0" />
              <span className="text-sm text-ink-300">{r}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* Model info */}
      <div className="glass-card p-4 flex items-center justify-between text-xs text-ink-500">
        <span>Model: <span className="text-ink-300 font-mono">{result.modelUsed}</span></span>
        <span>Generated: {new Date().toLocaleString()}</span>
      </div>
    </div>
  );
}
