import math
from .types import JobInput, FeatureContribution

MODEL_WEIGHTS = {
    "urgency_score": 0.18,
    "too_good_score": 0.16,
    "fraud_keyword_score": 0.22,
    "salary_anomaly": 0.15,
    "missing_company_profile": 0.08,
    "missing_website": 0.08,
    "untrusted_website": 0.06,
    "missing_logo": 0.05,
    "poor_grammar": 0.07,
    "low_entity_density": 0.05,
    "generic_description": 0.05,
    "missing_location": 0.03,
    "senior_no_experience": 0.06,
    "junior_high_salary": 0.08,
}

BIAS = -2.5


def _sigmoid(x: float) -> float:
    if x >= 0:
        z = math.exp(-x)
        return 1 / (1 + z)
    z = math.exp(x)
    return z / (1 + z)


def compute_ml_score(job: JobInput, features: dict) -> tuple[float, list[FeatureContribution]]:
    fv: dict[str, float] = {}

    fv["urgency_score"] = features["urgency_score"]
    fv["too_good_score"] = features["too_good_score"]
    fv["fraud_keyword_score"] = features["fraud_keyword_score"]
    fv["salary_anomaly"] = 1.0 if features["salary_anomaly"]["anomaly"] else 0.0
    fv["missing_company_profile"] = 0.0 if features["has_company_profile"] else 1.0
    fv["missing_website"] = 0.0 if job.website.strip() else 1.0
    wt = features["website_trust"]
    fv["untrusted_website"] = 1.0 if (job.website.strip() and not wt["trusted"] and wt["reason"] != "missing") else 0.0
    fv["missing_logo"] = 0.0 if features["has_company_logo"] else 1.0
    fv["poor_grammar"] = max(0, 1 - features["grammar_quality"])
    fv["low_entity_density"] = max(0, 1 - features["entity_density"]) if features["entity_density"] < 1 else 0
    fv["generic_description"] = 1.0 if features["desc_word_count"] < 50 else 0.0
    fv["missing_location"] = 0.0 if features["has_location"] else 1.0

    title_lower = job.title.lower()
    is_senior = "senior" in title_lower or "lead" in title_lower or "principal" in title_lower
    fv["senior_no_experience"] = 1.0 if (is_senior and not job.requirements.strip()) else 0.0

    is_junior = "junior" in title_lower or "entry" in title_lower or "intern" in title_lower
    salary = job.salary
    fv["junior_high_salary"] = 1.0 if (is_junior and salary and salary > 80000) else 0.0

    linear_sum = BIAS
    contributions: list[FeatureContribution] = []

    for feature, weight in MODEL_WEIGHTS.items():
        value = fv.get(feature, 0)
        contribution = weight * value
        linear_sum += contribution
        direction = "positive" if contribution > 0 else "negative"
        contributions.append(FeatureContribution(
            feature=feature,
            value=round(value, 4),
            contribution=round(contribution, 4),
            direction=direction,
        ))

    probability = _sigmoid(linear_sum)
    contributions.sort(key=lambda c: abs(c.contribution), reverse=True)

    return probability, contributions
