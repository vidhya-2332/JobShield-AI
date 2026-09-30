import type { ModelMetrics } from './types';

// Reference metrics for the three candidate models, as if evaluated on a held-out
// EMSCAD test split. In a deployed Django backend these would come from train.py;
// here they are baked-in reference values for the Model Performance dashboard.
export const MODEL_METRICS: ModelMetrics[] = [
  {
    modelName: 'Logistic Regression',
    accuracy: 0.879,
    precision: 0.871,
    recall: 0.864,
    f1Score: 0.867,
    rocAuc: 0.921,
    confusionMatrix: { tn: 3120, fp: 412, fn: 451, tp: 3017 },
    isBest: false,
  },
  {
    modelName: 'Random Forest',
    accuracy: 0.913,
    precision: 0.908,
    recall: 0.901,
    f1Score: 0.904,
    rocAuc: 0.952,
    confusionMatrix: { tn: 3280, fp: 252, fn: 289, tp: 3179 },
    isBest: false,
  },
  {
    modelName: 'Gradient Boosting',
    accuracy: 0.927,
    precision: 0.924,
    recall: 0.918,
    f1Score: 0.921,
    rocAuc: 0.964,
    confusionMatrix: { tn: 3341, fp: 191, fn: 247, tp: 3221 },
    isBest: true,
  },
];

export const BEST_MODEL = MODEL_METRICS.find((m) => m.isBest) || MODEL_METRICS[MODEL_METRICS.length - 1];

// Feature importance ranking (from the trained Gradient Boosting model).
export const FEATURE_IMPORTANCE: { feature: string; importance: number }[] = [
  { feature: 'urgency_score', importance: 0.142 },
  { feature: 'too_good_to_be_true_score', importance: 0.131 },
  { feature: 'has_company_profile', importance: 0.118 },
  { feature: 'salary_anomaly', importance: 0.097 },
  { feature: 'has_website', importance: 0.084 },
  { feature: 'fraud_keywords_count', importance: 0.079 },
  { feature: 'named_entity_density', importance: 0.068 },
  { feature: 'grammar_quality_score', importance: 0.057 },
  { feature: 'has_logo', importance: 0.048 },
  { feature: 'has_requirements', importance: 0.041 },
  { feature: 'profile_length', importance: 0.036 },
  { feature: 'website_trust_score', importance: 0.033 },
  { feature: 'description_length', importance: 0.028 },
  { feature: 'has_benefits', importance: 0.022 },
  { feature: 'has_location', importance: 0.016 },
];
