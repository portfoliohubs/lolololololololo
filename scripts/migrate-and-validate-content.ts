import fs from 'fs';
import path from 'path';

interface RawQuestion {
  id?: string;
  question?: string;
  options?: string[];
  answerIndex?: number;
  answer?: string | number;
  correctAnswer?: string | number;
  correct_answer?: string | number;
  explanation?: string;
  ministerialRef?: string;
  [key: string]: any;
}

interface RawFlashcard {
  id?: string;
  front?: string;
  back?: string;
  term?: string;
  definition?: string;
  frontQuestion?: string;
  backAnswer?: string;
  hint?: string;
  category?: string;
  [key: string]: any;
}

const sourceDir = './public/content';
const targetDir = './protected_content';

function normalizeQuestion(raw: RawQuestion, idx: number, lessonId: string): any {
  let options: string[] = [];
  let answerIndex: number | undefined = undefined;

  // Check if options is an object { A: '...', B: '...', C: '...', D: '...' }
  if (raw.options && typeof raw.options === 'object' && !Array.isArray(raw.options)) {
    const optObj = raw.options as Record<string, string>;
    const keys = ['A', 'B', 'C', 'D'];
    options = keys.map(k => String(optObj[k] || optObj[k.toLowerCase()] || '').trim());
  } else if (Array.isArray(raw.options)) {
    options = raw.options.map(o => String(o).trim());
  }
  
  // Resolve answerIndex
  if (typeof raw.answerIndex === 'number' && !isNaN(raw.answerIndex)) {
    answerIndex = raw.answerIndex;
  } else if (raw.answerIndex !== undefined && !isNaN(Number(raw.answerIndex))) {
    answerIndex = Number(raw.answerIndex);
  } else {
    // Try raw.correctAnswer, raw.correct_answer, raw.answer
    const possible = raw.correctAnswer ?? raw.correct_answer ?? raw.answer;
    if (typeof possible === 'number') {
      answerIndex = possible;
    } else if (typeof possible === 'string') {
      const trimmed = possible.trim();
      const letterMap: Record<string, number> = { 
        'A': 0, 'B': 1, 'C': 2, 'D': 3, 
        'أ': 0, 'ب': 1, 'ج': 2, 'د': 3 
      };
      if (letterMap[trimmed.toUpperCase()] !== undefined) {
        answerIndex = letterMap[trimmed.toUpperCase()];
      } else if (/^\d+$/.test(trimmed)) {
        answerIndex = parseInt(trimmed, 10);
      } else {
        const optIdx = options.findIndex(o => o.toLowerCase() === trimmed.toLowerCase());
        if (optIdx >= 0) {
          answerIndex = optIdx;
        }
      }
    }
  }

  if (answerIndex === undefined || answerIndex < 0 || answerIndex >= options.length) {
    console.warn(`[WARN] Invalid answerIndex in ${lessonId} question #${idx}: ${answerIndex}. Defaulting to 0.`);
    answerIndex = 0;
  }

  const cleanQ: Record<string, any> = {
    id: raw.id || `${lessonId}_q_${idx + 1}`,
    question: raw.question || `سؤال ${idx + 1}`,
    options: options,
    answerIndex: answerIndex,
    explanation: raw.explanation || 'التفسير العلمي النموذجي وفق نواتج تعلم الوزارة المعتمدة.',
  };

  if (raw.ministerialRef) cleanQ.ministerialRef = raw.ministerialRef;
  if (raw.difficulty) cleanQ.difficulty = raw.difficulty;
  if (raw.concept) cleanQ.concept = raw.concept;

  return cleanQ;
}

function normalizeFlashcard(raw: RawFlashcard, idx: number, lessonId: string): any {
  const front = (raw.front || raw.term || raw.frontQuestion || `مفهوم ${idx + 1}`).trim();
  const back = (raw.back || raw.definition || raw.backAnswer || 'تعريف ومفهوم هذا المصطلح العلمي.').trim();

  const cleanC: Record<string, any> = {
    id: raw.id || `${lessonId}_c_${idx + 1}`,
    front,
    back,
  };

  if (raw.hint) cleanC.hint = raw.hint;
  if (raw.category) cleanC.category = raw.category;
  if (raw.importance) cleanC.importance = raw.importance;

  return cleanC;
}

export function runMigration() {
  console.log('=== Starting Content Migration & Normalization to /protected_content ===');

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  let totalLessons = 0;
  let totalLessonQuestions = 0;
  let totalLessonCards = 0;

  // 1. Lessons
  const lessonsSrc = path.join(sourceDir, 'lessons');
  const lessonsDst = path.join(targetDir, 'lessons');
  if (!fs.existsSync(lessonsDst)) {
    fs.mkdirSync(lessonsDst, { recursive: true });
  }

  const units = fs.readdirSync(lessonsSrc).filter(u => u.startsWith('unit_')).sort();
  for (const unit of units) {
    const uSrc = path.join(lessonsSrc, unit);
    const uDst = path.join(lessonsDst, unit);
    if (!fs.existsSync(uDst)) fs.mkdirSync(uDst, { recursive: true });

    const lessons = fs.readdirSync(uSrc).filter(l => l.startsWith('lesson_')).sort();
    for (const lesson of lessons) {
      totalLessons++;
      const lSrc = path.join(uSrc, lesson);
      const lDst = path.join(uDst, lesson);
      if (!fs.existsSync(lDst)) fs.mkdirSync(lDst, { recursive: true });

      const files = fs.readdirSync(lSrc);
      for (const file of files) {
        const fSrc = path.join(lSrc, file);
        const fDst = path.join(lDst, file);

        if (file === 'questions.json') {
          const rawList = JSON.parse(fs.readFileSync(fSrc, 'utf8'));
          const normalized = rawList.map((q: any, i: number) => normalizeQuestion(q, i, `${unit}/${lesson}`));
          totalLessonQuestions += normalized.length;
          fs.writeFileSync(fDst, JSON.stringify(normalized, null, 2), 'utf8');
        } else if (file === 'flashcards.json') {
          const rawList = JSON.parse(fs.readFileSync(fSrc, 'utf8'));
          const normalized = rawList.map((c: any, i: number) => normalizeFlashcard(c, i, `${unit}/${lesson}`));
          totalLessonCards += normalized.length;
          fs.writeFileSync(fDst, JSON.stringify(normalized, null, 2), 'utf8');
        } else {
          // Copy markdown or other files directly
          fs.copyFileSync(fSrc, fDst);
        }
      }
    }
  }

  // 2. Final Reviews and Exams
  const examsSrc = path.join(sourceDir, 'final_reviews_and_exams');
  const examsDst = path.join(targetDir, 'final_reviews_and_exams');
  if (!fs.existsSync(examsDst)) {
    fs.mkdirSync(examsDst, { recursive: true });
  }

  let totalExamQuestions = 0;
  const mockExamsFile = path.join(examsSrc, 'final_mock_exams.json');
  if (fs.existsSync(mockExamsFile)) {
    const rawExams = JSON.parse(fs.readFileSync(mockExamsFile, 'utf8'));
    const normalizedExams = rawExams.map((exam: any, eIdx: number) => {
      const qList = (exam.questions || []).map((q: any, qIdx: number) => {
        return normalizeQuestion(q, qIdx, `exam_${eIdx + 1}`);
      });
      totalExamQuestions += qList.length;
      return {
        ...exam,
        questions: qList
      };
    });
    fs.writeFileSync(path.join(examsDst, 'final_mock_exams.json'), JSON.stringify(normalizedExams, null, 2), 'utf8');
  }

  // Copy unit capsules
  const capsulesSrc = path.join(examsSrc, 'unit_capsules');
  const capsulesDst = path.join(examsDst, 'unit_capsules');
  if (fs.existsSync(capsulesSrc)) {
    if (!fs.existsSync(capsulesDst)) fs.mkdirSync(capsulesDst, { recursive: true });
    for (const file of fs.readdirSync(capsulesSrc)) {
      fs.copyFileSync(path.join(capsulesSrc, file), path.join(capsulesDst, file));
    }
  }

  console.log(`=== Migration Summary ===`);
  console.log(`Total Lessons Processed: ${totalLessons} (Expected 23)`);
  console.log(`Total Lesson Questions: ${totalLessonQuestions} (Expected 2300)`);
  console.log(`Total Exam Questions: ${totalExamQuestions} (Expected 250)`);
  console.log(`Total All Questions: ${totalLessonQuestions + totalExamQuestions} (Expected 2550)`);
  console.log(`Total Flashcards: ${totalLessonCards} (Expected 460)`);
}

runMigration();
