import { Cpu, Award, TrendingUp, BarChart3, CheckCircle2 } from 'lucide-react';
import { MODEL_METRICS, BEST_MODEL, FEATURE_IMPORTANCE } from '../ml/model_metrics';
import { HorizontalBarChart, BarChart } from '../components/Charts';
import { Badge } from '../components/ui';

export function ModelPage() {
  return (
    <div className="space-y-6">
      {/* Best model banner */}
      <div className="glass-card p-6 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-success-500/10 blur-[80px]" />
        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-success-500 to-success-600 flex items-center justify-center shadow-lg shadow-success-500/30">
            <Award className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-ink-100">Best Model: {BEST_MODEL.modelName}</h3>
              <Badge variant="success">Selected</Badge>
            </div>
            <p className="text-sm text-ink-400 mt-0.5">
              Accuracy {(BEST_MODEL.accuracy * 100).toFixed(1)}% · F1 {(BEST_MODEL.f1Score * 100).toFixed(1)}% · ROC-AUC {BEST_MODEL.rocAuc.toFixed(3)}
            </p>
          </div>
        </div>
      </div>

      {/* Model comparison table */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Cpu className="w-4 h-4 text-primary-400" />
          <h3 className="text-sm font-semibold text-ink-200">Model Comparison</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-ink-400 text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-medium">Model</th>
                <th className="text-left px-4 py-3 font-medium">Accuracy</th>
                <th className="text-left px-4 py-3 font-medium">Precision</th>
                <th className="text-left px-4 py-3 font-medium">Recall</th>
                <th className="text-left px-4 py-3 font-medium">F1 Score</th>
                <th className="text-left px-4 py-3 font-medium">ROC-AUC</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {MODEL_METRICS.map((m) => (
                <tr key={m.modelName} className={`border-b border-white/5 ${m.isBest ? 'bg-success-500/5' : ''}`}>
                  <td className="px-4 py-3 font-medium text-ink-200">{m.modelName}</td>
                  <td className="px-4 py-3 text-ink-300">{(m.accuracy * 100).toFixed(1)}%</td>
                  <td className="px-4 py-3 text-ink-300">{(m.precision * 100).toFixed(1)}%</td>
                  <td className="px-4 py-3 text-ink-300">{(m.recall * 100).toFixed(1)}%</td>
                  <td className="px-4 py-3 text-ink-300">{(m.f1Score * 100).toFixed(1)}%</td>
                  <td className="px-4 py-3 text-ink-300">{m.rocAuc.toFixed(3)}</td>
                  <td className="px-4 py-3">
                    {m.isBest ? <Badge variant="success" size="sm"><CheckCircle2 className="w-3 h-3" /> Best</Badge> : <Badge size="sm">Candidate</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Accuracy comparison chart */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-primary-400" />
          <h3 className="text-sm font-semibold text-ink-200">Metric Comparison</h3>
        </div>
        <BarChart
          data={MODEL_METRICS.map((m) => ({ label: m.modelName.split(' ')[0], value: m.accuracy * 100 }))}
          color="#3b82f6"
          height={220}
          formatValue={(v) => `${v.toFixed(1)}%`}
        />
        <p className="text-xs text-ink-500 mt-3 text-center">Accuracy comparison across candidate models</p>
      </div>

      {/* Confusion matrices */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {MODEL_METRICS.map((m) => {
          const total = m.confusionMatrix.tn + m.confusionMatrix.fp + m.confusionMatrix.fn + m.confusionMatrix.tp;
          return (
            <div key={m.modelName} className="glass-card p-5">
              <h4 className="text-sm font-medium text-ink-200 mb-3">{m.modelName}</h4>
              <div className="grid grid-cols-2 gap-1 text-center text-xs">
                <div className="p-3 rounded-lg bg-success-500/10">
                  <p className="text-2xl font-bold text-success-300">{m.confusionMatrix.tn}</p>
                  <p className="text-ink-500 mt-1">True Neg</p>
                </div>
                <div className="p-3 rounded-lg bg-error-500/10">
                  <p className="text-2xl font-bold text-error-300">{m.confusionMatrix.fp}</p>
                  <p className="text-ink-500 mt-1">False Pos</p>
                </div>
                <div className="p-3 rounded-lg bg-error-500/10">
                  <p className="text-2xl font-bold text-error-300">{m.confusionMatrix.fn}</p>
                  <p className="text-ink-500 mt-1">False Neg</p>
                </div>
                <div className="p-3 rounded-lg bg-success-500/10">
                  <p className="text-2xl font-bold text-success-300">{m.confusionMatrix.tp}</p>
                  <p className="text-ink-500 mt-1">True Pos</p>
                </div>
              </div>
              <p className="text-xs text-ink-500 mt-3 text-center">Total samples: {total.toLocaleString()}</p>
            </div>
          );
        })}
      </div>

      {/* Feature importance */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-accent-400" />
          <h3 className="text-sm font-semibold text-ink-200">Feature Importance (Best Model)</h3>
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

      {/* Pipeline info */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-ink-200 mb-4">ML Pipeline</h3>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {['Raw Text', 'Tokenization', 'Stopword Removal', 'Lemmatization', 'POS Tagging', 'NER', 'TF-IDF', 'Feature Engineering', 'Rule Engine', 'ML Model', 'SHAP', 'Prediction'].map((step, i, arr) => (
            <div key={step} className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-lg bg-primary-500/10 border border-primary-500/20 text-primary-300 font-medium">
                {step}
              </span>
              {i < arr.length - 1 && <span className="text-ink-600">→</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
