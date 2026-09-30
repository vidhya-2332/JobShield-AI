import re
import math
from collections import Counter

STOPWORDS = frozenset("""
a an the and or but if then else when at by for with about against between into
through during before after above below to from up down in out on off over under
again further once here there all any both each few more most other some such no
nor not only own same so than too very s t can will just don should now is are was
were be been being have has had do does did doing would should could ought i me my
we our ours you your he him his she her hers it its they them their what which who
whom this that these those am is are was were be been being have has had do does
did having would should could must shall may might can need
""".split())

LEMMATIZATION_RULES = {
    "ing": "", "ed": "", "ly": "", "ies": "y", "es": "", "s": "",
    "ment": "", "ness": "", "tion": "t", "able": "", "ible": "",
    "al": "", "er": "", "est": "", "ful": "", "less": "",
}

FRAUD_KEYWORDS = frozenset([
    "urgent", "immediate", "asap", "work from home", "easy money", "quick cash",
    "no experience", "entry level", "guaranteed", "risk free", "no risk",
    "unlimited", "be your own boss", "financial freedom", "make money",
    "earn money", "extra income", "passive income", "investment opportunity",
    "bitcoin", "cryptocurrency", "forex", "trading", "mlm", "network marketing",
    "pyramid", "commission only", "upfront fee", "registration fee",
    "processing fee", "wire transfer", "western union", "moneygram",
    "gift card", "paypal", "bitcoin wallet", "crypto wallet",
    "wire money", "send money", "cash check", "deposit check",
    "overpayment", "refund", "mystery shopper", "secret shopper",
    "package forwarding", "reshipping", "work from home opportunity",
    "earn up to", "weekly pay", "immediate start", "apply now",
    "limited time", "act now", "don miss", "opportunity of a lifetime",
])

URGENCY_WORDS = frozenset([
    "urgent", "immediate", "asap", "immediately", "today", "now",
    "quickly", "hurry", "limited", "deadline", "expires", "last chance",
])

TOO_GOOD_WORDS = frozenset([
    "unlimited", "guaranteed", "easy", "simple", "effortless",
    "no experience", "no skills", "no education", "anyone can",
    "be your own boss", "financial freedom", "passive income",
    "get rich", "make money fast", "earn thousands", "six figure",
    "lucrative", "highly paid", "well paid", "top paying",
])


def tokenize(text: str) -> list[str]:
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    tokens = text.split()
    return [t for t in tokens if t and t not in STOPWORDS and len(t) > 1]


def lemmatize(word: str) -> str:
    for suffix, replacement in sorted(LEMMATIZATION_RULES.items(), key=lambda x: -len(x[0])):
        if word.endswith(suffix) and len(word) - len(suffix) >= 3:
            return word[: -len(suffix)] + replacement
    return word


def lemmatize_tokens(tokens: list[str]) -> list[str]:
    return [lemmatize(t) for t in tokens]


COMMON_NOUN_SUFFIXES = {"tion", "ment", "ness", "ity", "ance", "ence", "er", "or", "ist"}
COMMON_VERB_SUFFIXES = {"ing", "ed", "ize", "ise", "ate"}
COMMON_ADJ_SUFFIXES = {"ful", "less", "able", "ible", "ous", "ive", "al"}


def pos_tag(tokens: list[str]) -> list[tuple[str, str]]:
    results = []
    for token in tokens:
        if token.isdigit():
            results.append((token, "cd"))
        elif any(token.endswith(s) for s in COMMON_NOUN_SUFFIXES):
            results.append((token, "nn"))
        elif any(token.endswith(s) for s in COMMON_VERB_SUFFIXES):
            results.append((token, "vb"))
        elif any(token.endswith(s) for s in COMMON_ADJ_SUFFIXES):
            results.append((token, "jj"))
        elif token in {"the", "a", "an"}:
            results.append((token, "dt"))
        elif token in {"is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did"}:
            results.append((token, "vb"))
        else:
            results.append((token, "nn"))
    return results


def extract_named_entities(text: str) -> list[dict]:
    entities = []
    words = re.findall(r"\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b", text)
    for w in words:
        if len(w) > 2 and w.lower() not in STOPWORDS:
            entity_type = "ORG" if any(
                kw in w.lower() for kw in ["inc", "corp", "llc", "ltd", "company", "group"]
            ) else "PERSON"
            entities.append({"text": w, "type": entity_type})
    return entities


def compute_tfidf(tokens: list[str], corpus_tokens: list[list[str]] | None = None) -> dict[str, float]:
    tf = Counter(tokens)
    total = len(tokens) or 1

    if corpus_tokens is None:
        corpus_tokens = [tokens]

    n_docs = len(corpus_tokens) or 1
    df: Counter = Counter()
    for doc in corpus_tokens:
        for term in set(doc):
            df[term] += 1

    result = {}
    for term, count in tf.items():
        tf_val = count / total
        idf_val = math.log((1 + n_docs) / (1 + df.get(term, 0)) + 1)
        result[term] = tf_val * idf_val
    return result


def compute_readability(text: str) -> dict:
    sentences = re.split(r"[.!?]+", text)
    sentences = [s.strip() for s in sentences if s.strip()]
    words = text.split()
    if not sentences or not words:
        return {"flesch_score": 0, "avg_sentence_length": 0, "avg_word_length": 0}

    total_words = len(words)
    total_sentences = len(sentences)
    total_syllables = sum(_count_syllables(w) for w in words)

    avg_sent_len = total_words / total_sentences
    avg_word_len = sum(len(w) for w in words) / total_words
    flesch = 206.835 - 1.015 * avg_sent_len - 84.6 * (total_syllables / total_words)
    flesch = max(0, min(100, flesch))

    return {
        "flesch_score": round(flesch, 2),
        "avg_sentence_length": round(avg_sent_len, 2),
        "avg_word_length": round(avg_word_len, 2),
    }


def _count_syllables(word: str) -> int:
    word = word.lower()
    count = 0
    vowels = "aeiouy"
    prev_vowel = False
    for ch in word:
        is_vowel = ch in vowels
        if is_vowel and not prev_vowel:
            count += 1
        prev_vowel = is_vowel
    if word.endswith("e") and count > 1:
        count -= 1
    return max(1, count)


def compute_grammar_quality(text: str) -> float:
    if not text or len(text) < 20:
        return 0.5
    sentences = re.split(r"[.!?]+", text)
    sentences = [s.strip() for s in sentences if s.strip()]
    if not sentences:
        return 0.5

    capital_issues = sum(1 for s in sentences if s and not s[0].isupper())
    excessive_caps = sum(1 for w in text.split() if w.isupper() and len(w) > 3)
    excessive_exclaim = text.count("!") > 3
    excessive_caps_ratio = excessive_caps / max(1, len(text.split()))

    penalty = (
        capital_issues / len(sentences) * 0.3
        + min(1, excessive_caps / 10) * 0.3
        + (0.2 if excessive_exclaim else 0)
        + min(1, excessive_caps_ratio) * 0.2
    )
    return round(max(0, 1 - penalty), 3)


def compute_urgency_score(text: str) -> float:
    tokens = tokenize(text)
    if not tokens:
        return 0
    matches = sum(1 for t in tokens if t in URGENCY_WORDS or any(u in t for u in URGENCY_WORDS))
    return round(min(1, matches / 5), 3)


def compute_too_good_score(text: str) -> float:
    tokens = tokenize(text)
    if not tokens:
        return 0
    matches = sum(1 for t in tokens if t in TOO_GOOD_WORDS or any(g in t for g in TOO_GOOD_WORDS))
    return round(min(1, matches / 5), 3)


def compute_fraud_keyword_score(text: str) -> float:
    text_lower = text.lower()
    matches = sum(1 for kw in FRAUD_KEYWORDS if kw in text_lower)
    return round(min(1, matches / 8), 3)


def compute_entity_density(text: str) -> float:
    entities = extract_named_entities(text)
    words = text.split()
    if not words:
        return 0
    return round(len(entities) / max(1, len(words) / 100), 3)
