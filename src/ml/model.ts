import type { NlpFeatures, StructuredFeatures, FeatureContribution } from './types';

// Logistic-regression-style model: weighted feature sum passed through a sigmoid.
// Weights are calibrated to approximate a model trained on EMSCAD-style features.
// This is a transparent, deterministic stand-in for a trained sklearn model —
// the same shape (weighted linear combination + sigmoid) as LogisticRegression.

const WEIGHTS = {
  // NLP features
  urgencyScore: 2.4,
  tooGoodToBeTrueScore: 2.6,
  namedEntityDensity: -3.0, // low density → fraud
  grammarQualityScore: -1.2, // low quality → fraud
  readabilityScore: -0.4,
  lexicalDiversity: -0.8,
  // Structured features
  hasCompanyProfile: -1.8,
  hasWebsite: -1.5,
  hasLogo: -1.0,
  hasBenefits: -0.8,
  hasQuestions: -0.4,
  hasRequirements: -1.2,
  hasLocation: -0.6,
  salaryAnomaly: 0.012, // per percent deviation
  websiteTrustScore: -0.018,
  profileLength: -0.0015,
  descriptionLength: -0.0008,
  requirementsLength: -0.001,
};

const BIAS = -0.4;

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

export function modelScore(
  nlp: NlpFeatures,
  structured: StructuredFeatures,
): { probability: number; logit: number } {
  let logit = BIAS;
  logit += nlp.urgencyScore * WEIGHTS.urgencyScore;
  logit += nlp.tooGoodToBeTrueScore * WEIGHTS.tooGoodToBeTrueScore;
  // Invert density/quality so that LOW values increase fraud probability.
  logit += (1 - nlp.namedEntityDensity) * -WEIGHTS.namedEntityDensity;
  logit += (1 - nlp.grammarQualityScore / 100) * -WEIGHTS.grammarQualityScore;
  logit += (1 - nlp.readabilityScore / 100) * -WEIGHTS.readabilityScore;
  logit += (1 - nlp.lexicalDiversity) * -WEIGHTS.lexicalDiversity;

  logit += (structured.hasCompanyProfile ? 1 : 0) * WEIGHTS.hasCompanyProfile;
  logit += (structured.hasWebsite ? 1 : 0) * WEIGHTS.hasWebsite;
  logit += (structured.hasLogo ? 1 : 0) * WEIGHTS.hasLogo;
  logit += (structured.hasBenefits ? 1 : 0) * WEIGHTS.hasBenefits;
  logit += (structured.hasQuestions ? 1 : 0) * WEIGHTS.hasQuestions;
  logit += (structured.hasRequirements ? 1 : 0) * WEIGHTS.hasRequirements;
  logit += (structured.hasLocation ? 1 : 0) * WEIGHTS.hasLocation;
  logit += structured.salaryAnomaly * WEIGHTS.salaryAnomaly;
  logit += structured.websiteTrustScore * WEIGHTS.websiteTrustScore;
  logit += structured.profileLength * WEIGHTS.profileLength;
  logit += structured.descriptionLength * WEIGHTS.descriptionLength;
  logit += structured.requirementsLength * WEIGHTS.requirementsLength;

  const probability = sigmoid(logit);
  return { probability, logit };
}

// SHAP-style feature contributions: each feature's marginal contribution to the logit.
export function featureContributions(
  nlp: NlpFeatures,
  structured: StructuredFeatures,
): FeatureContribution[] {
  const contributions: FeatureContribution[] = [];

  contributions.push({
    feature: 'Urgency Language',
    value: nlp.urgencyScore,
    contribution: nlp.urgencyScore * WEIGHTS.urgencyScore,
    direction: nlp.urgencyScore * WEIGHTS.urgencyScore >= 0 ? 'positive' : 'negative',
  });
  contributions.push({
    feature: 'Too-Good-To-Be-True Claims',
    value: nlp.tooGoodToBeTrueScore,
    contribution: nlp.tooGoodToBeTrueScore * WEIGHTS.tooGoodToBeTrueScore,
    direction: nlp.tooGoodToBeTrueScore * WEIGHTS.tooGoodToBeTrueScore >= 0 ? 'positive' : 'negative',
  });
  const densityContrib = (1 - nlp.namedEntityDensity) * -WEIGHTS.namedEntityDensity;
  contributions.push({
    feature: 'Named Entity Density',
    value: nlp.namedEntityDensity,
    contribution: densityContrib,
    direction: densityContrib >= 0 ? 'positive' : 'negative',
  });
  const grammarContrib = (1 - nlp.grammarQualityScore / 100) * -WEIGHTS.grammarQualityScore;
  contributions.push({
    feature: 'Grammar Quality',
    value: nlp.grammarQualityScore,
    contribution: grammarContrib,
    direction: grammarContrib >= 0 ? 'positive' : 'negative',
  });
  contributions.push({
    feature: 'Company Profile Present',
    value: structured.hasCompanyProfile ? 1 : 0,
    contribution: (structured.hasCompanyProfile ? 1 : 0) * WEIGHTS.hasCompanyProfile,
    direction: 'negative',
  });
  contributions.push({
    feature: 'Company Website Present',
    value: structured.hasWebsite ? 1 : 0,
    contribution: (structured.hasWebsite ? 1 : 0) * WEIGHTS.hasWebsite,
    direction: 'negative',
  });
  contributions.push({
    feature: 'Company Logo Present',
    value: structured.hasLogo ? 1 : 0,
    contribution: (structured.hasLogo ? 1 : 0) * WEIGHTS.hasLogo,
    direction: 'negative',
  });
  contributions.push({
    feature: 'Requirements Listed',
    value: structured.hasRequirements ? 1 : 0,
    contribution: (structured.hasRequirements ? 1 : 0) * WEIGHTS.hasRequirements,
    direction: 'negative',
  });
  contributions.push({
    feature: 'Salary Anomaly (%)',
    value: structured.salaryAnomaly,
    contribution: structured.salaryAnomaly * WEIGHTS.salaryAnomaly,
    direction: structured.salaryAnomaly * WEIGHTS.salaryAnomaly >= 0 ? 'positive' : 'negative',
  });
  contributions.push({
    feature: 'Website Trust Score',
    value: structured.websiteTrustScore,
    contribution: structured.websiteTrustScore * WEIGHTS.websiteTrustScore,
    direction: 'negative',
  });
  contributions.push({
    feature: 'Profile Length',
    value: structured.profileLength,
    contribution: structured.profileLength * WEIGHTS.profileLength,
    direction: 'negative',
  });
  contributions.push({
    feature: 'Description Length',
    value: structured.descriptionLength,
    contribution: structured.descriptionLength * WEIGHTS.descriptionLength,
    direction: 'negative',
  });

  return contributions.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
}
