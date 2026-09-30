import { apiRequest } from './api';
import type { JobInput, PredictionResult } from '../ml/types';

export interface JobRecord {
  id: number;
  user_id: number;
  title: string;
  company_name: string;
  company_profile: string;
  website: string;
  location: string;
  salary: number;
  salary_currency: string;
  employment_type: string;
  experience: string;
  education: string;
  description: string;
  requirements: string;
  benefits: string;
  questions: string;
  company_logo_url: string;
  created_at: string;
}

export interface PredictionRecord {
  id: number;
  user: number;
  job: number;
  prediction: string;
  fraud_probability: number;
  risk_score: number;
  confidence_score: number;
  rule_score: number;
  model_used: string;
  explanation: string;
  triggered_rules: any[];
  feature_contributions: any[];
  positive_factors: string[];
  negative_factors: string[];
  recommendations: string[];
  created_at: string;
  job?: JobRecord;
}

export interface HistoryRecord {
  id: number;
  prediction: number;
  job_title: string;
  company_name: string;
  prediction_label: string;
  risk_score: number;
  fraud_probability: number;
  created_at: string;
}

// Analyzes a job via the Django backend (server-side rule-engine + model
// pipeline) and persists the Job + Prediction rows to PostgreSQL. Returns
// the backend's authoritative result merged over the locally-computed one
// so the UI keeps its rich, instantly-available nlp/structured breakdown
// while risk scores, explanations, and stored records come from Django.
export async function saveJobAndPrediction(
  job: JobInput,
  result: PredictionResult,
): Promise<{ jobRecord: JobRecord | null; predictionRecord: PredictionRecord | null; mergedResult: PredictionResult; error: string | null }> {
  const { data, error } = await apiRequest<any>('/analyze/', {
    method: 'POST',
    body: JSON.stringify(job),
  });

  if (error || !data) {
    return { jobRecord: null, predictionRecord: null, mergedResult: result, error: error || 'Analysis failed' };
  }

  const mergedResult: PredictionResult = {
    ...result,
    prediction: data.prediction,
    fraudProbability: data.fraud_probability,
    riskScore: data.risk_score,
    confidenceScore: data.confidence_score,
    ruleScore: data.rule_score,
    modelUsed: data.model_used,
    explanation: data.explanation,
    triggeredRules: data.triggered_rules ?? result.triggeredRules,
    featureContributions: data.feature_contributions ?? result.featureContributions,
    positiveFactors: data.positive_factors ?? result.positiveFactors,
    negativeFactors: data.negative_factors ?? result.negativeFactors,
    recommendations: data.recommendations ?? result.recommendations,
    riskLevel: data.risk_level,
  };

  return {
    jobRecord: { id: data.job_id, ...job, user_id: 0, created_at: new Date().toISOString() } as JobRecord,
    predictionRecord: { id: data.prediction_id } as PredictionRecord,
    mergedResult,
    error: null,
  };
}

export async function fetchPredictions(limit = 100): Promise<{ data: PredictionRecord[] | null; error: string | null }> {
  const { data, error } = await apiRequest<PredictionRecord[]>('/predictions/');
  if (error) return { data: null, error };
  return { data: (data || []).slice(0, limit), error: null };
}

export async function fetchHistory(limit = 200): Promise<{ data: HistoryRecord[] | null; error: string | null }> {
  const { data, error } = await apiRequest<HistoryRecord[]>('/history/');
  if (error) return { data: null, error };
  return { data: (data || []).slice(0, limit), error: null };
}

export async function fetchPredictionById(id: string | number): Promise<{ data: PredictionRecord | null; error: string | null }> {
  const { data, error } = await apiRequest<PredictionRecord>(`/predictions/${id}/`);
  return { data, error };
}

export async function deletePrediction(id: string | number): Promise<{ error: string | null }> {
  const { error } = await apiRequest(`/predictions/${id}/`, { method: 'DELETE' });
  return { error };
}

export interface DashboardStats {
  total: number;
  fraudulent: number;
  genuine: number;
  avgRisk: number;
  byRiskLevel: { low: number; medium: number; high: number; critical: number };
  monthly: { month: string; count: number; fraudulent: number; genuine: number }[];
}

export async function fetchDashboardStats(): Promise<{ data: DashboardStats | null; error: string | null }> {
  const { data, error } = await apiRequest<HistoryRecord[]>('/history/');
  if (error) return { data: null, error };
  if (!data || data.length === 0) {
    return {
      data: {
        total: 0,
        fraudulent: 0,
        genuine: 0,
        avgRisk: 0,
        byRiskLevel: { low: 0, medium: 0, high: 0, critical: 0 },
        monthly: [],
      },
      error: null,
    };
  }

  const records = data.slice(0, 500);
  const total = records.length;
  const fraudulent = records.filter((d) => d.prediction_label === 'fraudulent').length;
  const genuine = total - fraudulent;
  const avgRisk = Math.round(records.reduce((s, d) => s + (d.risk_score || 0), 0) / total);

  const byRiskLevel = { low: 0, medium: 0, high: 0, critical: 0 };
  for (const d of records) {
    const s = d.risk_score || 0;
    if (s >= 80) byRiskLevel.critical += 1;
    else if (s >= 60) byRiskLevel.high += 1;
    else if (s >= 35) byRiskLevel.medium += 1;
    else byRiskLevel.low += 1;
  }

  const now = new Date();
  const monthly: { month: string; count: number; fraudulent: number; genuine: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString('en-US', { month: 'short' });
    monthly.push({ month: label, count: 0, fraudulent: 0, genuine: 0 });
  }
  for (const d of records) {
    const created = new Date(d.created_at);
    const monthIdx = (now.getFullYear() - created.getFullYear()) * 12 + (now.getMonth() - created.getMonth());
    const bucket = 5 - monthIdx;
    if (bucket >= 0 && bucket < 6) {
      monthly[bucket].count += 1;
      if (d.prediction_label === 'fraudulent') monthly[bucket].fraudulent += 1;
      else monthly[bucket].genuine += 1;
    }
  }

  return {
    data: { total, fraudulent, genuine, avgRisk, byRiskLevel, monthly },
    error: null,
  };
}
