/**
 * Content Normalization Engine for Parmaga Platform (2026 - 2027)
 * Ensures 100% schema compatibility across all 23 lessons and final mock exams.
 */

export interface NormalizedQuestion {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  ministerialRef?: string;
  marks: number;
  category?: string;
  difficulty?: string;
}

export interface NormalizedFlashcard {
  id: string;
  front: string;
  back: string;
  hint?: string;
  category?: string;
}

/**
 * Normalizes any raw question format from the 2,550-question bank into canonical schema.
 * Handles:
 * - options: string[] OR object { A: '...', B: '...', C: '...', D: '...' }
 * - answer: number OR string ('A', 'B', 'C', 'D' or option text)
 * - field variations: answerIndex, answer, correctAnswer, correct_answer
 */
export function normalizeQuestion(raw: any, fallbackIndex: number = 0): NormalizedQuestion {
  if (!raw || typeof raw !== 'object') {
    return {
      id: `q_${fallbackIndex}`,
      question: 'السؤال قيد المراجعة',
      options: ['خيار أ', 'خيار ب', 'خيار ج', 'خيار د'],
      answerIndex: 0,
      explanation: 'لا يتوفر تفسير إضافي.',
      marks: 1
    };
  }

  // 1. Normalize options
  let options: string[] = [];
  if (Array.isArray(raw.options)) {
    options = raw.options.map(opt => String(opt || '').trim());
  } else if (raw.options && typeof raw.options === 'object') {
    if (raw.options.A !== undefined || raw.options.B !== undefined) {
      options = [raw.options.A, raw.options.B, raw.options.C, raw.options.D]
        .filter(x => x !== undefined)
        .map(opt => String(opt || '').trim());
    } else {
      options = Object.values(raw.options).map(opt => String(opt || '').trim());
    }
  }

  // If options are missing or incomplete, provide minimal fallback
  if (options.length < 2) {
    options = ['صواب', 'خطأ'];
  }

  // 2. Normalize correct answer index
  let answerIndex = 0;
  const rawAns = raw.answerIndex ?? raw.answer ?? raw.correctAnswer ?? raw.correct_answer;

  if (typeof rawAns === 'number') {
    answerIndex = Math.floor(rawAns);
  } else if (typeof rawAns === 'string') {
    const trimmed = rawAns.trim().toUpperCase();
    if (trimmed === 'A') answerIndex = 0;
    else if (trimmed === 'B') answerIndex = 1;
    else if (trimmed === 'C') answerIndex = 2;
    else if (trimmed === 'D') answerIndex = 3;
    else if (!isNaN(Number(trimmed))) {
      answerIndex = Number(trimmed);
    } else {
      // Try matching by exact option string
      const matchedIdx = options.findIndex(opt => opt === rawAns.trim());
      if (matchedIdx !== -1) {
        answerIndex = matchedIdx;
      }
    }
  }

  // Ensure answerIndex is safely bounded within options range
  if (answerIndex < 0 || answerIndex >= options.length) {
    answerIndex = 0;
  }

  return {
    id: String(raw.id || raw.question_id || `q_${fallbackIndex}`),
    question: String(raw.question || '').trim(),
    options,
    answerIndex,
    explanation: String(raw.explanation || 'تم اعتماد هذا السؤال وفق المعايير الوزارية لمنهج علوم البيانات.').trim(),
    ministerialRef: raw.ministerialRef || raw.difficulty || raw.topic || raw.concept || raw.source_unit,
    marks: Number(raw.marks) || 1,
    category: raw.category || raw.topic,
    difficulty: raw.difficulty || 'متوسط'
  };
}

/**
 * Normalizes an entire array of raw questions.
 */
export function normalizeQuestionBank(rawList: any[]): NormalizedQuestion[] {
  if (!Array.isArray(rawList)) return [];
  return rawList.map((item, idx) => normalizeQuestion(item, idx));
}

/**
 * Normalizes raw flashcard records from the 460-flashcard collection into canonical schema.
 * Handles:
 * - front: front OR frontQuestion OR term
 * - back: back OR backAnswer OR definition
 * - hint: hint OR mnemonic OR importance
 * - category: category OR topic OR term
 */
export function normalizeFlashcard(raw: any, fallbackIndex: number = 0): NormalizedFlashcard {
  if (!raw || typeof raw !== 'object') {
    return {
      id: `card_${fallbackIndex}`,
      front: 'مفهوم دراسي',
      back: 'الشرح التوضيحي للبطاقة'
    };
  }

  const front = String(raw.front || raw.frontQuestion || raw.term || 'سؤال استرجاع سريع').trim();
  const back = String(raw.back || raw.backAnswer || raw.definition || 'الإجابة النموذجية').trim();

  return {
    id: String(raw.id || `card_${fallbackIndex}`),
    front,
    back,
    hint: raw.hint || raw.mnemonic || raw.importance,
    category: raw.category || raw.topic || (raw.term ? 'مفاهيم أساسية' : undefined)
  };
}

/**
 * Normalizes an entire array of raw flashcards.
 */
export function normalizeFlashcardDeck(rawList: any[]): NormalizedFlashcard[] {
  if (!Array.isArray(rawList)) return [];
  return rawList.map((item, idx) => normalizeFlashcard(item, idx));
}
