import type { JobInput, PredictionResult } from './types';
import { extractNlp, extractStructured } from './feature_engineering';
import { runRuleEngine } from './rule_engine';
import { modelScore, featureContributions } from './model';
import { generateExplanation, generateRecommendations, splitFactors, riskLevel } from './explainability';

// Hybrid prediction: combines rule-engine score and ML model probability.
// Final risk score = 0.45 * ruleScore + 0.55 * (probability * 100), clamped 0..100.
export function predict(job: JobInput): PredictionResult {
  const { features: nlpFeatures, raw: nlpRaw } = extractNlp(job);
  const structured = extractStructured(job);
  const { ruleScore, triggeredRules } = runRuleEngine(job, nlpRaw, structured);
  const { probability } = modelScore(nlpFeatures, structured);
  const contributions = featureContributions(nlpFeatures, structured);

  const mlScore = probability * 100;
  const riskScore = Math.round(Math.min(100, Math.max(0, 0.45 * ruleScore + 0.55 * mlScore)));

  // If rule engine is overwhelmingly negative, force high risk.
  const effectiveRisk = ruleScore > 80 ? Math.max(riskScore, 80) : riskScore;

  const prediction: 'fraudulent' | 'genuine' = effectiveRisk >= 50 ? 'fraudulent' : 'genuine';
  const confidenceScore = Math.round(
    (prediction === 'fraudulent'
      ? Math.min(1, 0.5 + (effectiveRisk - 50) / 100)
      : Math.min(1, 0.5 + (50 - effectiveRisk) / 100)) * 100,
  ) / 100;

  const explanation = generateExplanation(job, prediction, triggeredRules, contributions);
  const recommendations = generateRecommendations(prediction, triggeredRules);
  const { positive, negative } = splitFactors(contributions);

  return {
    prediction,
    fraudProbability: Math.round(probability * 1000) / 1000,
    riskScore: effectiveRisk,
    confidenceScore,
    ruleScore,
    modelUsed: 'hybrid-v1 (rule-engine + logistic-regression)',
    explanation,
    triggeredRules,
    featureContributions: contributions,
    positiveFactors: positive,
    negativeFactors: negative,
    recommendations,
    nlpFeatures,
    structuredFeatures: structured,
    riskLevel: riskLevel(effectiveRisk),
  };
}

// Batch prediction for CSV upload.
export function predictBatch(jobs: JobInput[]): PredictionResult[] {
  return jobs.map(predict);
}
