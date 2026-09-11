import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import { 
  FileText, 
  HelpCircle, 
  Layers, 
  ArrowRight,
  Download,
  AlertCircle,
  Info,
  BookOpen,
  Presentation,
  GraduationCap
} from 'lucide-react';
import { VideoPlayer } from './VideoPlayer';
import { ExamEngine } from './ExamEngine';
import { FlashcardsEngine } from './FlashcardsEngine';
import { CurriculumStation } from '../types';
import { useContentProtection } from '../hooks/useContentProtection';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

interface LessonViewerProps {
  lessonId: string;
  stationInfo: CurriculumStation;
  onBack: () => void;
}

type ViewMode = 'content' | 'exam' | 'flashcards';
type ContentTab = 'student' | 'slides' | 'teacher';

export const LessonViewer: React.FC<LessonViewerProps> = ({ lessonId, stationInfo, onBack }) => {
  useContentProtection(true);
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [customVideoUrl, setCustomVideoUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<ContentTab>('student');
  
  const [viewMode, setViewMode] = useState<ViewMode>('content');
  const [showCapsuleModal, setShowCapsuleModal] = useState(false);

  // State persistence
  useEffect(() => {
    try {
      localStorage.setItem('parmaga_active_lesson', lessonId);
      localStorage.setItem('parmaga_active_station', String(stationInfo.id));
      window.location.hash = `station=${stationInfo.id}&lesson=${lessonId}&tab=${activeTab}`;
    } catch {
      // ignore
    }
  }, [lessonId, stationInfo.id, activeTab]);

  // Fetch optional custom video URL configured by Admin
  useEffect(() => {
    const fetchCustomVideo = async () => {
      try {
        const db = getFirestore();
        const snap = await getDoc(doc(db, 'settings', 'lesson_videos'));
        if (snap.exists()) {
          const videos = snap.data();
          const safeKey = lessonId.replace('/', '_');
          if (videos[safeKey]) {
            setCustomVideoUrl(videos[safeKey]);
          }
        }
      } catch {
        // Fallback gracefully
      }
    };
    fetchCustomVideo();
  }, [lessonId]);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        setError(null);
        let filename = 'student_content.md';
        if (activeTab === 'slides') filename = 'slides_deck_with_notes.md';
        if (activeTab === 'teacher') filename = 'teacher_mastery_guide.md';

        let res = await fetch(`/content/lessons/${lessonId}/${filename}`);
        if (!res.ok && activeTab !== 'student') {
          // Fallback to student_content if sub-file not available
          res = await fetch(`/content/lessons/${lessonId}/student_content.md`);
        }
        if (!res.ok) throw new Error('Lesson content not found');
        let text = await res.text();
        
        // 1. Convert Golden Takeaway to custom HTML
        text = text.replace(
          /> ### 💡 القاعدة الذهبية لامتحان الثانوية العامة:\n> (.*?)\n/g,
          '<div class="my-6 p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 to-slate-900 border-r-4 border-r-amber-500 border border-slate-800 shadow-lg shadow-amber-950/20"><div class="flex items-center gap-2 mb-2"><span class="text-amber-400 font-bold">💡 القاعدة الذهبية لامتحان الثانوية العامة:</span></div><div class="text-amber-200/90 text-sm md:text-base font-semibold leading-relaxed">$1</div></div>\n'
        );

        // 2. Wrap 6-Marks Answer in a Details block
        text = text.replace(
          /### 📝 نموذج إجابة الكنترول وتوزيع الـ 6 درجات:([\s\S]*?)(?=---|$)/g,
          '<details class="mt-6 mb-8 bg-emerald-950/10 border border-emerald-500/20 rounded-2xl overflow-hidden group"><summary class="cursor-pointer bg-emerald-900/20 px-5 py-4 text-emerald-400 font-bold flex items-center justify-between select-none hover:bg-emerald-900/30 transition-colors">عرض نموذج إجابة الكنترول وتوزيع الـ 6 درجات بالتفصيل <span class="text-emerald-500 group-open:rotate-180 transition-transform duration-300">▼</span></summary><div class="p-5 md:p-6 space-y-3 text-sm md:text-base text-slate-300 leading-loose border-t border-emerald-500/10 answer-content">$1</div></details>'
        );
        
        setContent(text);
      } catch (err) {
        setError('تعذر تحميل محتوى الدرس. جاري التجهيز، يرجى المحاولة لاحقاً.');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [lessonId, activeTab]);

  const handleActionClick = (actionName: string, message: string) => {
    if (actionName === 'capsule') {
      setShowCapsuleModal(true);
    } else if (actionName === 'questions') {
      setViewMode('exam');
    } else if (actionName === 'flashcards') {
      setViewMode('flashcards');
    } else {
      setToastMessage(message);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  if (viewMode === 'exam') {
    return <ExamEngine lessonId={lessonId} onClose={() => setViewMode('content')} />;
  }

  if (viewMode === 'flashcards') {
    return <FlashcardsEngine lessonId={lessonId} onClose={() => setViewMode('content')} />;
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-slate-400 font-semibold animate-pulse">جاري فك تشفير المحتوى...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-950/20 border border-rose-500/30 p-6 rounded-3xl text-center max-w-xl mx-auto my-10 space-y-4 shadow-lg shadow-rose-950/10">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
        <h3 className="text-xl font-bold text-white">المحتوى قيد المراجعة</h3>
        <p className="text-sm text-slate-400 leading-relaxed">{error}</p>
        <button onClick={onBack} className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition-colors">
          العودة للمحطات
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto relative pb-32 animate-in fade-in slide-in-from-bottom-8 duration-500">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="px-5 py-3 rounded-2xl bg-slate-900 border border-emerald-500/40 text-emerald-300 text-sm font-bold shadow-2xl shadow-emerald-950/50 flex items-center gap-2">
            <Info className="w-4 h-4" />
            {toastMessage}
          </div>
        </div>
      )}

      {/* Top Breadcrumb & Header */}
      <div className="mb-8 flex items-center justify-between">
        <button 
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-slate-300 text-sm font-semibold flex items-center gap-2 transition-all"
        >
          <ArrowRight className="w-4 h-4" />
          العودة للمحطات
        </button>
        <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold font-mono">
          {stationInfo.subtitle}
        </div>
      </div>

      <div className="space-y-8">
        {/* Protected Video Player Slot */}
        <VideoPlayer videoUrl={customVideoUrl} />

        {/* Content Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('student')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'student'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>الشرح الدراسي الكامل</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('slides')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'slides'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Presentation className="w-4 h-4" />
            <span>الشرائح وخريطة الدرس (Slides Deck)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('teacher')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'teacher'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>دليل الإتقان ونواتج التعلم</span>
          </button>
        </div>

        {/* Rich Lesson Body with Protection */}
        <div 
          onContextMenu={(e) => e.preventDefault()}
          className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-6 sm:p-10 shadow-xl shadow-black/20 select-none"
        >
          <article className="prose prose-invert prose-emerald max-w-none select-none 
            prose-headings:font-black prose-headings:tracking-tight
            prose-h1:text-3xl prose-h1:mb-8 prose-h1:text-white
            prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:text-emerald-400 prose-h2:border-b prose-h2:border-slate-800 prose-h2:pb-4
            prose-h3:text-xl prose-h3:text-slate-200 prose-h3:mt-8
            prose-p:text-slate-300 prose-p:leading-relaxed prose-p:text-base md:prose-p:text-lg
            prose-a:text-emerald-400 prose-a:no-underline hover:prose-a:underline
            prose-strong:text-emerald-300 prose-strong:font-bold
            prose-ul:text-slate-300 prose-ol:text-slate-300
            prose-li:marker:text-emerald-500
            prose-blockquote:border-r-4 prose-blockquote:border-l-0 prose-blockquote:border-emerald-500/50 prose-blockquote:bg-emerald-950/10 prose-blockquote:px-5 prose-blockquote:py-3 prose-blockquote:rounded-l-2xl prose-blockquote:text-slate-300 prose-blockquote:not-italic
            prose-table:w-full prose-table:rounded-xl prose-table:overflow-hidden prose-table:border-collapse
            prose-th:bg-slate-800/80 prose-th:px-4 prose-th:py-3 prose-th:text-emerald-400 prose-th:border prose-th:border-slate-700
            prose-td:px-4 prose-td:py-3 prose-td:border prose-td:border-slate-800/80 prose-td:bg-slate-900/30
            prose-code:text-emerald-300 prose-code:bg-emerald-950/30 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none
            prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-800
          ">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeRaw, rehypeKatex]}
              components={{
                // Auto-detect Interactive Widget placeholder
                p: ({node, children, ...props}) => {
                  const txt = String(children);
                  if (txt.includes('موضع الأداة التفاعلية')) {
                    return (
                      <div className="my-10 p-8 rounded-3xl bg-slate-950 border border-indigo-500/30 flex flex-col items-center justify-center text-center space-y-4 shadow-2xl shadow-indigo-950/20 group">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 group-hover:scale-110 transition-transform">
                          <Layers className="w-8 h-8" />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-white mb-1">موضع الأداة التفاعلية (Interactive Widget)</h4>
                          <p className="text-sm text-slate-400">سيتم تفعيل المحاكي البرمجي المخصص لهذا الدرس هنا لتعميق الفهم العملي.</p>
                        </div>
                      </div>
                    );
                  }
                  return <p {...props}>{children}</p>;
                }
              }}
            >
              {content}
            </ReactMarkdown>
          </article>
        </div>
      </div>

      {/* Action Dock (Floating Bottom Bar) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800/80 px-4 py-4 sm:py-5 shadow-[0_-20px_40px_rgba(0,0,0,0.5)]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
          
          <button 
            onClick={() => handleActionClick('capsule', 'يتم تحميل الكبسولة...')}
            className="w-full sm:w-auto flex-1 flex flex-col items-center justify-center py-3 px-2 rounded-2xl bg-amber-600/10 hover:bg-amber-600/20 border border-amber-500/30 text-amber-400 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="font-bold">كبسولة الدرس A4</span>
            </div>
            <span className="text-[10px] sm:text-xs text-amber-500/70 font-semibold text-center hidden sm:block">
              خلاصة القوانين والمفاهيم للطباعة
            </span>
          </button>

          <button 
            onClick={() => handleActionClick('questions', 'محرك الأسئلة: تدريب 100 سؤال (قيد التفعيل في المرحلة القادمة)')}
            className="w-full sm:w-auto flex-1 flex flex-col items-center justify-center py-3 px-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 border border-emerald-500 shadow-xl shadow-emerald-900/30 text-white transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-2 mb-1">
              <HelpCircle className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              <span className="font-bold">بنك الأسئلة (100 سؤال)</span>
            </div>
            <span className="text-[10px] sm:text-xs text-emerald-200 font-semibold text-center hidden sm:block">
              تطبيق فوري وتصحيح آلي مفسر
            </span>
          </button>

          <button 
            onClick={() => handleActionClick('flashcards', 'بطاقات الذاكرة 3D (قيد التفعيل في المرحلة القادمة)')}
            className="w-full sm:w-auto flex-1 flex flex-col items-center justify-center py-3 px-2 rounded-2xl bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-2 mb-1">
              <Layers className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
              <span className="font-bold">بطاقات الذاكرة (20)</span>
            </div>
            <span className="text-[10px] sm:text-xs text-indigo-400/70 font-semibold text-center hidden sm:block">
              استرجاع سريع 3D Flashcards
            </span>
          </button>

        </div>
      </div>

      {/* The Capsule Modal */}
      {showCapsuleModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-slate-950/95 backdrop-blur-xl">
          <div className="w-full max-w-3xl bg-slate-100 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Header (Dark) */}
            <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 text-emerald-400">
                <FileText className="w-6 h-6" />
                <h3 className="text-xl font-bold text-white">الكبسولة الشاملة للدرس</h3>
              </div>
              <div className="flex items-center gap-3">
                <button className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold flex items-center gap-2 transition-colors">
                  <Download className="w-4 h-4" />
                  تحميل PDF
                </button>
                <button 
                  onClick={() => setShowCapsuleModal(false)}
                  className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-rose-950/50 hover:text-rose-400 text-slate-300 flex items-center justify-center transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            
            {/* Body (Light printable look) */}
            <div className="p-8 sm:p-12 overflow-y-auto bg-white text-slate-900 flex-1 printable-area" dir="rtl">
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="text-center pb-6 border-b-2 border-slate-200">
                  <h1 className="text-2xl font-black text-slate-900 mb-2">{stationInfo.title}</h1>
                  <p className="text-slate-500 font-mono" dir="ltr">{stationInfo.subtitle}</p>
                </div>
                
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 border-r-4 border-emerald-500 pr-3">المفاهيم المركزية</h3>
                  <ul className="space-y-3 list-disc list-inside text-slate-600 font-medium">
                    <li>تعتبر البيانات الخام بمثابة وقود الذكاء الاصطناعي.</li>
                    <li>لا قيمة للبيانات دون معالجتها وتحويلها لمعلومات وموضوعية.</li>
                    <li>الهرم المعرفي يمثل رحلة البيانات من حالة الفوضى إلى الحكمة والقرار.</li>
                    <li>في الامتحان الوزاري: ركز دائماً على "السياق" للتفريق بين البيانات والمعلومات.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
