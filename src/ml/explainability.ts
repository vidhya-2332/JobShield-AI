import type { JobInput, TriggeredRule, FeatureContribution } from './types';

export function generateExplanation(
  job: JobInput,
  prediction: 'fraudulent' | 'genuine',
  triggeredRules: TriggeredRule[],
  _topContributions: FeatureContribution[],
): string {
  if (prediction === 'genuine') {
    const positives: string[] = [];
    if (job.company_profile && job.company_profile.length > 100) positives.push('a detailed company profile');
    if (job.website) positives.push('a verifiable company website');
    if (job.requirements && job.requirements.length > 50) positives.push('clear experience requirements');
    if (job.company_logo_url) positives.push('a company logo');
    if (positives.length === 0) {
      return 'This job posting appears genuine based on the overall feature profile, though limited information was provided.';
    }
    return `This job posting is likely genuine because it includes ${positives.slice(0, 3).join(', ')} and shows no significant fraud indicators.`;
  }

  const reasons: string[] = [];
  const salaryRule = triggeredRules.find((r) => r.rule === 'unrealistic_salary');
  if (salaryRule) reasons.push('an unusually mismatched salary for the role');

  const urgencyRule = triggeredRules.find((r) => r.rule === 'excessive_urgency');
  if (urgencyRule) reasons.push('excessive urgency language pressuring quick application');

  const tgtRule = triggeredRules.find((r) => r.rule === 'too_good_to_be_true');
  if (tgtRule) reasons.push('exaggerated income claims that seem too good to be true');

  const fraudRule = triggeredRules.find((r) => r.rule === 'fraud_keywords');
  if (fraudRule) reasons.push('known fraud indicators such as requests for fees or payments');

  if (!job.company_profile || job.company_profile.length < 50) reasons.push('a missing or vague company profile');
  if (!job.website) reasons.push('no verifiable company website');
  if (!job.company_logo_url) reasons.push('no company logo');

  const seniorRule = triggeredRules.find((r) => r.rule === 'senior_no_experience');
  if (seniorRule) reasons.push('a senior title with no experience requirements');

  if (reasons.length === 0) {
    reasons.push('multiple weak fraud signals detected across the posting');
  }

  return `This job posting is likely fraudulent because it ${reasons.slice(0, 4).join(', ')}, and ${reasons[reasons.length - 1] || 'raises multiple red flags'}.`;
}

export function generateRecommendations(
  prediction: 'fraudulent' | 'genuine',
  triggeredRules: TriggeredRule[],
): string[] {
  const recs: string[] = [];
  if (prediction === 'fraudulent') {
    recs.push('Do not pay any application, registration, or training fees — legitimate employers never charge candidates.');
    recs.push('Verify the company website independently and check for a professional online presence.');
    recs.push('Research the recruiter on LinkedIn and confirm their association with the company.');
    recs.push('Never share sensitive personal information (SSN, bank details, ID copies) before verifying legitimacy.');
    recs.push('Search for the company name plus "scam" or "fraud" to find reported incidents.');
    if (triggeredRules.some((r) => r.rule === 'unrealistic_salary')) {
      recs.push('Compare the offered salary against industry benchmarks on Glassdoor or PayScale.');
    }
    if (triggeredRules.some((r) => r.rule === 'fraud_keywords')) {
      recs.push('Be especially cautious — this posting contains language commonly used in known scam patterns.');
    }
  } else {
    recs.push('This posting appears legitimate, but always verify the company independently before applying.');
    recs.push('Check the company on LinkedIn, Glassdoor, and the Better Business Bureau.');
    recs.push('Confirm the recruiter\'s identity and email domain match the company.');
  }
  return recs;
}

export function splitFactors(
  contributions: FeatureContribution[],
): { positive: string[]; negative: string[] } {
  const positive: string[] = [];
  const negative: string[] = [];
  for (const c of contributions) {
    if (Math.abs(c.contribution) < 0.05) continue;
    if (c.direction === 'positive') {
      positive.push(`${c.feature} (impact: ${c.contribution.toFixed(2)})`);
    } else {
      negative.push(`${c.feature} (impact: ${c.contribution.toFixed(2)})`);
    }
  }
  return { positive: positive.slice(0, 6), negative: negative.slice(0, 6) };
}

export function riskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 35) return 'medium';
  return 'low';
}
