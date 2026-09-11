import fs from 'fs';
import path from 'path';

interface NormalizedQuestion {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  [key: string]: any;
}

interface NormalizedCard {
  id: string;
  front: string;
  back: string;
  [key: string]: any;
}

const baseDir = './protected_content';

export function validateAllContent(): boolean {
  console.log('--- Starting Content Schema Validator ---');
  let hasErrors = false;
  let totalLessons = 0;
  let totalQuestions = 0;
  let totalCards = 0;

  const lessonsDir = path.join(baseDir, 'lessons');
  if (!fs.existsSync(lessonsDir)) {
    console.error('FAIL: protected_content/lessons directory does not exist');
    return false;
  }

  const units = fs.readdirSync(lessonsDir).filter(u => u.startsWith('unit_')).sort();
  for (const unit of units) {
    const uPath = path.join(lessonsDir, unit);
    const lessons = fs.readdirSync(uPath).filter(l => l.startsWith('lesson_')).sort();

    for (const lesson of lessons) {
      totalLessons++;
      const lPath = path.join(uPath, lesson);
      const qFile = path.join(lPath, 'questions.json');
      const cFile = path.join(lPath, 'flashcards.json');
      const mFile = path.join(lPath, 'student_content.md');

      if (!fs.existsSync(mFile)) {
        console.error(`FAIL: Missing student_content.md in ${unit}/${lesson}`);
        hasErrors = true;
      }

      if (!fs.existsSync(qFile)) {
        console.error(`FAIL: Missing questions.json in ${unit}/${lesson}`);
        hasErrors = true;
      } else {
        const questions: NormalizedQuestion[] = JSON.parse(fs.readFileSync(qFile, 'utf8'));
        if (questions.length !== 100) {
          console.error(`FAIL: ${unit}/${lesson} questions count is ${questions.length}, expected 100`);
          hasErrors = true;
        }
        questions.forEach((q, idx) => {
          totalQuestions++;
          if (!q.id) {
            console.error(`FAIL: Question #${idx} in ${unit}/${lesson} missing id`);
            hasErrors = true;
          }
          if (!q.question || q.question.trim().length === 0) {
            console.error(`FAIL: Question #${idx} in ${unit}/${lesson} missing question text`);
            hasErrors = true;
          }
          if (!Array.isArray(q.options) || q.options.length < 2) {
            console.error(`FAIL: Question #${idx} in ${unit}/${lesson} has invalid options array`);
            hasErrors = true;
          }
          if (typeof q.answerIndex !== 'number' || q.answerIndex < 0 || q.answerIndex >= q.options.length) {
            console.error(`FAIL: Question #${idx} in ${unit}/${lesson} has invalid answerIndex: ${q.answerIndex}`);
            hasErrors = true;
          }
          if (!q.explanation || q.explanation.trim().length === 0) {
            console.error(`FAIL: Question #${idx} in ${unit}/${lesson} missing explanation`);
            hasErrors = true;
          }
          // Verify no legacy keys remain
          if ('correct_answer' in q || 'correctAnswer' in q || 'answer' in q) {
            console.error(`FAIL: Legacy answer key found in question #${idx} in ${unit}/${lesson}`);
            hasErrors = true;
          }
        });
      }

      if (!fs.existsSync(cFile)) {
        console.error(`FAIL: Missing flashcards.json in ${unit}/${lesson}`);
        hasErrors = true;
      } else {
        const cards: NormalizedCard[] = JSON.parse(fs.readFileSync(cFile, 'utf8'));
        if (cards.length !== 20) {
          console.error(`FAIL: ${unit}/${lesson} flashcards count is ${cards.length}, expected 20`);
          hasErrors = true;
        }
        cards.forEach((c, idx) => {
          totalCards++;
          if (!c.id) {
            console.error(`FAIL: Card #${idx} in ${unit}/${lesson} missing id`);
            hasErrors = true;
          }
          if (!c.front || c.front.trim().length === 0) {
            console.error(`FAIL: Card #${idx} in ${unit}/${lesson} missing front text`);
            hasErrors = true;
          }
          if (!c.back || c.back.trim().length === 0) {
            console.error(`FAIL: Card #${idx} in ${unit}/${lesson} missing back text`);
            hasErrors = true;
          }
          // Verify no legacy keys remain
          if ('term' in c || 'definition' in c || 'frontQuestion' in c || 'backAnswer' in c) {
            console.error(`FAIL: Legacy card key found in card #${idx} in ${unit}/${lesson}`);
            hasErrors = true;
          }
        });
      }
    }
  }

  // Validate Final Mock Exams
  const mockExamsFile = path.join(baseDir, 'final_reviews_and_exams', 'final_mock_exams.json');
  let totalExamQuestions = 0;
  if (!fs.existsSync(mockExamsFile)) {
    console.error('FAIL: Missing final_mock_exams.json');
    hasErrors = true;
  } else {
    const exams = JSON.parse(fs.readFileSync(mockExamsFile, 'utf8'));
    if (!Array.isArray(exams) || exams.length !== 5) {
      console.error(`FAIL: Expected 5 mock exams, found ${exams?.length}`);
      hasErrors = true;
    } else {
      exams.forEach((exam: any, eIdx: number) => {
        if (!Array.isArray(exam.questions) || exam.questions.length !== 50) {
          console.error(`FAIL: Exam #${eIdx + 1} has ${exam.questions?.length} questions, expected 50`);
          hasErrors = true;
        } else {
          exam.questions.forEach((q: any, qIdx: number) => {
            totalExamQuestions++;
            if (typeof q.answerIndex !== 'number' || q.answerIndex < 0 || q.answerIndex >= q.options.length) {
              console.error(`FAIL: Exam #${eIdx + 1} question #${qIdx} invalid answerIndex: ${q.answerIndex}`);
              hasErrors = true;
            }
          });
        }
      });
    }
  }

  // Validate SEO Articles
  const seoFile = './public/content/seo_articles/all_230_seo_articles.json';
  if (!fs.existsSync(seoFile)) {
    console.error('FAIL: Missing all_230_seo_articles.json in public/content/seo_articles');
    hasErrors = true;
  } else {
    const seoArticles = JSON.parse(fs.readFileSync(seoFile, 'utf8'));
    if (!Array.isArray(seoArticles) || seoArticles.length !== 230) {
      console.error(`FAIL: Expected 230 SEO articles, found ${seoArticles?.length}`);
      hasErrors = true;
    }
  }

  console.log('--- Content Validation Report Summary ---');
  console.log(`Validated Lessons: ${totalLessons}/23`);
  console.log(`Validated Lesson Questions: ${totalQuestions}/2300`);
  console.log(`Validated Exam Questions: ${totalExamQuestions}/250`);
  console.log(`Total Validated Questions: ${totalQuestions + totalExamQuestions}/2550`);
  console.log(`Validated Flashcards: ${totalCards}/460`);
  console.log(`Schema Integrity Status: ${hasErrors ? 'FAILED' : 'PASSED (100% Validated)'}`);

  if (hasErrors) {
    process.exit(1);
  }
  return !hasErrors;
}

validateAllContent();
