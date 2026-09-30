// Lightweight NLP pipeline — tokenization, stopword removal, lemmatization,
// POS tagging, NER, readability, and TF-IDF. Pure TypeScript, no deps.

const STOPWORDS = new Set([
  'a','an','the','and','or','but','if','then','else','when','at','by','for',
  'with','about','against','between','into','through','during','before','after',
  'above','below','to','from','up','down','in','out','on','off','over','under',
  'again','further','once','here','there','all','any','both','each','few','more',
  'most','other','some','such','no','nor','not','only','own','same','so','than',
  'too','very','can','will','just','should','now','is','are','was','were','be',
  'been','being','have','has','had','do','does','did','will','would','could',
  'may','might','must','shall','of','this','that','these','those','i','you',
  'he','she','it','we','they','them','his','her','its','our','their','my','your',
]);

const PUNCTUATION = /[.,/#!$%^&*;:{}=\-_`~()"'?<>|\\\[\]]/g;

const URGENCY_PHRASES = [
  'urgent hiring', 'immediate joining', 'apply today', 'hiring fast',
  'limited seats', 'apply now', 'immediate start', 'start immediately',
  'urgent requirement', 'urgent opening', 'join immediately', 'asap',
  'immediate hiring', 'closing soon', 'last date', 'hurry up', 'act now',
  'don\'t miss', 'limited time', 'only few', 'few seats left',
];

const TOO_GOOD_PHRASES = [
  'guaranteed job', 'guaranteed income', 'no experience needed',
  'no experience required', 'no experience necessary', 'unlimited income',
  'unlimited earning', 'easy money', 'earn money online', 'work from home',
  'get rich', 'quick money', 'fast money', 'make money fast',
  'earn weekly', 'earn daily', 'guaranteed placement', '100% placement',
  'sure placement', 'earn extra', 'be your own boss', 'financial freedom',
  'passive income', 'no skills required', 'anyone can apply',
  'no qualification', 'earn thousands', 'earn lakhs',
];

const FRAUD_KEYWORDS = [
  'registration fee', 'application fee', 'security deposit', 'training fee',
  'pay upfront', 'wire transfer', 'western union', 'moneygram', 'bitcoin',
  'cryptocurrency payment', 'gift card', 'personal check', 'cash check',
  'overpayment', 'reshipping', 'package forwarding', 'mystery shopper',
  'data entry clerk', 'envelope stuffing', 'craft assembly',
];

const COMMON_MISSPELLINGS: Record<string, string> = {
  'recieve': 'receive', 'seperate': 'separate', 'occured': 'occurred',
  'definately': 'definitely', 'accomodate': 'accommodate', 'neccessary': 'necessary',
  'tommorow': 'tomorrow', 'untill': 'until', 'wich': 'which', 'thier': 'their',
  'recieved': 'received', 'lenght': 'length', 'adress': 'address',
  'responsibilty': 'responsibility', 'experiance': 'experience',
  'managment': 'management', 'enviroment': 'environment', 'buisness': 'business',
  'opurtunity': 'opportunity', 'comitment': 'commitment', 'knowlege': 'knowledge',
};

const POS_SUFFIXES: { pos: string; suffixes: string[] }[] = [
  { pos: 'NN', suffixes: ['tion', 'ment', 'ness', 'ity', 'ship', 'ance', 'ence', 'ism', 'ist'] },
  { pos: 'VB', suffixes: ['ize', 'ise', 'ate', 'ify', 'ed', 'ing'] },
  { pos: 'JJ', suffixes: ['ful', 'less', 'ous', 'ive', 'able', 'ible', 'al', 'ic', 'ish'] },
  { pos: 'RB', suffixes: ['ly', 'wise'] },
];

export function normalize(text: string): string {
  return text.toLowerCase().replace(PUNCTUATION, ' ').replace(/\s+/g, ' ').trim();
}

export function tokenize(text: string): string[] {
  return normalize(text).split(' ').filter((w) => w.length > 1);
}

export function removeStopwords(tokens: string[]): string[] {
  return tokens.filter((t) => !STOPWORDS.has(t));
}

// Suffix-based lemmatization — approximates spaCy's lemmatizer for English.
export function lemmatize(word: string): string {
  const w = word.toLowerCase();
  if (w.length <= 3) return w;
  const rules: { suffix: string; replacement: string }[] = [
    { suffix: 'ies', replacement: 'y' },
    { suffix: 'ied', replacement: 'y' },
    { suffix: 'ying', replacement: 'y' },
    { suffix: 'ied', replacement: 'y' },
    { suffix: 'ches', replacement: 'ch' },
    { suffix: 'ses', replacement: 's' },
    { suffix: 'xes', replacement: 'x' },
    { suffix: 'zes', replacement: 'z' },
    { suffix: 'ing', replacement: '' },
    { suffix: 'edly', replacement: '' },
    { suffix: 'ed', replacement: '' },
    { suffix: 'ly', replacement: '' },
    { suffix: 'ment', replacement: '' },
    { suffix: 'ness', replacement: '' },
    { suffix: 'tion', replacement: 't' },
    { suffix: 's', replacement: '' },
  ];
  for (const r of rules) {
    if (w.endsWith(r.suffix) && w.length - r.suffix.length >= 3) {
      return w.slice(0, w.length - r.suffix.length) + r.replacement;
    }
  }
  return w;
}

// Suffix-based POS tagging — approximates NLTK's perceptron tagger.
export function posTag(tokens: string[]): { token: string; pos: string }[] {
  return tokens.map((token) => {
    const lower = token.toLowerCase();
    if (/^\d+([.,]\d+)?$/.test(lower)) return { token, pos: 'CD' };
    for (const group of POS_SUFFIXES) {
      if (group.suffixes.some((s) => lower.endsWith(s))) {
        return { token, pos: group.pos };
      }
    }
    if (STOPWORDS.has(lower)) return { token, pos: 'DT' };
    return { token, pos: 'NN' };
  });
}

// Heuristic NER — capitalized tokens + org/edu suffixes in the original text.
export function namedEntities(text: string): string[] {
  const entities: string[] = [];
  const tokens = text.match(/\b[A-Z][a-zA-Z]+\b/g) || [];
  const seen = new Set<string>();
  for (const t of tokens) {
    if (seen.has(t)) continue;
    seen.add(t);
    if (t.length > 2 && !STOPWORDS.has(t.toLowerCase())) {
      entities.push(t);
    }
  }
  // Multi-word org names ending in a suffix
  const orgPattern = /([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)\s+(Inc|LLC|Corp|Corporation|Company|Co|Ltd|Group|Solutions|Technologies|Systems|Services|University|Institute)/g;
  let m: RegExpExecArray | null;
  while ((m = orgPattern.exec(text)) !== null) {
    entities.push(`${m[1]} ${m[2]}`);
  }
  return entities;
}

export function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  const matches = w.match(/[aeiouy]+/g);
  let count = matches ? matches.length : 0;
  if (w.endsWith('e')) count = Math.max(count - 1, 1);
  return Math.max(count, 1);
}

// Flesch Reading Ease approximation.
export function readability(text: string): number {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const words = tokenize(text);
  if (sentences.length === 0 || words.length === 0) return 50;
  const totalSyllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
  const score = 206.835 - 1.015 * (words.length / sentences.length) - 84.6 * (totalSyllables / words.length);
  return Math.max(0, Math.min(100, score));
}

export function grammarQuality(text: string): number {
  const tokens = tokenize(text);
  if (tokens.length === 0) return 50;
  const lower = text.toLowerCase();
  let misspelled = 0;
  for (const bad of Object.keys(COMMON_MISSPELLINGS)) {
    if (lower.includes(bad)) misspelled += 1;
  }
  // Excessive capitalization / all-caps words signal low quality.
  const allCaps = (text.match(/\b[A-Z]{3,}\b/g) || []).length;
  const capsRatio = tokens.length > 0 ? allCaps / tokens.length : 0;
  // Repeated exclamation / question marks.
  const repeatedPunct = (text.match(/(!{2,}|\?{2,})/g) || []).length;
  let score = 100;
  score -= misspelled * 8;
  score -= capsRatio * 40;
  score -= repeatedPunct * 5;
  return Math.max(0, Math.min(100, score));
}

export function lexicalDiversity(tokens: string[]): number {
  if (tokens.length === 0) return 0;
  return new Set(tokens).size / tokens.length;
}

export function detectPhrases(text: string, phrases: string[]): string[] {
  const lower = text.toLowerCase();
  return phrases.filter((p) => lower.includes(p));
}

export function urgencyScore(text: string): { score: number; matches: string[] } {
  const matches = detectPhrases(text, URGENCY_PHRASES);
  const score = Math.min(1, matches.length / 3);
  return { score, matches };
}

export function tooGoodToBeTrueScore(text: string): { score: number; matches: string[] } {
  const matches = detectPhrases(text, TOO_GOOD_PHRASES);
  const score = Math.min(1, matches.length / 3);
  return { score, matches };
}

export function fraudKeywordMatches(text: string): string[] {
  return detectPhrases(text, FRAUD_KEYWORDS);
}

// Lightweight TF-IDF over a single document against a small fraud-corpus reference.
const FRAUD_CORPUS_TERMS = new Set([
  'urgent', 'immediate', 'guaranteed', 'unlimited', 'easy', 'money', 'fee',
  'deposit', 'payment', 'wire', 'transfer', 'bitcoin', 'crypto', 'rich',
  'fast', 'quick', 'income', 'earning', 'weekly', 'daily', 'home', 'online',
  'no experience', 'no skills', 'anyone', 'opportunity', 'position', 'apply',
  'limited', 'seats', 'hurry', 'act', 'now', 'registration', 'security',
  'check', 'cash', 'gift', 'card', 'reshipping', 'mystery', 'shopper',
]);

export function tfidfTopTerms(text: string, k = 10): { term: string; score: number }[] {
  const tokens = removeStopwords(tokenize(text)).map(lemmatize);
  if (tokens.length === 0) return [];
  const tf = new Map<string, number>();
  for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1);
  const total = tokens.length;
  const scored: { term: string; score: number }[] = [];
  for (const [term, count] of tf.entries()) {
    const tfVal = count / total;
    // IDF approximation: fraud-corpus terms get higher weight.
    const idf = FRAUD_CORPUS_TERMS.has(term) ? 2.2 : 1.0;
    scored.push({ term, score: tfVal * idf });
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, k);
}

export function namedEntityDensity(text: string): number {
  const entities = namedEntities(text);
  const words = tokenize(text);
  if (words.length === 0) return 0;
  return entities.length / words.length;
}

export function posDistribution(tokens: string[]): Record<string, number> {
  const tagged = posTag(tokens);
  const dist: Record<string, number> = {};
  for (const { pos } of tagged) {
    dist[pos] = (dist[pos] || 0) + 1;
  }
  const total = tagged.length || 1;
  for (const k of Object.keys(dist)) dist[k] = dist[k] / total;
  return dist;
}

export interface NlpResult {
  tokens: string[];
  cleanTokens: string[];
  lemmas: string[];
  posTags: { token: string; pos: string }[];
  entities: string[];
  wordCount: number;
  sentenceCount: number;
  avgSentenceLength: number;
  lexicalDiversity: number;
  namedEntityDensity: number;
  grammarQualityScore: number;
  readabilityScore: number;
  urgencyScore: number;
  urgencyMatches: string[];
  tooGoodToBeTrueScore: number;
  tooGoodMatches: string[];
  fraudKeywordMatches: string[];
  tfidfTopTerms: { term: string; score: number }[];
  posDistribution: Record<string, number>;
}

export function runNlp(text: string): NlpResult {
  const tokens = tokenize(text);
  const cleanTokens = removeStopwords(tokens);
  const lemmas = cleanTokens.map(lemmatize);
  const posTags = posTag(tokens);
  const entities = namedEntities(text);
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const urg = urgencyScore(text);
  const tgt = tooGoodToBeTrueScore(text);
  return {
    tokens,
    cleanTokens,
    lemmas,
    posTags,
    entities,
    wordCount: tokens.length,
    sentenceCount: sentences.length,
    avgSentenceLength: sentences.length ? tokens.length / sentences.length : 0,
    lexicalDiversity: lexicalDiversity(tokens),
    namedEntityDensity: namedEntityDensity(text),
    grammarQualityScore: grammarQuality(text),
    readabilityScore: readability(text),
    urgencyScore: urg.score,
    urgencyMatches: urg.matches,
    tooGoodToBeTrueScore: tgt.score,
    tooGoodMatches: tgt.matches,
    fraudKeywordMatches: fraudKeywordMatches(text),
    tfidfTopTerms: tfidfTopTerms(text),
    posDistribution: posDistribution(tokens),
  };
}
