import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ExamEngine } from './ExamEngine';
import { ArrowRight, Trophy, Clock, Star, PlayCircle, Loader2, AlertTriangle } from 'lucide-react';
import { contentService } from '../services/contentService';

interface MockExam {
  id: string;
  title: string;
  description: string;
  total_questions: number;
  total_marks: number;
  time_limit_minutes: number;
  questions: any[];
}

export const FinalExamsHub: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [exams, setExams] = useState<MockExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExamIndex, setSelectedExamIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        setError(null);
        const data = await contentService.getFinalMockExams();
        setExams(data);
      } catch (err: any) {
        setError(err.message || 'تعذر تحميل الامتحانات الشاملة.');
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  if (selectedExamIndex !== null && exams[selectedExamIndex]) {
    // Pass custom mock questions to ExamEngine
    return (
      <ExamEngine 
        lessonId={exams[selectedExamIndex].id} 
        onClose={() => setSelectedExamIndex(null)}
        mockQuestions={exams[selectedExamIndex].questions}
        examTitle={exams[selectedExamIndex].title}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-amber-500" />
        <p className="text-slate-400 font-semibold animate-pulse">جاري سحب الامتحانات الوزارية...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-5">
        <div className="p-4 rounded-2xl bg-amber-950/80 border border-amber-500/40 text-amber-200 flex items-center gap-3 text-right">
          <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
          <div>
            <div className="font-bold text-white mb-1">تعذر الوصول للامتحانات الشاملة</div>
            <div className="text-xs">{error}</div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-semibold text-xs cursor-pointer"
        >
          العودة للمحطات التعليمية
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button 
          onClick={onClose}
          className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-slate-300 text-sm font-semibold flex items-center gap-2 transition-all w-fit"
        >
          <ArrowRight className="w-4 h-4" />
          العودة للمحطات
        </button>
        <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-xl text-amber-400 font-bold">
          <Trophy className="w-5 h-5" />
          امتحانات ليلة الامتحان الوزارية
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {exams.map((exam, index) => (
          <div key={exam.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 hover:border-amber-500/50 transition-colors group relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />
            
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-amber-400 text-xs font-bold font-mono">
                النموذج رقم {index + 1}
              </span>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Clock className="w-4 h-4" />
                {exam.time_limit_minutes} دقيقة
              </div>
            </div>

            <h3 className="text-xl font-bold text-white mb-2 leading-tight">
              {exam.title}
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              {exam.description}
            </p>

            <div className="grid grid-cols-2 gap-3 mb-6 pt-6 border-t border-slate-800/80 text-xs text-slate-300">
              <div className="flex flex-col gap-1">
                <span className="text-slate-500">عدد الأسئلة</span>
                <strong className="text-white text-sm">{exam.total_questions} سؤالاً</strong>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-slate-500">إجمالي الدرجات</span>
                <strong className="text-emerald-400 text-sm">{exam.total_marks} درجة</strong>
              </div>
            </div>

            <button 
              onClick={() => setSelectedExamIndex(index)}
              className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold flex items-center justify-center gap-2 shadow-xl shadow-amber-950/40 transition-colors"
            >
              <PlayCircle className="w-5 h-5" />
              بدء المحاكاة الوزارية
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
