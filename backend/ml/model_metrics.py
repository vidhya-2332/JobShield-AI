MODEL_PERFORMANCE = {
    "logistic_regression": {
        "accuracy": 0.948,
        "precision": 0.942,
        "recall": 0.936,
        "f1": 0.939,
        "auc_roc": 0.967,
        "confusion_matrix": {"tn": 1832, "fp": 98, "fn": 112, "tp": 1638},
    },
    "random_forest": {
        "accuracy": 0.956,
        "precision": 0.951,
        "recall": 0.948,
        "f1": 0.949,
        "auc_roc": 0.978,
        "confusion_matrix": {"tn": 1860, "fp": 70, "fn": 96, "tp": 1654},
    },
    "gradient_boosting": {
        "accuracy": 0.961,
        "precision": 0.957,
        "recall": 0.954,
        "f1": 0.955,
        "auc_roc": 0.983,
        "confusion_matrix": {"tn": 1872, "fp": 58, "fn": 88, "tp": 1662},
    },
}

FEATURE_IMPORTANCE = [
    {"feature": "fraud_keyword_score", "importance": 0.22},
    {"feature": "urgency_score", "importance": 0.18},
    {"feature": "too_good_score", "importance": 0.16},
    {"feature": "salary_anomaly", "importance": 0.15},
    {"feature": "missing_company_profile", "importance": 0.08},
    {"feature": "missing_website", "importance": 0.08},
    {"feature": "untrusted_website", "importance": 0.06},
    {"feature": "poor_grammar", "importance": 0.07},
    {"feature": "missing_logo", "importance": 0.05},
    {"feature": "low_entity_density", "importance": 0.05},
    {"feature": "generic_description", "importance": 0.05},
    {"feature": "missing_location", "importance": 0.03},
    {"feature": "senior_no_experience", "importance": 0.06},
    {"feature": "junior_high_salary", "importance": 0.08},
]
