// Builds quiz questions from the plain text of a reviewer file.
//
// Everything runs in the browser: no AI service is called and the text never leaves the device.
// The questions are made with simple language rules (definitions, key terms, numbers, names), so
// they are only as good as the file's text. The game always shows the sentence an answer came from.
//
//   const analysis = analyzeText(text);                       // once per file
//   const { questions, available } = buildQuiz(analysis, { count: 10, types: [...] });
//
// Question shapes (all have id, type, prompt, body, source, points):
//   mcq            options[4], answer (the correct option text)
//   tf             answer (true / false)
//   identification answer + accept[] + hint   (typed)
//   blank          answer + accept[] + hint   (typed)

export const QUESTION_TYPES = {
  mcq: 'Multiple choice',
  tf: 'True or False',
  identification: 'Identification',
  blank: 'Fill in the blank',
};

export const TYPE_IDS = Object.keys(QUESTION_TYPES);

const STOPWORDS = new Set((
  'a about above after again against all also am an and any are as at be because been before being below between both but by ' +
  'can could did do does doing down during each few for from further had has have having he her here hers him his how i if in into is it its ' +
  'just me more most my no nor not of off on once only or other our out over own same she should so some such than that the their them then ' +
  'there these they this those through to too under until up very was we were what when where which while who whom why will with would you your ' +
  'may might must shall however therefore thus hence include includes included including called known used using use based many much ' +
  // a few common Filipino function words, for reviewers written in Filipino
  'ang ng sa na at ay mga para ito iyon ni kay kung ay din rin lamang pang nang'
).split(' '));

const PRONOUN_STARTS = new Set([
  'it', 'this', 'that', 'these', 'those', 'there', 'he', 'she', 'they', 'we', 'you', 'i', 'what', 'which', 'who', 'when', 'where', 'why', 'how',
]);

const NAME_CONNECTORS = new Set(['of', 'de', 'del', 'the', 'and', 'for', 'in']);

const HEADING_WORDS = /^(?:chapter|unit|module|lesson|topic|part|section|week|day|figure|table|page|objectives?|note|example|reminder|summary|review|quiz|activity|outline|agenda|references?)\b/i;

// Verbs that show a "term" is really the start of a sentence ("Fermentation occurs when ...").
const SENTENCE_VERBS = new Set(('occurs occur takes take happens happen produces produce contains contain has have had was were will can could does did ' +
  'results result allows allow requires require provides provide causes cause makes make gives give needs need shows show begins begin ends end ' +
  'consists consist involves involve uses becomes become forms form helps help').split(' '));

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTH_SET = new Set(MONTHS.map((m) => m.toLowerCase()));

const ABBREVIATION_END = /\b(?:e\.g|i\.e|etc|vs|dr|mr|mrs|ms|prof|fig|no|st|inc|approx|sec|vol)\.$/i;
const NAME_INITIAL_END = /\b\p{Lu}\p{L}+\s\p{Lu}\.$/u; // "Jose P." continues with the surname

const TOKEN_RE = /\d+(?:,\d{3})*(?:\.\d+)?%?|\p{L}[\p{L}'’-]*/gu;

const DEFINITION_RE = new RegExp(
  '^(?:an?\\s+|the\\s+)?([\\p{L}][\\p{L}0-9\'’ /()-]{2,60}?)\\s+' +
    '(?:is defined as|are defined as|can be defined as|is known as|are known as|is called|are called|is the term for|refers to|refer to|means|is|are)\\s+' +
    '(.{20,})$',
  'iu'
);

const COLON_DEFINITION_RE = /^([\p{Lu}][\p{L}0-9'’ /()-]{2,50}):\s+(.{20,})$/u;

/* ---------------- Small helpers ---------------- */

// Seeded random numbers, so a game can be rebuilt (or replayed) from one number.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(items, rng) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const capitalize = (text) => (text ? text[0].toUpperCase() + text.slice(1) : text);

const clean = (text) => text.replace(/\s+/g, ' ').trim();

/* ---------------- Reading the text ---------------- */

// Lines -> segments (a wrapped paragraph becomes one segment; headings and bullets stay separate).
function toSegments(raw) {
  const lines = String(raw || '')
    .replace(/\r/g, '')
    .replace(/-\n(?=\p{Ll})/gu, '')
    .split(/\n+/)
    .map((line) => line.replace(/^[\s•▪●◦○■□–—*-]+/u, '').replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const merged = [];
  lines.forEach((line) => {
    const previous = merged[merged.length - 1];
    if (previous && !/[.!?:;]$/.test(previous) && /^[\p{Ll}(]/u.test(line)) {
      merged[merged.length - 1] = `${previous} ${line}`;
    } else {
      merged.push(line);
    }
  });

  return merged;
}

function splitSentences(segment) {
  const parts = segment.split(/(?<=[.!?])\s+(?=["“'(]?[\p{Lu}0-9])/u);
  const sentences = [];

  parts.forEach((part) => {
    const previous = sentences[sentences.length - 1];
    if (previous && (ABBREVIATION_END.test(previous) || NAME_INITIAL_END.test(previous))) sentences[sentences.length - 1] = `${previous} ${part}`;
    else sentences.push(part);
  });

  return sentences.map(clean);
}

function isUsableSentence(sentence) {
  const words = sentence.split(' ');
  if (sentence.length < 35 || sentence.length > 240) return false;
  if (words.length < 6 || words.length > 36) return false;
  if (/(https?:\/\/|www\.|\S+@\S+\.\S+)/i.test(sentence)) return false;

  const letters = (sentence.match(/\p{L}/gu) || []).length;
  if (letters / sentence.length < 0.6) return false; // tables, numbers, symbols

  const upper = (sentence.match(/\p{Lu}/gu) || []).length;
  if (upper / Math.max(letters, 1) > 0.5) return false; // SHOUTED headings

  if (/^(page|slide|figure|table|chapter|copyright|©)\b/i.test(sentence)) return false;
  if (/\bpage \d+\b|\b\d+ of \d+\b/i.test(sentence)) return false;

  return true;
}

function tokenize(sentence) {
  return [...sentence.matchAll(TOKEN_RE)].map((m) => ({
    text: m[0],
    lower: m[0].toLowerCase(),
    start: m.index,
    end: m.index + m[0].length,
    isNumber: /^\d/.test(m[0]),
    isCapital: /^\p{Lu}/u.test(m[0]),
  }));
}

/* ---------------- Definitions ---------------- */

function cleanTerm(rawTerm) {
  const term = clean(rawTerm).replace(/^(?:an?|the)\s+/i, '');
  if (!term || term.includes(',')) return null;

  const words = term.split(' ');
  if (words.length > 6) return null;
  if (PRONOUN_STARTS.has(words[0].toLowerCase())) return null;
  if (STOPWORDS.has(term.toLowerCase())) return null;
  if (HEADING_WORDS.test(term) || /^\d/.test(term)) return null;

  const lowerWords = words.map((w) => w.toLowerCase());
  if (lowerWords.some((w) => SENTENCE_VERBS.has(w) || (STOPWORDS.has(w) && !NAME_CONNECTORS.has(w)))) return null;

  return capitalize(term);
}

function findDefinition(text, sourceId) {
  const colon = text.match(COLON_DEFINITION_RE);
  const match = colon || text.match(DEFINITION_RE);
  if (!match) return null;

  const term = cleanTerm(match[1]);
  if (!term) return null;

  let definition = clean(match[2]).replace(/[.;]+$/, '');
  if (definition.split(' ').length < 4) return null;

  const defLetters = (definition.match(/\p{L}/gu) || []).length || 1;
  if ((definition.match(/\p{Lu}/gu) || []).length / defLetters > 0.5) return null; // an ALL-CAPS heading

  // Never print the answer inside the clue.
  const leak = new RegExp(`\\b${escapeRegExp(term.replace(/\s*\([^)]*\)/g, ''))}\\b`, 'gi');
  definition = definition.replace(leak, '_____');

  return { sourceId, term, definition: capitalize(definition), source: text };
}

/* ---------------- Key terms in one sentence ---------------- */

function wordFrequencies(sentences) {
  const counts = new Map();

  sentences.forEach((sentence) => {
    const seen = new Set();
    tokenize(sentence.text).forEach((token) => {
      if (!token.isNumber) seen.add(token.lower);
    });
    seen.forEach((word) => counts.set(word, (counts.get(word) || 0) + 1));
  });

  return counts;
}

function findCandidates(sentence, frequencies) {
  const tokens = tokenize(sentence);
  const candidates = [];
  const covered = new Set();

  // Names: runs of capitalised words ("Jose Rizal", "Battle of Manila", "ATP").
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (token.isNumber || !token.isCapital || STOPWORDS.has(token.lower)) continue;

    const joinedBySpaces = (a, b) => /^\s+$/.test(sentence.slice(tokens[a].end, tokens[b].start));

    let end = i;
    while (end + 1 < tokens.length) {
      const next = tokens[end + 1];
      if (!next.isNumber && next.isCapital && !STOPWORDS.has(next.lower) && joinedBySpaces(end, end + 1)) end += 1;
      else if (
        NAME_CONNECTORS.has(next.lower) && joinedBySpaces(end, end + 1) &&
        tokens[end + 2]?.isCapital && !tokens[end + 2].isNumber && joinedBySpaces(end + 1, end + 2)
      ) end += 2;
      else break;
    }

    const length = end - i + 1;
    const startsSentence = i === 0;
    if (!(startsSentence && length === 1)) {
      const first = tokens[i];
      const last = tokens[end];
      const text = sentence.slice(first.start, last.end);
      const frequency = frequencies.get(token.lower) || 1;

      const kind = MONTH_SET.has(text.toLowerCase()) ? 'month' : 'name';
      candidates.push({ kind, text, start: first.start, end: last.end, index: i, score: (kind === 'month' ? 2.5 : 3) + Math.min(2, Math.log2(frequency)) });
    }

    for (let k = i; k <= end; k += 1) covered.add(k);
    i = end;
  }

  tokens.forEach((token, index) => {
    if (covered.has(index) || index === 0) return;

    if (token.isNumber) {
      if (token.text.length >= 2 || token.text.endsWith('%')) {
        candidates.push({ kind: 'number', text: token.text, start: token.start, end: token.end, index, score: 1.5 });
      }
      return;
    }

    const frequency = frequencies.get(token.lower) || 1;
    const long = token.text.length >= 9;
    if (token.text.length >= 6 && !STOPWORDS.has(token.lower) && !SENTENCE_VERBS.has(token.lower) && !token.isCapital && (frequency >= 2 || long)) {
      candidates.push({ kind: 'term', text: token.text, start: token.start, end: token.end, index, score: 2 + Math.min(2, Math.log2(frequency)) - (index < 2 ? 0.7 : 0) });
    }
  });

  return candidates;
}

/* ---------------- Analysis (done once per file) ---------------- */

export function analyzeText(rawText) {
  const segments = toSegments(rawText);
  const definitions = [];
  const sentences = [];
  const seen = new Set();

  segments.forEach((segment, segmentIndex) => {
    const colon = findDefinition(segment, `d${segmentIndex}`);
    if (colon && COLON_DEFINITION_RE.test(segment)) definitions.push(colon);

    splitSentences(segment).forEach((text) => {
      const key = text.toLowerCase();
      if (seen.has(key) || !isUsableSentence(text)) return;
      seen.add(key);

      const id = `s${sentences.length}`;
      sentences.push({ id, text });

      if (!COLON_DEFINITION_RE.test(segment)) {
        const found = findDefinition(text, id);
        if (found) definitions.push(found);
      }
    });
  });

  const frequencies = wordFrequencies(sentences);
  sentences.forEach((sentence) => {
    sentence.candidates = findCandidates(sentence.text, frequencies);
  });

  // Every word / number the document uses, grouped by kind, for wrong answers.
  const pools = { name: new Map(), term: new Map(), number: new Map(), month: new Map() };
  sentences.forEach((sentence) => {
    sentence.candidates.forEach((c) => {
      const key = c.text.toLowerCase();
      if (!pools[c.kind].has(key)) pools[c.kind].set(key, c.text);
    });
  });

  // De-duplicate definitions by term.
  const byTerm = new Map();
  definitions.forEach((d) => {
    const key = d.term.toLowerCase();
    if (!byTerm.has(key)) byTerm.set(key, d);
  });

  return { sentences, definitions: [...byTerm.values()], pools };
}

/* ---------------- Wrong answers ---------------- */

function numericVariants(text, rng) {
  const percent = text.endsWith('%');
  const raw = text.replace(/,/g, '').replace('%', '');
  const value = Number(raw);
  if (!Number.isFinite(value)) return [];

  const decimals = raw.includes('.') ? raw.split('.')[1].length : 0;
  const isYear = Number.isInteger(value) && value >= 1000 && value <= 2200;
  const offsets = isYear ? [-1, 1, -2, 2, -5, 5, -10, 10, -50, 50] : [-1, 1, -2, 2, 10, -10];
  const options = offsets.map((o) => value + o);

  if (!isYear) options.push(value * 2, Math.round(value / 2));

  return shuffle(options, rng)
    .filter((n) => n > 0 && n !== value)
    .map((n) => {
      const formatted = decimals ? n.toFixed(decimals) : String(Math.round(n));
      const withCommas = text.includes(',') ? Number(formatted).toLocaleString('en-US') : formatted;
      return percent ? `${withCommas}%` : withCommas;
    });
}

function pickDistractors(candidate, pools, rng, count = 3) {
  const answer = candidate.text.toLowerCase();
  const overlaps = (other) => {
    const o = other.toLowerCase();
    return o === answer || o.includes(answer) || answer.includes(o);
  };

  let options = [...pools[candidate.kind].values()].filter((value) => !overlaps(value));

  if (candidate.kind === 'month') {
    options = MONTHS.filter((month) => month.toLowerCase() !== answer);
  } else if (candidate.kind === 'name') {
    options = options.filter((value) => !MONTH_SET.has(value.toLowerCase()));
  }

  if (candidate.kind === 'number') {
    options = [...options, ...numericVariants(candidate.text, rng)];
    options = [...new Map(options.map((o) => [o.toLowerCase(), o])).values()];
  } else {
    // Prefer wrong answers that look like the right one (similar length), with some randomness.
    const words = (text) => text.split(' ').length;
    options = options
      .map((value) => ({
        value,
        weight: Math.abs(value.length - candidate.text.length) + 4 * Math.abs(words(value) - words(candidate.text)) + rng() * 4,
      }))
      .sort((a, b) => a.weight - b.weight)
      .map((entry) => entry.value);
  }

  const picked = candidate.kind === 'number' || candidate.kind === 'month' ? shuffle(options, rng) : options;
  const result = picked.slice(0, count);

  return result.length === count ? result : null;
}

/* ---------------- Turning text into questions ---------------- */

function replaceAnswer(sentence, answer, replacement) {
  const escaped = escapeRegExp(answer);
  const pattern = /^[\p{L}]/u.test(answer) && /[\p{L}]$/u.test(answer)
    ? new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, 'giu')
    : new RegExp(escaped, 'gi');

  return sentence.replace(pattern, replacement);
}

function typedHint(answer) {
  const letters = answer.replace(/[^\p{L}\p{N}]/gu, '').length;
  return `Starts with “${answer[0].toUpperCase()}” · ${letters} characters`;
}

function acceptedAnswers(answer) {
  const variants = new Set([answer]);
  const withoutAside = clean(answer.replace(/\s*\([^)]*\)/g, ''));
  if (withoutAside) variants.add(withoutAside);
  const aside = answer.match(/\(([^)]+)\)/);
  if (aside) variants.add(clean(aside[1]));
  return [...variants];
}

function bestCandidate(sentence) {
  return [...sentence.candidates].sort((a, b) => b.score - a.score)[0] || null;
}

function buildPools(analysis, rng) {
  const pools = { mcq: [], tf: [], identification: [], blank: [] };
  let counter = 0;
  const nextId = (type) => `${type}-${(counter += 1)}`;
  const termPool = analysis.definitions.map((d) => d.term);

  // Definition-based questions.
  analysis.definitions.forEach((definition) => {
    pools.identification.push({
      id: nextId('identification'),
      type: 'identification',
      sourceId: definition.sourceId,
      prompt: 'Identify the term described below.',
      body: definition.definition,
      answer: definition.term,
      accept: acceptedAnswers(definition.term),
      hint: typedHint(definition.term),
      source: definition.source,
    });

    const wrong = shuffle(termPool.filter((t) => t.toLowerCase() !== definition.term.toLowerCase()), rng).slice(0, 3);
    if (wrong.length === 3) {
      pools.mcq.push({
        id: nextId('mcq'),
        type: 'mcq',
        sourceId: definition.sourceId,
        prompt: 'Which term matches this definition?',
        body: definition.definition,
        options: shuffle([definition.term, ...wrong], rng),
        answer: definition.term,
        source: definition.source,
      });
    }
  });

  // Sentence-based questions.
  analysis.sentences.forEach((sentence) => {
    const candidate = bestCandidate(sentence);
    if (!candidate) return;

    const blanked = replaceAnswer(sentence.text, candidate.text, '_____');

    pools.blank.push({
      id: nextId('blank'),
      type: 'blank',
      sourceId: sentence.id,
      prompt: 'Type the missing word or number.',
      body: blanked,
      answer: candidate.text,
      accept: acceptedAnswers(candidate.text),
      hint: typedHint(candidate.text),
      source: sentence.text,
    });

    const wrong = pickDistractors(candidate, analysis.pools, rng);
    if (!wrong) return;

    pools.mcq.push({
      id: nextId('mcq'),
      type: 'mcq',
      sourceId: sentence.id,
      prompt: 'Choose the answer that completes the statement.',
      body: blanked,
      options: shuffle([candidate.text, ...wrong], rng),
      answer: candidate.text,
      source: sentence.text,
    });

    const isTrue = rng() < 0.5;
    pools.tf.push({
      id: nextId('tf'),
      type: 'tf',
      sourceId: sentence.id,
      prompt: 'True or False?',
      body: isTrue ? sentence.text : replaceAnswer(sentence.text, candidate.text, wrong[0]),
      answer: isTrue,
      source: sentence.text,
    });
  });

  Object.keys(pools).forEach((type) => {
    pools[type] = shuffle(pools[type], rng);
  });

  return pools;
}

// options: { count = 10, types = all, seed = random }
// returns { questions, available } where available[type] = how many of that type could be made.
export function buildQuiz(analysis, options = {}) {
  const count = Math.max(1, options.count || 10);
  const types = (options.types?.length ? options.types : TYPE_IDS).filter((t) => TYPE_IDS.includes(t));
  const seed = options.seed ?? Math.floor(Math.random() * 2 ** 31);
  const rng = mulberry32(seed);

  const pools = buildPools(analysis, rng);
  const available = Object.fromEntries(TYPE_IDS.map((type) => [type, pools[type].length]));

  const chosen = [];
  const usedSources = new Set();
  const usedIds = new Set();
  const cursor = Object.fromEntries(types.map((t) => [t, 0]));

  // Round-robin over the chosen types so the game mixes them, one question per source sentence.
  const takeRound = (allowSharedSource) => {
    let progressed = false;

    types.forEach((type) => {
      if (chosen.length >= count) return;

      while (cursor[type] < pools[type].length) {
        const question = pools[type][cursor[type]];
        cursor[type] += 1;

        if (usedIds.has(question.id)) continue;
        if (!allowSharedSource && usedSources.has(question.sourceId)) continue;

        usedIds.add(question.id);
        usedSources.add(question.sourceId);
        chosen.push(question);
        progressed = true;
        break;
      }
    });

    return progressed;
  };

  while (chosen.length < count && takeRound(false));

  // Not enough different sentences: allow a second question about the same sentence.
  if (chosen.length < count) {
    types.forEach((t) => { cursor[t] = 0; });
    while (chosen.length < count && takeRound(true));
  }

  const questions = shuffle(chosen, rng).map((question, index) => ({ ...question, number: index + 1, points: 100 }));

  return { questions, available, seed };
}

export function generateQuiz(text, options) {
  return buildQuiz(analyzeText(text), options);
}

/* ---------------- Checking answers ---------------- */

export function normalizeAnswer(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/(\d),(?=\d{3}\b)/g, '$1')
    .replace(/[^a-z0-9%.\s]/g, ' ')
    .replace(/(?<!\d)\.|\.(?!\d)/g, ' ')
    .replace(/\b(?:a|an|the)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function editDistance(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i += 1) {
    let previous = row[0];
    row[0] = i;

    for (let j = 1; j <= b.length; j += 1) {
      const temp = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = temp;
    }
  }

  return row[b.length];
}

export function isAnswerCorrect(question, response) {
  if (question.type === 'tf') return response === question.answer;
  if (question.type === 'mcq') return response === question.answer;

  const given = normalizeAnswer(response);
  if (!given) return false;

  return (question.accept || [question.answer]).some((accepted) => {
    const target = normalizeAnswer(accepted);
    if (!target) return false;
    if (given === target) return true;
    if (/\d/.test(target)) return false; // numbers must match exactly

    // A small typing slip is fine: 1 wrong letter, or 2 in long answers.
    const allowed = target.length >= 10 ? 2 : target.length >= 5 ? 1 : 0;
    return allowed > 0 && editDistance(given, target) <= allowed;
  });
}