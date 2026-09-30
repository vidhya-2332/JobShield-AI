import type { JobInput, NlpFeatures, StructuredFeatures } from './types';
import { runNlp, type NlpResult } from './nlp';

// Salary lookup table — median annual salary (USD) by normalized job title.
// Built from EMSCAD-style role buckets. Used for salary anomaly detection.
const SALARY_LOOKUP: Record<string, { median: number; p25: number; p75: number }> = {
  'software engineer': { median: 110000, p25: 80000, p75: 150000 },
  'developer': { median: 95000, p25: 65000, p75: 130000 },
  'data scientist': { median: 120000, p25: 90000, p75: 160000 },
  'data analyst': { median: 75000, p25: 55000, p75: 100000 },
  'product manager': { median: 130000, p25: 95000, p75: 170000 },
  'project manager': { median: 100000, p25: 75000, p75: 135000 },
  'designer': { median: 85000, p25: 60000, p75: 120000 },
  'marketing': { median: 70000, p25: 48000, p75: 100000 },
  'sales': { median: 65000, p25: 40000, p75: 110000 },
  'accountant': { median: 70000, p25: 52000, p75: 95000 },
  'engineer': { median: 95000, p25: 68000, p75: 130000 },
  'analyst': { median: 72000, p25: 52000, p75: 100000 },
  'manager': { median: 95000, p25: 70000, p75: 140000 },
  'consultant': { median: 90000, p25: 65000, p75: 130000 },
  'administrator': { median: 65000, p25: 45000, p75: 90000 },
  'representative': { median: 45000, p25: 32000, p75: 65000 },
  'assistant': { median: 40000, p25: 30000, p75: 55000 },
  'coordinator': { median: 48000, p25: 36000, p75: 65000 },
  'specialist': { median: 55000, p25: 40000, p75: 78000 },
  'director': { median: 150000, p25: 110000, p75: 210000 },
  'intern': { median: 35000, p25: 28000, p75: 45000 },
  'entry': { median: 45000, p25: 35000, p75: 60000 },
  'senior': { median: 120000, p25: 90000, p75: 165000 },
  'lead': { median: 135000, p25: 100000, p75: 180000 },
  'executive': { median: 180000, p25: 130000, p75: 250000 },
};

const DEFAULT_SALARY = { median: 75000, p25: 50000, p75: 110000 };

function normalizeTitle(title: string): string {
  return title.toLowerCase().trim();
}

function lookupSalary(title: string) {
  const t = normalizeTitle(title);
  for (const key of Object.keys(SALARY_LOOKUP)) {
    if (t.includes(key)) return SALARY_LOOKUP[key];
  }
  return DEFAULT_SALARY;
}

// Heuristic website trust: https, recognizable TLD, no free-hosting domains.
const FREE_HOSTING = ['blogspot', 'wordpress', 'wix', 'weebly', 'godaddysites', 'carrd'];

export function websiteTrustScore(url: string): number {
  if (!url || url.trim().length === 0) return 0;
  let score = 50;
  if (/^https:\/\//i.test(url)) score += 20;
  else if (/^http:\/\//i.test(url)) score += 5;
  if (/\.(com|org|net|io|co|ai|tech)(\/|$)/i.test(url)) score += 20;
  if (/\.(info|biz|tk|ml|ga|cf|gq)(\/|$)/i.test(url)) score -= 25;
  if (FREE_HOSTING.some((d) => url.toLowerCase().includes(d))) score -= 30;
  if (url.length < 8) score -= 15;
  return Math.max(0, Math.min(100, score));
}

export function salaryAnomaly(job: JobInput): { diffPercent: number; percentile: number; flagged: boolean } {
  const lookup = lookupSalary(job.title);
  const actual = job.salary || 0;
  if (actual === 0) return { diffPercent: 0, percentile: 0, flagged: false };
  const diffPercent = ((actual - lookup.median) / lookup.median) * 100;
  let percentile = 50;
  if (actual <= lookup.p25) percentile = 25;
  else if (actual <= lookup.median) percentile = 50;
  else if (actual <= lookup.p75) percentile = 75;
  else percentile = 95;
  // Flag if salary is more than 2x the p75 (unrealistically high) or below 30% of p25.
  const flagged = actual > lookup.p75 * 2 || (actual < lookup.p25 * 0.3 && actual > 0);
  return { diffPercent, percentile, flagged };
}

export function extractStructured(job: JobInput): StructuredFeatures {
  const anomaly = salaryAnomaly(job);
  return {
    hasCompanyProfile: job.company_profile.trim().length > 50,
    hasWebsite: job.website.trim().length > 0,
    hasLogo: job.company_logo_url.trim().length > 0,
    hasBenefits: job.benefits.trim().length > 20,
    hasQuestions: job.questions.trim().length > 10,
    hasRequirements: job.requirements.trim().length > 20,
    hasLocation: job.location.trim().length > 0,
    salaryAnomaly: anomaly.diffPercent,
    salaryPercentile: anomaly.percentile,
    profileLength: job.company_profile.length,
    descriptionLength: job.description.length,
    requirementsLength: job.requirements.length,
    websiteTrustScore: websiteTrustScore(job.website),
  };
}

export function extractNlp(job: JobInput): { features: NlpFeatures; raw: NlpResult } {
  const combined = [
    job.description,
    job.requirements,
    job.company_profile,
    job.benefits,
    job.title,
  ].join('\n\n');
  const raw = runNlp(combined);
  const features: NlpFeatures = {
    wordCount: raw.wordCount,
    sentenceCount: raw.sentenceCount,
    avgSentenceLength: raw.avgSentenceLength,
    lexicalDiversity: raw.lexicalDiversity,
    namedEntityDensity: raw.namedEntityDensity,
    grammarQualityScore: raw.grammarQualityScore,
    readabilityScore: raw.readabilityScore,
    urgencyScore: raw.urgencyScore,
    tooGoodToBeTrueScore: raw.tooGoodToBeTrueScore,
    tfidfTopTerms: raw.tfidfTopTerms,
    posDistribution: raw.posDistribution,
  };
  return { features, raw };
}
