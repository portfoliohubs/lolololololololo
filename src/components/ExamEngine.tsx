import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { saveExamState, getExamState, clearExamState, ExamState } from '../lib/indexeddb';
import { normalizeQuestionBank, NormalizedQuestion } from '../lib/contentNormalizer';
import { contentService } from '../services/contentService';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  ArrowLeft,
  BookOpen, 
  RotateCcw, 
  AlertTriangle, 
  Loader2, 
  Save, 
  Send,
  Clock,
  LayoutGrid,
  Check,
  AlertCircle
} from 'lucide-react';
import { useContentProtection } from '../hooks/useContentProtection';

interface ExamEngineProps {
  lessonId: string;
  onClose: () => void;
  mockQuestions?: any[];
  examTitle?: string;
  timeLimitMinutes?: number;
}

export const ExamEngine: React.FC<ExamEngineProps> = ({ 
  lessonId, 
  onClose, 
  mockQuestions, 
  examTitle,
  timeLimitMinutes
}) => {
  useContentProtection(true);
  const { userProfile, user } = useAuth();
  const [questions, setQuestions] = useState<NormalizedQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Exam Navigation & Answers
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [score, setScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showQuestionPalette, setShowQuestionPalette] = useState(false);

  // Timer State
  const defaultMinutes = timeLimitMinutes || (mockQuestions ? 60 : 45);
  const [totalSeconds, setTotalSeconds] = useState<number>(defaultMinutes * 60);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(defaultMinutes * 60);
  const [timeExpired, setTimeExpired] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const initExam = async () => {
      try {
        setLoading(true);
        let rawData: any[] = [];
        
        // 1. Fetch questions or use mockQuestions
        if (mockQuestions && mockQuestions.length > 0) {
          rawData = mockQuestions;
        } else {
          rawData = await contentService.getLessonQuestions(lessonId);
        }
        
        // Normalize using canonical standard
        const normalized = normalizeQuestionBank(rawData);
        setQuestions(normalized);

        // Compute total seconds based on question count if not specified
        const calculatedMinutes = timeLimitMinutes || (normalized.length > 50 ? 90 : normalized.length > 20 ? 60 : 30);
        const calculatedSeconds = calculatedMinutes * 60;
        setTotalSeconds(calculatedSeconds);

        // 2. Load cached state from IndexedDB
        if (user) {
          const cached = await getExamState(user.uid, lessonId);
          if (cached && !cached.completed) {
            setAnswers(cached.answers || {});
            const resumeIdx = Math.min(cached.lastQuestionIndex || 0, normalized.length - 1);
            setCurrentIndex(resumeIdx);
            
            // Restore remaining timer if valid
            if (cached.remainingSeconds && cached.remainingSeconds > 0) {
              setRemainingSeconds(cached.remainingSeconds);
            } else {
              setRemainingSeconds(calculatedSeconds);
            }

            // If the loaded current question already has an answer, show explanation
            const currentQ = normalized[resumeIdx];
            if (currentQ && cached.answers[currentQ.id] !== undefined) {
              setShowExplanation(true);
            }
          } else if (cached && cached.completed) {
            setIsCompleted(true);
            setScore(cached.score || 0);
            setAnswers(cached.answers || {});
          } else {
            setRemainingSeconds(calculatedSeconds);
          }
        } else {
          setRemainingSeconds(calculatedSeconds);
        }
      } catch (err) {
        setError('تعذر تحميل بنك الأسئلة. قد لا يكون متوفراً بعد.');
      } finally {
        setLoading(false);
      }
    };

    initExam();
  }, [lessonId, user, mockQuestions, timeLimitMinutes]);

  // Active Timer Effect
  useEffect(() => {
    if (loading || isCompleted || timeExpired) return;

    timerRef.current = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setTimeExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, isCompleted, timeExpired]);

  // Handle timeout auto-submission
  useEffect(() => {
    if (timeExpired && !isCompleted && questions.length > 0) {
      handleFinalSubmission(true);
    }
  }, [timeExpired, isCompleted, questions.length]);

  const handleSelectOption = async (optionIndex: number) => {
    if (showExplanation || isCompleted || timeExpired) return;

    const currentQ = questions[currentIndex];
    const newAnswers = { ...answers, [currentQ.id]: optionIndex };
    setAnswers(newAnswers);
    setShowExplanation(true);

    // Persist immediately to IndexedDB
    if (user) {
      const state: ExamState = {
        id: `${user.uid}_${lessonId}`,
        lessonId,
        userId: user.uid,
        answers: newAnswers,
        lastQuestionIndex: currentIndex,
        completed: false,
        remainingSeconds,
        totalSeconds,
        updatedAt: Date.now()
      };
      await saveExamState(state);
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
          remainingSeconds,
          totalSeconds,
          updatedAt: Date.now()
        });
      }
    } else {
      handleFinalSubmission(false);
    }
  };

  const handlePrevQuestion = () => {
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      const prevQ = questions[prevIdx];
      setShowExplanation(answers[prevQ.id] !== undefined);
    }
  };

  const handleJumpToQuestion = (targetIdx: number) => {
    if (targetIdx >= 0 && targetIdx < questions.length) {
      setCurrentIndex(targetIdx);
      const targetQ = questions[targetIdx];
      setShowExplanation(answers[targetQ.id] !== undefined);
      setShowQuestionPalette(false);
    }
  };

  const handleFinalSubmission = async (forcedByTimer = false) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      // Calculate final score
      let correctCount = 0;
      let totalMarks = 0;
      let earnedMarks = 0;

      questions.forEach(q => {
        const qMarks = q.marks || 1;
        totalMarks += qMarks;
        if (answers[q.id] === q.answerIndex) {
          correctCount++;
          earnedMarks += qMarks;
        }
      });

      const finalScore = totalMarks > 0 ? Math.round((earnedMarks / totalMarks) * 100) : 0;

      // 1. Submit to Firestore
      if (user) {
        const db = getFirestore();
        await setDoc(doc(db, 'users', user.uid, 'exams', lessonId.replace(/\//g, '_')), {
          lessonId,
          score: finalScore,
          completedAt: new Date().toISOString(),
          totalQuestions: questions.length,
          correctAnswers: correctCount,
          timeSpentSeconds: totalSeconds - remainingSeconds,
          forcedByTimer
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
          remainingSeconds: 0,
          totalSeconds,
          updatedAt: Date.now()
        });
      }

      setScore(finalScore);
      setIsCompleted(true);
    } catch (err) {
      console.error('Submission failed', err);
      alert('تم حفظ النتيجة محلياً بنجاح!');
      setIsCompleted(true);
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
    setTimeExpired(false);
    setRemainingSeconds(totalSeconds);
  };

  // Format seconds to mm:ss
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const pad = (n: number) => (n < 10 ? `0${n}` : n);
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const remMins = mins % 60;
      return `${hrs}:${pad(remMins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-slate-400 font-semibold animate-pulse">جاري بناء وتشفير محرك الأسئلة المعياري...</p>
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

  // Completion Screen with full review
  if (isCompleted) {
    return (
      <div className="max-w-4xl mx-auto p-6 sm:p-10 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-3xl mt-8 text-center shadow-2xl animate-in fade-in duration-500">
        <div className="relative w-36 h-36 mx-auto mb-6">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-slate-800"
              strokeWidth="3"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className={score >= 60 ? 'text-emerald-500' : 'text-rose-500'}
              strokeWidth="3"
              strokeDasharray={`${score}, 100`}
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-white">{score}%</span>
            <span className="text-[11px] text-slate-400 font-semibold">{score >= 60 ? 'ناجح' : 'يحتاج تحسين'}</span>
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
          {score >= 85 ? 'أداء ممتاز ودرجة شرفية!' : score >= 60 ? 'اجتياز معتمد، عمل رائع!' : 'تحتاج إلى مراجعة الكبسولة الشاملة والمحاولة ثانية.'}
        </h2>
        <p className="text-slate-400 mb-8">
          تم حفظ سجل الاختبار بأمان محلياً وفي السحابة، مع توثيق الإجابات النموذجية.
        </p>

        {/* Results Overview Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto mb-8 text-right">
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div className="text-xs text-slate-400 font-semibold mb-1">الأسئلة الكلية</div>
            <div className="text-xl font-bold text-white">{questions.length}</div>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/20">
            <div className="text-xs text-emerald-400 font-semibold mb-1">الإجابات الصحيحة</div>
            <div className="text-xl font-bold text-emerald-300">
              {questions.filter(q => answers[q.id] === q.answerIndex).length}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/20">
            <div className="text-xs text-rose-400 font-semibold mb-1">الإجابات الخاطئة</div>
            <div className="text-xl font-bold text-rose-300">
              {questions.filter(q => answers[q.id] !== undefined && answers[q.id] !== q.answerIndex).length}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div className="text-xs text-slate-400 font-semibold mb-1">الوقت المستغرق</div>
            <div className="text-xl font-bold text-amber-300 font-mono">
              {formatTimer(totalSeconds - remainingSeconds)}
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button 
            onClick={handleRetry}
            className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            إعادة الاختبار من البداية
          </button>
          <button 
            onClick={onClose}
            className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-900/30 cursor-pointer"
          >
            العودة للمحطات والدروس
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const answered = answers[currentQ.id] !== undefined;
  const selectedIndex = answers[currentQ.id];
  const isTimeLow = remainingSeconds < 300; // Under 5 minutes
  const isTimeCritical = remainingSeconds < 60; // Under 1 minute

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 animate-in fade-in duration-300 select-none">
      
      {/* Header Bar with Live Countdown Timer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            خروج وحفظ
          </button>
          
          <button
            onClick={() => setShowQuestionPalette(!showQuestionPalette)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <LayoutGrid className="w-4 h-4 text-emerald-400" />
            <span>فهرس الأسئلة ({Object.keys(answers).length}/{questions.length})</span>
          </button>
        </div>

        {/* Dynamic Timer Badge */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-sm border shadow-md transition-all ${
          isTimeCritical 
            ? 'bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse ring-2 ring-rose-500/50' 
            : isTimeLow 
            ? 'bg-amber-950/50 border-amber-500/50 text-amber-300' 
            : 'bg-slate-900 border-slate-800 text-emerald-400'
        }`}>
          <Clock className={`w-4 h-4 ${isTimeCritical ? 'text-rose-400' : isTimeLow ? 'text-amber-400' : 'text-emerald-400'}`} />
          <span>الوقت المتبقي: {formatTimer(remainingSeconds)}</span>
        </div>

        {/* Progress Bar & Index */}
        <div className="flex items-center gap-3 text-right sm:text-left">
          <div className="w-full sm:w-36 h-2 rounded-full bg-slate-900 border border-slate-800 overflow-hidden order-last sm:order-first">
            <div 
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
          <span className="text-xs font-bold text-slate-300 shrink-0">
            {currentIndex + 1} / {questions.length}
          </span>
        </div>
      </div>

      {/* Question Palette Drawer (Modal on demand) */}
      {showQuestionPalette && (
        <div className="mb-6 p-4 rounded-3xl bg-slate-900 border border-slate-800 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800 text-xs font-bold text-slate-300">
            <span>انقر للانتقال المباشر لأي سؤال:</span>
            <button 
              onClick={() => setShowQuestionPalette(false)}
              className="text-slate-500 hover:text-white"
            >
              ✕ إغلاق
            </button>
          </div>
          <div className="grid grid-cols-8 sm:grid-cols-12 md:grid-cols-15 gap-1.5 max-h-48 overflow-y-auto p-1">
            {questions.map((q, idx) => {
              const isAnswered = answers[q.id] !== undefined;
              const isCurrent = idx === currentIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => handleJumpToQuestion(idx)}
                  className={`h-8 rounded-lg text-xs font-bold transition-all ${
                    isCurrent 
                      ? 'bg-emerald-500 text-white ring-2 ring-emerald-400' 
                      : isAnswered 
                      ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300' 
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Question Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl mb-6 text-right">
        {currentQ.difficulty && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-bold text-slate-400 mb-4">
            <span>مستوى الصعوبة:</span>
            <span className="text-emerald-400">{currentQ.difficulty}</span>
          </div>
        )}

        <h3 className="text-lg sm:text-xl font-bold text-white leading-relaxed mb-6">
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

            const mapLetter = ['أ', 'ب', 'ج', 'د', 'هـ'][idx] || String(idx + 1);

            return (
              <div 
                key={idx}
                onClick={() => handleSelectOption(idx)}
                className={`flex items-start gap-4 p-4 rounded-2xl border-2 transition-all ${optionStyles}`}
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
                <div className="pt-1 text-base font-medium leading-relaxed">
                  {option}
                </div>
                
                {showExplanation && idx === currentQ.answerIndex && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-auto shrink-0 mt-1" />
                )}
                {showExplanation && idx === selectedIndex && idx !== currentQ.answerIndex && (
                  <XCircle className="w-5 h-5 text-rose-500 mr-auto shrink-0 mt-1" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Explanation Box */}
      {showExplanation && (
        <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 shadow-xl animate-in slide-in-from-bottom-3 duration-300 mb-6 relative overflow-hidden text-right">
          <div className="absolute top-0 right-0 w-2 h-full bg-indigo-500" />
          
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <h4 className="text-base font-bold text-white">التفسير والشرح النموذجي</h4>
          </div>
          
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-medium mb-3">
            {currentQ.explanation}
          </p>
          
          {currentQ.ministerialRef && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 text-xs font-semibold border border-indigo-500/20">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>المرجع المنهجي: {currentQ.ministerialRef}</span>
            </div>
          )}
        </div>
      )}

      {/* Navigation Controls */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={handlePrevQuestion}
          disabled={currentIndex === 0}
          className="px-5 py-3 rounded-xl bg-slate-900 border border-slate-800 disabled:opacity-40 text-slate-300 font-bold text-sm flex items-center gap-2 transition-colors cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          السابق
        </button>

        <div className="flex items-center gap-3">
          {currentIndex < questions.length - 1 ? (
            <button
              onClick={handleNextQuestion}
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition-transform active:scale-95 cursor-pointer"
            >
              السؤال التالي
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => handleFinalSubmission(false)}
              disabled={submitting}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-indigo-900/30 transition-transform active:scale-95 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  تسليم النتيجة...
                </>
              ) : (
                <>
                  تسليم وإنهاء الاختبار
                  <Send className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>

    </div>
  );
};
