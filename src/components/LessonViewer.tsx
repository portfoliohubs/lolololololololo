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
  GraduationCap,
  Printer,
  ChevronLeft,
  Sparkles
} from 'lucide-react';
import { VideoPlayer } from './VideoPlayer';
import { ExamEngine } from './ExamEngine';
import { FlashcardsEngine } from './FlashcardsEngine';
import { CurriculumStation } from '../types';
import { ALL_LESSONS } from '../data/curriculumData';
import { useContentProtection } from '../hooks/useContentProtection';
import { contentService } from '../services/contentService';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

interface LessonViewerProps {
  lessonId: string;
  stationInfo: CurriculumStation;
  onBack: () => void;
}

type ViewMode = 'content' | 'exam' | 'flashcards';
type ContentTab = 'student' | 'slides' | 'teacher';

export const LessonViewer: React.FC<LessonViewerProps> = ({ 
  lessonId: initialLessonId, 
  stationInfo, 
  onBack 
}) => {
  useContentProtection(true);
  const [currentLessonId, setCurrentLessonId] = useState<string>(initialLessonId);
  const [content, setContent] = useState<string>('');
  const [capsuleContent, setCapsuleContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [loadingCapsule, setLoadingCapsule] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [customVideoUrl, setCustomVideoUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<ContentTab>('student');
  
  const [viewMode, setViewMode] = useState<ViewMode>('content');
  const [showCapsuleModal, setShowCapsuleModal] = useState(false);

  // Lessons belonging to the active unit
  const unitLessons = stationInfo.unitNumber 
    ? ALL_LESSONS.filter(l => l.unitNumber === stationInfo.unitNumber)
    : [];

  const currentLessonMeta = ALL_LESSONS.find(l => l.id === currentLessonId) || unitLessons[0];

  // State persistence
  useEffect(() => {
    try {
      localStorage.setItem('parmaga_active_lesson', currentLessonId);
      localStorage.setItem('parmaga_active_station', String(stationInfo.id));
      window.location.hash = `station=${stationInfo.id}&lesson=${currentLessonId}&tab=${activeTab}`;
    } catch {
      // ignore
    }
  }, [currentLessonId, stationInfo.id, activeTab]);

  // Fetch optional custom video URL configured by Admin
  useEffect(() => {
    const fetchCustomVideo = async () => {
      try {
        const db = getFirestore();
        const snap = await getDoc(doc(db, 'settings', 'lesson_videos'));
        if (snap.exists()) {
          const videos = snap.data();
          const safeKey = currentLessonId.replace('/', '_');
          if (videos[safeKey]) {
            setCustomVideoUrl(videos[safeKey]);
          } else {
            setCustomVideoUrl('');
          }
        }
      } catch {
        // Fallback gracefully
      }
    };
    fetchCustomVideo();
  }, [currentLessonId]);

  // Fetch main lesson content
  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        setError(null);

        // If it's a dedicated revision station, fetch the unit capsule directly as primary content
        if (stationInfo.type === 'revision' && stationInfo.unitNumber) {
          const text = await contentService.getUnitCapsule(stationInfo.unitNumber);
          setContent(text);
          setLoading(false);
          return;
        }

        let filename = 'student_content.md';
        if (activeTab === 'slides') filename = 'slides_deck_with_notes.md';
        if (activeTab === 'teacher') filename = 'teacher_mastery_guide.md';

        let text = '';
        try {
          text = await contentService.getLessonContent(currentLessonId, filename);
        } catch (innerErr) {
          if (activeTab !== 'student') {
            text = await contentService.getLessonContent(currentLessonId, 'student_content.md');
          } else {
            throw innerErr;
          }
        }
        
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
      } catch (err: any) {
        setError(err.message || 'تعذر تحميل محتوى الدرس. يرجى التحقق من اشتراكك أو المحاولة لاحقاً.');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [currentLessonId, activeTab, stationInfo.type, stationInfo.unitNumber]);

  // Fetch unit capsule markdown when capsule modal is requested
  const handleOpenCapsule = async () => {
    setShowCapsuleModal(true);
    try {
      setLoadingCapsule(true);
      const unitNum = stationInfo.unitNumber || 1;
      const txt = await contentService.getUnitCapsule(unitNum);
      setCapsuleContent(txt);
    } catch (err: any) {
      setCapsuleContent(`# كبسولة المراجعة A4\n\n⚠️ ${err.message || 'المحتوى مقفل. يتطلب اشتراكاً نشطاً وتفعيل الوحدة.'}`);
    } finally {
      setLoadingCapsule(false);
    }
  };

  const handlePrintCapsule = () => {
    window.print();
  };

  if (viewMode === 'exam') {
    return (
      <ExamEngine 
        lessonId={currentLessonId} 
        onClose={() => setViewMode('content')} 
        examTitle={currentLessonMeta ? `بنك أسئلة: ${currentLessonMeta.title}` : undefined}
      />
    );
  }

  if (viewMode === 'flashcards') {
    return (
      <FlashcardsEngine 
        lessonId={currentLessonId} 
        onClose={() => setViewMode('content')} 
      />
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4 text-center">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-slate-400 font-semibold animate-pulse">جاري فك تشفير وتحميل المحتوى الأكاديمي...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-950/20 border border-rose-500/30 p-6 rounded-3xl text-center max-w-xl mx-auto my-10 space-y-4 shadow-lg shadow-rose-950/10">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
        <h3 className="text-xl font-bold text-white">المحتوى قيد المراجعة</h3>
        <p className="text-sm text-slate-400 leading-relaxed">{error}</p>
        <button 
          onClick={onBack} 
          className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition-colors cursor-pointer"
        >
          العودة للمحطات
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto relative pb-32 animate-in fade-in slide-in-from-bottom-6 duration-500 text-right">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="px-5 py-3 rounded-2xl bg-slate-900 border border-emerald-500/40 text-emerald-300 text-sm font-bold shadow-2xl shadow-emerald-950/50 flex items-center gap-2">
            <Info className="w-4 h-4" />
            {toastMessage}
          </div>
        </div>
      )}

      {/* Top Navigation & Breadcrumb */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button 
          onClick={onBack}
          className="self-start px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-slate-300 text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة لخارطة المحطات</span>
        </button>
        
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold">
            {stationInfo.title}
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold font-mono">
            {stationInfo.subtitle}
          </span>
        </div>
      </div>

      {/* Interactive Unit Lesson Selector Tab Bar */}
      {unitLessons.length > 1 && (
        <div className="mb-6 p-2 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-md">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/60 px-2">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              <span>دروس الوحدة الدراسية ({unitLessons.length} دروس):</span>
            </span>
            <span className="text-[11px] text-emerald-400/80 font-mono">
              الدرس الحالي: {currentLessonMeta?.lessonNumber} من {unitLessons.length}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {unitLessons.map((l) => {
              const isActive = l.id === currentLessonId;
              return (
                <button
                  key={l.id}
                  onClick={() => setCurrentLessonId(l.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-400'
                      : 'bg-slate-950 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800/80'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] ${
                    isActive ? 'bg-emerald-950 text-emerald-300' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {l.lessonNumber}
                  </span>
                  <span>{l.title.split('(')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Protected Video Player Slot */}
        <VideoPlayer videoUrl={customVideoUrl} />

        {/* Content Navigation Tabs (Only for standard lessons) */}
        {stationInfo.type !== 'revision' && (
          <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('student')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'teacher'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>دليل الإتقان ونواتج التعلم</span>
            </button>
          </div>
        )}

        {/* Rich Lesson Body with Protection */}
        <div 
          onContextMenu={(e) => e.preventDefault()}
          className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-6 sm:p-10 shadow-xl shadow-black/20 select-none"
        >
          <article className="prose prose-invert prose-emerald max-w-none select-none 
            prose-headings:font-black prose-headings:tracking-tight
            prose-h1:text-2xl sm:prose-h1:text-3xl prose-h1:mb-6 prose-h1:text-white
            prose-h2:text-xl sm:prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:text-emerald-400 prose-h2:border-b prose-h2:border-slate-800 prose-h2:pb-3
            prose-h3:text-lg sm:prose-h3:text-xl prose-h3:text-slate-200 prose-h3:mt-6
            prose-p:text-slate-300 prose-p:leading-relaxed prose-p:text-base sm:prose-p:text-lg
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
                p: ({node, children, ...props}) => {
                  const txt = String(children);
                  if (txt.includes('موضع الأداة التفاعلية')) {
                    return (
                      <div className="my-8 p-6 rounded-3xl bg-slate-950 border border-indigo-500/30 flex flex-col items-center justify-center text-center space-y-3 shadow-2xl shadow-indigo-950/20 group">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 group-hover:scale-110 transition-transform">
                          <Layers className="w-7 h-7" />
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-white mb-1">المحاكي التفاعلي للدرس (Interactive Sandbox)</h4>
                          <p className="text-xs text-slate-400">تطبيق عملي وتجربة تفاعلية لمحاكاة المفاهيم البرمجية والخوارزميات.</p>
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

      {/* Floating Action Dock */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800/80 px-4 py-3 sm:py-4 shadow-[0_-20px_40px_rgba(0,0,0,0.5)]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
          
          <button 
            onClick={handleOpenCapsule}
            className="w-full sm:w-auto flex-1 flex flex-col items-center justify-center py-2.5 px-3 rounded-2xl bg-amber-600/15 hover:bg-amber-600/25 border border-amber-500/40 text-amber-400 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-2 mb-0.5">
              <FileText className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-xs sm:text-sm">كبسولة الوحدة A4</span>
            </div>
            <span className="text-[10px] text-amber-500/80 font-medium hidden sm:block">
              خلاصة القوانين والمفاهيم الجاهزة للطباعة
            </span>
          </button>

          <button 
            onClick={() => setViewMode('exam')}
            className="w-full sm:w-auto flex-1 flex flex-col items-center justify-center py-2.5 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 border border-emerald-500 shadow-xl shadow-emerald-900/30 text-white transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-2 mb-0.5">
              <HelpCircle className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              <span className="font-bold text-xs sm:text-sm">بنك الأسئلة (100 سؤال)</span>
            </div>
            <span className="text-[10px] text-emerald-200 font-medium hidden sm:block">
              تطبيق فوري وتصحيح آلي ومؤقت تفاعلي
            </span>
          </button>

          <button 
            onClick={() => setViewMode('flashcards')}
            className="w-full sm:w-auto flex-1 flex flex-col items-center justify-center py-2.5 px-3 rounded-2xl bg-indigo-600/15 hover:bg-indigo-600/25 border border-indigo-500/40 text-indigo-400 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-2 mb-0.5">
              <Layers className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
              <span className="font-bold text-xs sm:text-sm">بطاقات الذاكرة (20 بطاقة)</span>
            </div>
            <span className="text-[10px] text-indigo-400/80 font-medium hidden sm:block">
              استرجاع سريع 3D Flashcards
            </span>
          </button>

        </div>
      </div>

      {/* The Printable Capsule Modal */}
      {showCapsuleModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-slate-950/95 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="w-full max-w-4xl bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 text-emerald-400">
                <FileText className="w-6 h-6" />
                <div>
                  <h3 className="text-lg font-bold text-white">الكبسولة الشاملة للمراجعة A4</h3>
                  <p className="text-xs text-slate-400 font-mono" dir="ltr">{stationInfo.subtitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={handlePrintCapsule}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة أو حفظ PDF</span>
                </button>
                <button 
                  onClick={() => setShowCapsuleModal(false)}
                  className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-rose-950/50 hover:text-rose-400 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>
            
            {/* Modal Body: Clean printable document */}
            <div className="p-6 sm:p-10 overflow-y-auto bg-slate-900/80 text-right text-slate-200 flex-1 printable-area" dir="rtl">
              {loadingCapsule ? (
                <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                  <span>جاري إعداد الكبسولة الطباعية...</span>
                </div>
              ) : (
                <article className="prose prose-invert prose-emerald max-w-none
                  prose-headings:font-black
                  prose-h1:text-2xl prose-h1:text-emerald-400 prose-h1:border-b prose-h1:border-slate-800 prose-h1:pb-3
                  prose-h2:text-xl prose-h2:text-white prose-h2:mt-6
                  prose-h3:text-lg prose-h3:text-slate-300
                  prose-p:text-slate-300 prose-p:leading-relaxed
                  prose-table:w-full prose-table:border-collapse
                  prose-th:bg-slate-800 prose-th:p-3 prose-th:text-emerald-400
                  prose-td:p-3 prose-td:border prose-td:border-slate-800
                ">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeRaw, rehypeKatex]}
                  >
                    {capsuleContent}
                  </ReactMarkdown>
                </article>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
