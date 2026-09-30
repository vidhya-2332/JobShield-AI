from dataclasses import dataclass, field
from typing import Any


@dataclass
class JobInput:
    title: str = ""
    company_name: str = ""
    company_profile: str = ""
    website: str = ""
    location: str = ""
    salary: int | None = 0
    salary_currency: str = "USD"
    employment_type: str = ""
    experience: str = ""
    education: str = ""
    description: str = ""
    requirements: str = ""
    benefits: str = ""
    questions: str = ""
    company_logo_url: str = ""


@dataclass
class RuleResult:
    rule_id: str
    rule_name: str
    triggered: bool
    weight: float
    category: str
    message: str


@dataclass
class FeatureContribution:
    feature: str
    value: float
    contribution: float
    direction: str


@dataclass
class PredictionResult:
    risk_score: float
    risk_level: str
    fraud_probability: float
    rule_score: float
    ml_score: float
    explanation: str
    prediction: str = "genuine"
    confidence_score: float = 0.0
    model_used: str = "hybrid-v1 (rule-engine + logistic-regression)"
    positive_factors: list[str] = field(default_factory=list)
    negative_factors: list[str] = field(default_factory=list)
    recommendations: list[str] = field(default_factory=list)
    triggered_rules: list[RuleResult] = field(default_factory=list)
    feature_contributions: list[FeatureContribution] = field(default_factory=list)
    extracted_features: dict[str, Any] = field(default_factory=dict)
