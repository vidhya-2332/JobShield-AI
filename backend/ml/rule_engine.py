from .types import JobInput, RuleResult

RULES = [
    {"id": "missing_company_profile", "name": "Missing Company Profile", "weight": 15, "category": "metadata", "message": "No company profile URL provided."},
    {"id": "missing_website", "name": "Missing Company Website", "weight": 15, "category": "metadata", "message": "No company website provided."},
    {"id": "untrusted_website", "name": "Untrusted Website Domain", "weight": 10, "category": "metadata", "message": "Company website is not a recognized or trusted domain."},
    {"id": "missing_logo", "name": "Missing Company Logo", "weight": 10, "category": "metadata", "message": "No company logo provided."},
    {"id": "unrealistic_salary", "name": "Unrealistic Salary Range", "weight": 30, "category": "salary", "message": "Salary range is significantly outside expected range for this role."},
    {"id": "excessive_urgency", "name": "Excessive Urgency Language", "weight": 25, "category": "language", "message": "Job posting uses excessive urgency language."},
    {"id": "too_good_to_be_true", "name": "Too Good To Be True Language", "weight": 25, "category": "language", "message": "Job posting contains too-good-to-be-true promises."},
    {"id": "fraud_keywords", "name": "Fraud-Related Keywords", "weight": 35, "category": "content", "message": "Job posting contains known fraud-related keywords."},
    {"id": "senior_no_experience", "name": "Senior Role, No Experience Required", "weight": 15, "category": "content", "message": "Senior-level role with no experience requirements."},
    {"id": "senior_no_education", "name": "Senior Role, No Education Required", "weight": 10, "category": "content", "message": "Senior-level role with no education requirements."},
    {"id": "junior_high_salary", "name": "Junior Role, Unrealistic High Salary", "weight": 20, "category": "salary", "message": "Junior-level role with unusually high salary."},
    {"id": "generic_description", "name": "Generic/Vague Description", "weight": 10, "category": "content", "message": "Job description is too short or generic."},
    {"id": "low_entity_density", "name": "Low Named Entity Density", "weight": 10, "category": "content", "message": "Very few named entities (companies, people) detected."},
    {"id": "poor_grammar", "name": "Poor Grammar/Formatting", "weight": 12, "category": "language", "message": "Job posting has poor grammar or formatting quality."},
    {"id": "missing_location", "name": "Missing Job Location", "weight": 8, "category": "metadata", "message": "No job location provided."},
    {"id": "senior_no_benefits", "name": "Senior Role, No Benefits Mentioned", "weight": 8, "category": "content", "message": "Senior-level role with no benefits mentioned."},
]


def evaluate_rules(job: JobInput, features: dict) -> list[RuleResult]:
    results: list[RuleResult] = []
    for rule in RULES:
        triggered = _check_rule(rule["id"], job, features)
        results.append(RuleResult(
            rule_id=rule["id"],
            rule_name=rule["name"],
            triggered=triggered,
            weight=rule["weight"],
            category=rule["category"],
            message=rule["message"] if triggered else "",
        ))
    return results


def _check_rule(rule_id: str, job: JobInput, features: dict) -> bool:
    if rule_id == "missing_company_profile":
        return not features["has_company_profile"]
    if rule_id == "missing_website":
        return not job.website.strip()
    if rule_id == "untrusted_website":
        wt = features["website_trust"]
        return bool(job.website.strip()) and not wt["trusted"] and wt["reason"] != "missing"
    if rule_id == "missing_logo":
        return not features["has_company_logo"]
    if rule_id == "unrealistic_salary":
        return features["salary_anomaly"]["anomaly"]
    if rule_id == "excessive_urgency":
        return features["urgency_score"] > 0.3
    if rule_id == "too_good_to_be_true":
        return features["too_good_score"] > 0.3
    if rule_id == "fraud_keywords":
        return features["fraud_keyword_score"] > 0.2
    if rule_id == "senior_no_experience":
        title_lower = job.title.lower()
        is_senior = "senior" in title_lower or "lead" in title_lower or "principal" in title_lower
        return is_senior and not job.requirements.strip()
    if rule_id == "senior_no_education":
        title_lower = job.title.lower()
        is_senior = "senior" in title_lower or "lead" in title_lower or "principal" in title_lower
        return is_senior and "education" not in job.requirements.lower() and "degree" not in job.requirements.lower()
    if rule_id == "junior_high_salary":
        title_lower = job.title.lower()
        is_junior = "junior" in title_lower or "entry" in title_lower or "intern" in title_lower
        salary = job.salary
        return is_junior and salary is not None and salary > 80000
    if rule_id == "generic_description":
        return features["desc_word_count"] < 50
    if rule_id == "low_entity_density":
        return features["entity_density"] < 0.5
    if rule_id == "poor_grammar":
        return features["grammar_quality"] < 0.4
    if rule_id == "missing_location":
        return not features["has_location"]
    if rule_id == "senior_no_benefits":
        title_lower = job.title.lower()
        is_senior = "senior" in title_lower or "lead" in title_lower or "principal" in title_lower
        return is_senior and "benefit" not in job.description.lower()
    return False


def compute_rule_score(rule_results: list[RuleResult]) -> float:
    total = sum(r.weight for r in rule_results if r.triggered)
    return min(100, total)
