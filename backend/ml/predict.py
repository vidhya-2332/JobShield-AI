from .types import JobInput, PredictionResult
from .feature_engineering import extract_features
from .rule_engine import evaluate_rules, compute_rule_score
from .model import compute_ml_score
from .explainability import generate_explanation, generate_recommendations


def predict(job: JobInput) -> PredictionResult:
    features = extract_features(job)
    rule_results = evaluate_rules(job, features)
    rule_score = compute_rule_score(rule_results)
    fraud_probability, contributions = compute_ml_score(job, features)
    ml_score = fraud_probability * 100

    risk_score = 0.45 * rule_score + 0.55 * ml_score
    risk_score = round(min(100, max(0, risk_score)), 2)

    effective_risk = max(risk_score, 80) if rule_score > 80 else risk_score

    if rule_score > 80:
        risk_level = "critical"
    elif effective_risk >= 70:
        risk_level = "critical"
    elif effective_risk >= 50:
        risk_level = "high"
    elif effective_risk >= 30:
        risk_level = "medium"
    else:
        risk_level = "low"

    prediction_label = "fraudulent" if effective_risk >= 50 else "genuine"
    if prediction_label == "fraudulent":
        confidence_score = round(min(1, 0.5 + (effective_risk - 50) / 100), 2)
    else:
        confidence_score = round(min(1, 0.5 + (50 - effective_risk) / 100), 2)

    positive_factors = [
        c.feature.replace("_", " ") for c in contributions if c.direction == "positive" and c.contribution > 0.01
    ]
    negative_factors = [
        c.feature.replace("_", " ") for c in contributions if c.direction == "negative"
    ]

    result = PredictionResult(
        risk_score=effective_risk,
        risk_level=risk_level,
        fraud_probability=round(fraud_probability, 4),
        rule_score=round(rule_score, 2),
        ml_score=round(ml_score, 2),
        explanation="",
        prediction=prediction_label,
        confidence_score=confidence_score,
        model_used="django-hybrid-v1 (rule-engine + logistic-regression)",
        positive_factors=positive_factors,
        negative_factors=negative_factors,
        recommendations=[],
        triggered_rules=rule_results,
        feature_contributions=contributions,
        extracted_features={
            "urgency_score": features["urgency_score"],
            "too_good_score": features["too_good_score"],
            "fraud_keyword_score": features["fraud_keyword_score"],
            "grammar_quality": features["grammar_quality"],
            "entity_density": features["entity_density"],
            "readability": features["readability"],
            "salary_anomaly": features["salary_anomaly"],
            "website_trust": features["website_trust"],
            "desc_word_count": features["desc_word_count"],
            "entity_count": len(features["entities"]),
        },
    )

    result.explanation = generate_explanation(result)
    result.recommendations = generate_recommendations(result)

    return result
