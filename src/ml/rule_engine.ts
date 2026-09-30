import type { JobInput, TriggeredRule, StructuredFeatures } from './types';
import type { NlpResult } from './nlp';
import { salaryAnomaly } from './feature_engineering';

export interface RuleEngineResult {
  ruleScore: number;
  triggeredRules: TriggeredRule[];
}

const SENIOR_KEYWORDS = ['senior', 'lead', 'principal', 'head', 'chief', 'director', 'vp', 'manager', 'architect'];
const JUNIOR_KEYWORDS = ['junior', 'entry', 'intern', 'trainee', 'graduate', 'associate', 'assistant'];

function isSenior(title: string): boolean {
  const t = title.toLowerCase();
  return SENIOR_KEYWORDS.some((k) => t.includes(k));
}

function isJunior(title: string): boolean {
  const t = title.toLowerCase();
  return JUNIOR_KEYWORDS.some((k) => t.includes(k));
}

export function runRuleEngine(
  job: JobInput,
  nlp: NlpResult,
  structured: StructuredFeatures,
): RuleEngineResult {
  const rules: TriggeredRule[] = [];

  // Missing company profile
  if (!structured.hasCompanyProfile) {
    rules.push({
      rule: 'missing_company_profile',
      description: 'Company profile is missing or too short to establish legitimacy.',
      weight: 15,
      category: 'metadata',
    });
  }

  // Missing company website
  if (!structured.hasWebsite) {
    rules.push({
      rule: 'missing_website',
      description: 'No company website provided — legitimate employers usually have one.',
      weight: 15,
      category: 'metadata',
    });
  } else if (structured.websiteTrustScore < 40) {
    rules.push({
      rule: 'untrusted_website',
      description: `Company website has low trust signals (score ${structured.websiteTrustScore}/100).`,
      weight: 10,
      category: 'metadata',
    });
  }

  // Missing logo
  if (!structured.hasLogo) {
    rules.push({
      rule: 'missing_logo',
      description: 'No company logo uploaded — often a sign of a hastily created fake posting.',
      weight: 10,
      category: 'metadata',
    });
  }

  // Unrealistic salary
  const anomaly = salaryAnomaly(job);
  if (anomaly.flagged) {
    const direction = anomaly.diffPercent > 0 ? 'high' : 'low';
    rules.push({
      rule: 'unrealistic_salary',
      description: `Salary is unusually ${direction} (${Math.abs(anomaly.diffPercent).toFixed(0)}% off the role median).`,
      weight: 30,
      category: 'salary',
    });
  }

  // Excessive urgency language
  if (nlp.urgencyScore >= 0.34) {
    rules.push({
      rule: 'excessive_urgency',
      description: `Posting uses urgency language: ${nlp.urgencyMatches.slice(0, 3).join(', ')}.`,
      weight: 25,
      category: 'language',
    });
  } else if (nlp.urgencyScore > 0) {
    rules.push({
      rule: 'mild_urgency',
      description: `Some urgency language detected: ${nlp.urgencyMatches.join(', ')}.`,
      weight: 10,
      category: 'language',
    });
  }

  // Too-good-to-be-true claims
  if (nlp.tooGoodToBeTrueScore >= 0.34) {
    rules.push({
      rule: 'too_good_to_be_true',
      description: `Exaggerated income claims: ${nlp.tooGoodMatches.slice(0, 3).join(', ')}.`,
      weight: 25,
      category: 'language',
    });
  } else if (nlp.tooGoodToBeTrueScore > 0) {
    rules.push({
      rule: 'mild_exaggeration',
      description: `Mild exaggeration detected: ${nlp.tooGoodMatches.join(', ')}.`,
      weight: 10,
      category: 'language',
    });
  }

  // Fraud keywords (fees, payments, reshipping)
  if (nlp.fraudKeywordMatches.length > 0) {
    rules.push({
      rule: 'fraud_keywords',
      description: `Known fraud indicators: ${nlp.fraudKeywordMatches.slice(0, 3).join(', ')}.`,
      weight: 35,
      category: 'content',
    });
  }

  // Senior role with no experience requirement
  if (isSenior(job.title) && !structured.hasRequirements) {
    rules.push({
      rule: 'senior_no_experience',
      description: 'Senior-level title but no experience requirements listed.',
      weight: 15,
      category: 'content',
    });
  }

  // Senior role with no education requirement
  if (isSenior(job.title) && job.education.trim().length === 0) {
    rules.push({
      rule: 'senior_no_education',
      description: 'Senior-level title but no education requirement specified.',
      weight: 10,
      category: 'content',
    });
  }

  // Junior role with unrealistically high salary
  if (isJunior(job.title) && anomaly.diffPercent > 100) {
    rules.push({
      rule: 'junior_high_salary',
      description: 'Entry-level title paired with an unusually high salary.',
      weight: 20,
      category: 'salary',
    });
  }

  // Generic / very short company description
  if (structured.profileLength > 0 && structured.profileLength < 80) {
    rules.push({
      rule: 'generic_description',
      description: 'Company description is very short and generic.',
      weight: 10,
      category: 'content',
    });
  }

  // Low named-entity density — vague company description
  if (nlp.wordCount > 50 && nlp.namedEntityDensity < 0.01) {
    rules.push({
      rule: 'low_entity_density',
      description: 'Description mentions very few named entities — unusually vague.',
      weight: 10,
      category: 'content',
    });
  }

  // Poor grammar quality
  if (nlp.grammarQualityScore < 50) {
    rules.push({
      rule: 'poor_grammar',
      description: `Low grammar quality score (${nlp.grammarQualityScore.toFixed(0)}/100).`,
      weight: 12,
      category: 'language',
    });
  }

  // Missing location
  if (!structured.hasLocation) {
    rules.push({
      rule: 'missing_location',
      description: 'No job location provided — legitimate postings usually specify one.',
      weight: 8,
      category: 'metadata',
    });
  }

  // Missing benefits for a senior role
  if (isSenior(job.title) && !structured.hasBenefits) {
    rules.push({
      rule: 'senior_no_benefits',
      description: 'Senior role listed without any benefits — atypical for legitimate employers.',
      weight: 8,
      category: 'content',
    });
  }

  const ruleScore = Math.min(100, rules.reduce((sum, r) => sum + r.weight, 0));
  return { ruleScore, triggeredRules: rules };
}
