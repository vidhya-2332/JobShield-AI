export interface JobInput {
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
}

export interface TriggeredRule {
  rule: string;
  description: string;
  weight: number;
  category: 'metadata' | 'content' | 'salary' | 'language';
}

export interface FeatureContribution {
  feature: string;
  value: number;
  contribution: number;
  direction: 'positive' | 'negative';
}

export interface NlpFeatures {
  wordCount: number;
  sentenceCount: number;
  avgSentenceLength: number;
  lexicalDiversity: number;
  namedEntityDensity: number;
  grammarQualityScore: number;
  readabilityScore: number;
  urgencyScore: number;
  tooGoodToBeTrueScore: number;
  tfidfTopTerms: { term: string; score: number }[];
  posDistribution: Record<string, number>;
}

export interface StructuredFeatures {
  hasCompanyProfile: boolean;
  hasWebsite: boolean;
  hasLogo: boolean;
  hasBenefits: boolean;
  hasQuestions: boolean;
  hasRequirements: boolean;
  hasLocation: boolean;
  salaryAnomaly: number;
  salaryPercentile: number;
  profileLength: number;
  descriptionLength: number;
  requirementsLength: number;
  websiteTrustScore: number;
}

export interface PredictionResult {
  prediction: 'fraudulent' | 'genuine';
  fraudProbability: number;
  riskScore: number;
  confidenceScore: number;
  ruleScore: number;
  modelUsed: string;
  explanation: string;
  triggeredRules: TriggeredRule[];
  featureContributions: FeatureContribution[];
  positiveFactors: string[];
  negativeFactors: string[];
  recommendations: string[];
  nlpFeatures: NlpFeatures;
  structuredFeatures: StructuredFeatures;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface ModelMetrics {
  modelName: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  rocAuc: number;
  confusionMatrix: { tn: number; fp: number; fn: number; tp: number };
  isBest: boolean;
}
