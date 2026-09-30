import re
from .nlp import (
    tokenize, lemmatize_tokens, pos_tag, extract_named_entities,
    compute_tfidf, compute_readability, compute_grammar_quality,
    compute_urgency_score, compute_too_good_score, compute_fraud_keyword_score,
    compute_entity_density,
)
from .types import JobInput

SALARY_DATA = {
    "software engineer": {"p25": 85000, "median": 120000, "p75": 160000},
    "senior software engineer": {"p25": 130000, "median": 170000, "p75": 220000},
    "data scientist": {"p25": 95000, "median": 130000, "p75": 180000},
    "data analyst": {"p25": 55000, "median": 75000, "p75": 100000},
    "product manager": {"p25": 100000, "median": 140000, "p75": 190000},
    "marketing manager": {"p25": 70000, "median": 95000, "p75": 130000},
    "sales representative": {"p25": 40000, "median": 60000, "p75": 90000},
    "customer service": {"p25": 30000, "median": 40000, "p75": 55000},
    "graphic designer": {"p25": 40000, "median": 55000, "p75": 75000},
    "administrative assistant": {"p25": 35000, "median": 45000, "p75": 60000},
    "project manager": {"p25": 75000, "median": 105000, "p75": 145000},
    "business analyst": {"p25": 65000, "median": 85000, "p75": 120000},
    "devops engineer": {"p25": 100000, "median": 135000, "p75": 180000},
    "frontend developer": {"p25": 70000, "median": 100000, "p75": 140000},
    "backend developer": {"p25": 80000, "median": 115000, "p75": 155000},
    "fullstack developer": {"p25": 85000, "median": 120000, "p75": 165000},
    "ux designer": {"p25": 65000, "median": 90000, "p75": 130000},
    "ui designer": {"p25": 60000, "median": 80000, "p75": 115000},
    "financial analyst": {"p25": 60000, "median": 85000, "p75": 120000},
    "accountant": {"p25": 50000, "median": 65000, "p75": 90000},
}

TRUSTED_DOMAINS = frozenset([
    "linkedin.com", "indeed.com", "glassdoor.com", "monster.com",
    "google.com", "microsoft.com", "apple.com", "amazon.com",
    "facebook.com", "meta.com", "netflix.com", "tesla.com",
    "github.com", "gitlab.com", "oracle.com", "ibm.com",
    "salesforce.com", "adobe.com", "intel.com", "cisco.com",
])


def get_role_salary_data(title: str) -> dict | None:
    title_lower = title.lower().strip()
    for role, data in SALARY_DATA.items():
        if role in title_lower:
            return data
    return None


def detect_salary_anomaly(salary_min: int | None, salary_max: int | None, title: str) -> dict:
    salary_data = get_role_salary_data(title)
    if not salary_data or (salary_min is None and salary_max is None):
        return {"anomaly": False, "reason": "no_data", "expected_range": None}

    expected = salary_data
    check_salary = salary_max if salary_max else salary_min

    if check_salary is None:
        return {"anomaly": False, "reason": "no_salary", "expected_range": expected}

    if check_salary > expected["p75"] * 2:
        return {"anomaly": True, "reason": "too_high", "expected_range": expected}
    if check_salary < expected["p25"] * 0.3:
        return {"anomaly": True, "reason": "too_low", "expected_range": expected}

    return {"anomaly": False, "reason": "normal", "expected_range": expected}


def check_website_trust(website: str) -> dict:
    if not website:
        return {"trusted": False, "reason": "missing"}
    domain = re.sub(r"^https?://(www\.)?", "", website).split("/")[0].lower()
    if domain in TRUSTED_DOMAINS:
        return {"trusted": True, "reason": "known_domain"}
    if domain.endswith(".gov") or domain.endswith(".edu"):
        return {"trusted": True, "reason": "gov_edu"}
    if len(domain.split(".")) < 2:
        return {"trusted": False, "reason": "invalid_domain"}
    return {"trusted": False, "reason": "unknown_domain"}


def extract_features(job: JobInput) -> dict:
    full_text = f"{job.title} {job.description} {job.requirements}"
    tokens = tokenize(full_text)
    lemmas = lemmatize_tokens(tokens)
    pos_tags = pos_tag(tokens)
    entities = extract_named_entities(full_text)
    tfidf = compute_tfidf(tokens)
    readability = compute_readability(full_text)
    grammar = compute_grammar_quality(full_text)
    urgency = compute_urgency_score(full_text)
    too_good = compute_too_good_score(full_text)
    fraud_keywords = compute_fraud_keyword_score(full_text)
    entity_density = compute_entity_density(full_text)

    salary_anomaly = detect_salary_anomaly(job.salary, job.salary, job.title)
    website_trust = check_website_trust(job.website)

    return {
        "tokens": tokens[:200],
        "lemmas": lemmas[:200],
        "pos_tags": pos_tags[:100],
        "entities": entities[:50],
        "tfidf": dict(list(tfidf.items())[:100]),
        "readability": readability,
        "grammar_quality": grammar,
        "urgency_score": urgency,
        "too_good_score": too_good,
        "fraud_keyword_score": fraud_keywords,
        "entity_density": entity_density,
        "salary_anomaly": salary_anomaly,
        "website_trust": website_trust,
        "has_company_profile": bool(job.company_profile.strip()),
        "has_company_logo": bool(job.company_logo_url.strip()),
        "has_questions": bool(job.questions.strip()),
        "has_requirements": len(job.requirements.split()) > 10,
        "has_location": bool(job.location.strip()),
        "has_employment_type": bool(job.employment_type.strip()),
        "desc_word_count": len(job.description.split()),
        "req_word_count": len(job.requirements.split()),
        "full_text_length": len(full_text),
    }
