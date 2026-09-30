from .types import PredictionResult


def generate_explanation(result: PredictionResult) -> str:
    parts: list[str] = []

    if result.risk_level == "critical":
        parts.append("This job posting shows critical risk indicators and is very likely fraudulent.")
    elif result.risk_level == "high":
        parts.append("This job posting shows multiple high-risk indicators commonly associated with fraudulent postings.")
    elif result.risk_level == "medium":
        parts.append("This job posting shows some risk indicators that warrant caution.")
    else:
        parts.append("This job posting appears legitimate based on available indicators.")

    triggered = [r for r in result.triggered_rules if r.triggered]
    if triggered:
        top_rules = sorted(triggered, key=lambda r: r.weight, reverse=True)[:3]
        rule_names = ", ".join(r.rule_name for r in top_rules)
        parts.append(f"Key risk factors: {rule_names}.")

    positive = [c for c in result.feature_contributions if c.direction == "positive" and c.contribution > 0.01]
    if positive:
        top_pos = positive[:2]
        pos_names = ", ".join(c.feature.replace("_", " ") for c in top_pos)
        parts.append(f"Contributing factors: {pos_names}.")

    negative = [c for c in result.feature_contributions if c.direction == "negative"]
    if negative and result.risk_level in ("low", "medium"):
        neg_names = ", ".join(c.feature.replace("_", " ") for c in negative[:2])
        parts.append(f"Legitimacy indicators: {neg_names}.")

    return " ".join(parts)


def generate_recommendations(result: PredictionResult) -> list[str]:
    recs: list[str] = []
    triggered_ids = {r.rule_id for r in result.triggered_rules if r.triggered}

    if "fraud_keywords" in triggered_ids:
        recs.append("This posting contains known fraud-related keywords. Do not share personal or financial information.")
    if "unrealistic_salary" in triggered_ids or "junior_high_salary" in triggered_ids:
        recs.append("The salary range is unusually high for this role. Verify the salary directly with the company.")
    if "excessive_urgency" in triggered_ids:
        recs.append("The posting uses excessive urgency language. Legitimate employers rarely pressure candidates to apply immediately.")
    if "too_good_to_be_true" in triggered_ids:
        recs.append("The posting makes unrealistic promises. Be cautious of opportunities that seem too good to be true.")
    if "missing_company_profile" in triggered_ids or "missing_website" in triggered_ids:
        recs.append("No verifiable company information found. Research the company independently before proceeding.")
    if "untrusted_website" in triggered_ids:
        recs.append("The company website is not a recognized domain. Verify the company through official channels.")
    if "senior_no_experience" in triggered_ids:
        recs.append("A senior role with no experience requirements is unusual. Question the legitimacy of the position.")
    if "poor_grammar" in triggered_ids:
        recs.append("Poor grammar and formatting may indicate a scam. Legitimate postings are typically well-written.")
    if "missing_location" in triggered_ids:
        recs.append("No job location provided. Confirm where the work will be performed.")

    if not recs and result.risk_level in ("low", "medium"):
        recs.append("No major red flags detected. Still, verify the company and role before sharing sensitive information.")

    if result.risk_level in ("high", "critical"):
        recs.append("Do NOT send money, gift cards, or banking information. Report this posting to the platform.")

    return recs
