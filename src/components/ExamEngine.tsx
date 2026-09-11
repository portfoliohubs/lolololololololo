import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { saveExamState, getExamState, clearExamState } from '../lib/indexeddb';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { CheckCircle2, XCircle, ArrowRight, BookOpen, RotateCcw, AlertTriangle, Loader2, Save, Send } from 'lucide-react';
import { useContentProtection } from '../hooks/useContentProtection';

interface Question {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  ministerialRef?: string;
}

interface ExamEngineProps {
  lessonId: string;
  onClose: () => void;
  mockQuestions?: Question[];
  examTitle?: string;
}

export const ExamEngine: React.FC<ExamEngineProps> = ({ lessonId, onClose, mockQuestions, examTitle }) => {
  useContentProtection(true);
  const { userProfile, user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Exam State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [score, setScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    const initExam = async () => {
      try {
        setLoading(true);
        let data: Question[] = [];
        
        // 1. Fetch questions or use mockQuestions
        if (mockQuestions) {
          data = mockQuestions;
        } else {
          const res = await fetch(`/content/lessons/${lessonId}/questions.json`);
          if (!res.ok) throw new Error('Questions not found');
          data = await res.json();
        }
        
        setQuestions(data);

        // 2. Load cached state from IndexedDB
        if (user) {
          const cached = await getExamState(user.uid, lessonId);
          if (cached && !cached.completed) {
            setAnswers(cached.answers || {});
            setCurrentIndex(cached.lastQuestionIndex || 0);
            
            // If the loaded current question already has an answer, show explanation
            const currentQ = data[cached.lastQuestionIndex || 0];
            if (currentQ && cached.answers[currentQ.id] !== undefined) {
              setShowExplanation(true);
            }
          } else if (cached && cached.completed) {
            // Already completed previously
            setIsCompleted(true);
            setScore(cached.score || 0);
            setAnswers(cached.answers || {});
          }
        }
      } catch (err) {
        setError('تعذر تحميل بنك الأسئلة. قد لا يكون متوفراً بعد.');
      } finally {
        setLoading(false);
      }
    };

    initExam();
  }, [lessonId, user]);

  const handleSelectOption = async (optionIndex: number) => {
    if (showExplanation || isCompleted) return; // Prevent double answering

    const currentQ = questions[currentIndex];
    const newAnswers = { ...answers, [currentQ.id]: optionIndex };
    setAnswers(newAnswers);
    setShowExplanation(true);

    // Persist immediately to IndexedDB (zero cost, saves progress)
    if (user) {
      await saveExamState({
        id: `${user.uid}_${lessonId}`,
        lessonId,
        userId: user.uid,
        answers: newAnswers,
        lastQuestionIndex: currentIndex,
        completed: false,
        updatedAt: Date.now()
      });
    }
  };

  const handleNextQuestion = async () => {
    if (currentIndex < questions.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      
      const nextQ = questions[nextIdx];
      setShowExplanation(answers[nextQ.id] !== undefined);
      
      if (user) {
        await saveExamState({
          id: `${user.uid}_${lessonId}`,
          lessonId,
          userId: user.uid,
          answers,
          lastQuestionIndex: nextIdx,
          completed: false,
          updatedAt: Date.now()
        });
      }
    } else {
      // Reached the end, trigger final submission
      handleFinalSubmission();
    }
  };

  const handleFinalSubmission = async () => {
    if (!user || submitting) return;
    setSubmitting(true);
    try {
      // Calculate final score
      let correctCount = 0;
      questions.forEach(q => {
        if (answers[q.id] === q.answerIndex) correctCount++;
      });
      const finalScore = Math.round((correctCount / questions.length) * 100);

      // 1. Submit to Firebase (Only ONE write operation per exam to save costs)
      const db = getFirestore();
      await setDoc(doc(db, 'users', user.uid, 'exams', lessonId), {
        lessonId,
        score: finalScore,
        completedAt: new Date().toISOString(),
        totalQuestions: questions.length,
        correctAnswers: correctCount
      });

      // 2. Mark complete in IndexedDB
      await saveExamState({
        id: `${user.uid}_${lessonId}`,
        lessonId,
        userId: user.uid,
        answers,
        lastQuestionIndex: currentIndex,
        completed: true,
        score: finalScore,
        updatedAt: Date.now()
      });

      setScore(finalScore);
      setIsCompleted(true);
    } catch (err) {
      console.error('Submission failed', err);
      alert('فشل تسليم النتيجة للخادم، يرجى المحاولة مرة أخرى.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = async () => {
    if (user) {
      await clearExamState(user.uid, lessonId);
    }
    setAnswers({});
    setCurrentIndex(0);
    setIsCompleted(false);
    setShowExplanation(false);
    setScore(0);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-slate-400 font-semibold animate-pulse">جاري بناء وتشفير محرك الأسئلة...</p>
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="text-center p-10 max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl mt-10">
        <p className="text-slate-400 mb-6">{error || 'لا توجد أسئلة حالياً.'}</p>
        <button onClick={onClose} className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold">
          العودة
        </button>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="max-w-3xl mx-auto p-10 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-3xl mt-10 text-center shadow-2xl animate-in fade-in duration-500">
        <div className="relative w-32 h-32 mx-auto mb-6">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-slate-800"
              strokeWidth="3"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className={score >= 50 ? 'text-emerald-500' : 'text-rose-500'}
              strokeWidth="3"
              strokeDasharray={`${score}, 100`}
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-black text-white">{score}%</span>
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
          {score >= 85 ? 'أداء ممتاز ونتيجة مبهرة!' : score >= 50 ? 'اجتياز بنجاح، استمر في التطور!' : 'تحتاج إلى مراجعة الكبسولة والمحاولة مجدداً.'}
        </h2>
        <p className="text-slate-400 mb-8">تم حفظ النتيجة في سجلات المنصة بنجاح عبر بروتوكول توفير البيانات.</p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button 
            onClick={handleRetry}
            className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
            إعادة المحاولة
          </button>
          <button 
            onClick={onClose}
            className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-900/30"
          >
            العودة للمحطات
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const answered = answers[currentQ.id] !== undefined;
  const selectedIndex = answers[currentQ.id];
  const isCorrect = answered && selectedIndex === currentQ.answerIndex;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in duration-300 select-none">
      
      {/* Header & Local Save Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-sm font-semibold flex items-center gap-2"
          >
            <ArrowRight className="w-4 h-4" />
            خروج وحفظ مؤقت
          </button>
          
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/30 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Save className="w-3.5 h-3.5" />
            حفظ محلي (IndexedDB)
          </div>
        </div>

        {examTitle && (
          <div className="text-sm font-bold text-amber-400 border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 rounded-lg text-center">
            {examTitle}
          </div>
        )}

        <div className="flex items-center gap-3 text-right sm:text-left">
          <div className="w-full sm:w-48 h-2.5 rounded-full bg-slate-900 border border-slate-800 overflow-hidden order-last sm:order-first">
            <div 
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
          <span className="text-sm font-bold text-slate-300 shrink-0">
            السؤال {currentIndex + 1} من {questions.length}
          </span>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl mb-6">
        <h3 className="text-xl sm:text-2xl font-bold text-white leading-relaxed mb-8">
          {currentQ.question}
        </h3>

        <div className="space-y-3">
          {currentQ.options.map((option, idx) => {
            let optionStyles = "bg-slate-950/50 border-slate-700/50 hover:border-emerald-500/50 hover:bg-slate-800/80 text-slate-300 cursor-pointer";
            
            if (showExplanation) {
              if (idx === currentQ.answerIndex) {
                optionStyles = "bg-emerald-950/40 border-emerald-500 text-emerald-300 cursor-default ring-1 ring-emerald-500 shadow-lg shadow-emerald-900/20";
              } else if (idx === selectedIndex) {
                optionStyles = "bg-rose-950/30 border-rose-500/50 text-rose-300 cursor-default opacity-60";
              } else {
                optionStyles = "bg-slate-950/20 border-slate-800 text-slate-500 cursor-default opacity-40";
              }
            }

            const letter = String.fromCharCode(1571 + idx); // أ, ب, ج, د (roughly mapped)
            const mapLetter = ['أ', 'ب', 'ج', 'د'][idx] || letter;

            return (
              <div 
                key={idx}
                onClick={() => handleSelectOption(idx)}
                className={`flex items-start gap-4 p-4 sm:p-5 rounded-2xl border-2 transition-all ${optionStyles}`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                  showExplanation && idx === currentQ.answerIndex 
                    ? 'bg-emerald-500 text-white' 
                    : showExplanation && idx === selectedIndex
                    ? 'bg-rose-500/20 text-rose-400'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {mapLetter}
                </div>
                <div className="pt-1 text-base sm:text-lg font-medium leading-relaxed">
                  {option}
                </div>
                
                {showExplanation && idx === currentQ.answerIndex && (
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 mr-auto shrink-0 mt-1" />
                )}
                {showExplanation && idx === selectedIndex && idx !== currentQ.answerIndex && (
                  <XCircle className="w-6 h-6 text-rose-500 mr-auto shrink-0 mt-1" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Explanation Box */}
      {showExplanation && (
        <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-xl animate-in slide-in-from-bottom-4 duration-500 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-2 h-full bg-indigo-500" />
          
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <h4 className="text-lg font-bold text-white">التفسير والشرح الوزاري</h4>
          </div>
          
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed font-medium mb-4">
            {currentQ.explanation}
          </p>
          
          {currentQ.ministerialRef && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-300 text-xs font-semibold border border-indigo-500/20">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>المرجع: {currentQ.ministerialRef}</span>
            </div>
          )}
        </div>
      )}

      {/* Next / Submit Button */}
      {showExplanation && (
        <div className="flex justify-end animate-in fade-in duration-300">
          {currentIndex < questions.length - 1 ? (
            <button
              onClick={handleNextQuestion}
              className="px-8 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg flex items-center justify-center gap-3 shadow-xl shadow-emerald-900/30 transition-transform active:scale-95"
            >
              السؤال التالي
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleFinalSubmission}
              disabled={submitting}
              className="px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-bold text-lg flex items-center justify-center gap-3 shadow-xl shadow-indigo-900/30 transition-transform active:scale-95"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  جاري تسجيل النتيجة في السحابة...
                </>
              ) : (
                <>
                  تسليم الاختبار النهائي
                  <Send className="w-5 h-5" />
                </>
              )}
            </button>
          )}
        </div>
      )}

    </div>
  );
};
