import React, { useState } from 'react';
import type { CurriculumStation } from '../types';
import { LessonViewer } from './LessonViewer';
import { FinalExamsHub } from './FinalExamsHub';
import { ALL_LESSONS } from '../data/curriculumData';
import { useAuth } from '../context/AuthContext';
import { 
  BookOpen, 
  Layers, 
  CheckCircle2, 
  Award, 
  Sparkles, 
  Cpu, 
  Database, 
  LineChart, 
  BrainCircuit, 
  ShieldCheck, 
  FileText,
  HelpCircle,
  PlayCircle,
  ExternalLink,
  ChevronLeft,
  GraduationCap,
  Lock,
  AlertTriangle
} from 'lucide-react';

const STATIONS: CurriculumStation[] = [
  {
    id: 1,
    stationNumber: 1,
    title: 'الفهرس التفاعلي وخارطة الطريق الوزارية',
    subtitle: 'Interactive Master Roadmap & Curriculum Matrix',
    type: 'index',
    status: 'available',
    tags: ['دليل المنهج', 'خارطة طريق'],
    description: 'الرؤية الشاملة لمسار التعلم الوزاري لعام 2026/2027، نسب الإنجاز التراكمية، ومؤشرات الجاهزية للامتحان النهائي.'
  },
  {
    id: 2,
    stationNumber: 2,
    title: 'الوحدة الأولى: المفاهيم الأساسية للبيانات والذكاء الاصطناعي',
    subtitle: 'Unit 1: Data Foundations, AI Architecture & Ethics',
    type: 'unit',
    unitNumber: 1,
    lessonsCount: 4,
    questionsCount: 400,
    flashcardsCount: 80,
    status: 'available',
    tags: ['هرم المعرفة DIKW', 'Big Data 5Vs', 'أخلاقيات AI'],
    description: 'دورة حياة البيانات، هرم DIKW، خوارزميات الذكاء الاصطناعي، وتطبيقات الأتمتة وحوكمة الخوارزميات والحياد البرمجي.'
  },
  {
    id: 3,
    stationNumber: 3,
    title: 'محطة مراجعة وتثبيت الوحدة الأولى',
    subtitle: 'Unit 1 Mastery & Exam Readiness',
    type: 'revision',
    unitNumber: 1,
    questionsCount: 100,
    flashcardsCount: 20,
    status: 'available',
    tags: ['كبسولة مركزة A4', 'بنك 100 سؤال', 'فيديو المراجعة'],
    description: 'كبسولة المراجعة A4 المركزة، بنك الأسئلة التدريبي المفسر، وبطاقات الذاكرة ثلاثية الأبعاد.'
  },
  {
    id: 4,
    stationNumber: 4,
    title: 'الوحدة الثانية: أمن البيانات والشبكات والتعافي من الكوارث',
    subtitle: 'Unit 2: Cryptography, Network Security & Incident Response',
    type: 'unit',
    unitNumber: 2,
    lessonsCount: 3,
    questionsCount: 300,
    flashcardsCount: 60,
    status: 'available',
    tags: ['التشفير المتناظر/اللامتناظر', 'Zero Trust', 'RTO/RPO'],
    description: 'تقنيات التشفير والمصادقة، جدران الحماية IDS/IPS، ومعمارية الثقة الصفرية، وسياسات استمرارية الأعمال والتعافي.'
  },
  {
    id: 5,
    stationNumber: 5,
    title: 'محطة مراجعة وتثبيت الوحدة الثانية',
    subtitle: 'Unit 2 Mastery & Exam Readiness',
    type: 'revision',
    unitNumber: 2,
    questionsCount: 100,
    flashcardsCount: 20,
    status: 'available',
    tags: ['كبسولة أمنية A4', 'مسائل التشفير', 'بطاقات حفظ'],
    description: 'تثبيت مفاهيم أمن البيانات، استراتيجيات التشفير، وحل مسائل الكنترول الوزارية الـ 6 درجات.'
  },
  {
    id: 6,
    stationNumber: 6,
    title: 'الوحدة الثالثة: بنية وتطوير تطبيقات الويب الحديثة',
    subtitle: 'Unit 3: Web App Architecture, Protocols & Frontend',
    type: 'unit',
    unitNumber: 3,
    lessonsCount: 3,
    questionsCount: 300,
    flashcardsCount: 60,
    status: 'available',
    tags: ['Client-Server', 'WebSockets & REST', 'DOM Pipelines'],
    description: 'معماريات الويب وأنماط MVC، بروتوكولات الاتصال الفوري والمصافحة، وأساسيات هندسة الواجهات التفاعلية.'
  },
  {
    id: 7,
    stationNumber: 7,
    title: 'محطة مراجعة وتثبيت الوحدة الثالثة',
    subtitle: 'Unit 3 Mastery & Exam Readiness',
    type: 'revision',
    unitNumber: 3,
    questionsCount: 100,
    flashcardsCount: 20,
    status: 'available',
    tags: ['كبسولة الويب A4', 'بروتوكولات HTTP', '100 سؤال'],
    description: 'الكبسولة الشاملة لهندسة بروتوكولات وتطبيقات الويب مع نماذج إجابة الكنترول التحريرية.'
  },
  {
    id: 8,
    stationNumber: 8,
    title: 'الوحدة الرابعة: الوسائط الرقمية وهندسة تجربة المستخدم UX/UI',
    subtitle: 'Unit 4: Media Compression, UX Architecture & Web Auditing',
    type: 'unit',
    unitNumber: 4,
    lessonsCount: 4,
    questionsCount: 400,
    flashcardsCount: 80,
    status: 'available',
    tags: ['خوارزميات الضغط', 'هرمية المعلومات', 'WCAG & A/B Testing'],
    description: 'خصائص الوسائط وضغط الصوت والصورة، أسس تجربة المستخدم والاستدلالات، معايير إمكانية الوصول، والتحسين التكراري.'
  },
  {
    id: 9,
    stationNumber: 9,
    title: 'محطة مراجعة وتثبيت الوحدة الرابعة',
    subtitle: 'Unit 4 Mastery & Exam Readiness',
    type: 'revision',
    unitNumber: 4,
    questionsCount: 100,
    flashcardsCount: 20,
    status: 'available',
    tags: ['كبسولة UX/UI', 'معايير WCAG', 'أسئلة معللة'],
    description: 'كبسولة مراجعة الوسائط الرقمية وتصميم الواجهات، مع أسئلة المقارنة والتحليل العملي.'
  },
  {
    id: 10,
    stationNumber: 10,
    title: 'الوحدة الخامسة: جمع البيانات وتنظيفها والبيانات المفتوحة APIs',
    subtitle: 'Unit 5: Data Extraction, Cleaning & Open Data APIs',
    type: 'unit',
    unitNumber: 5,
    lessonsCount: 3,
    questionsCount: 300,
    flashcardsCount: 60,
    status: 'available',
    tags: ['Scraping & Sensors', 'معالجة القيم الشاذة', 'REST APIs'],
    description: 'استراتيجيات سحب البيانات، المعالجة الهيكلية وتنقية القيم المفقودة Outliers، واستخدام واجهات برمجة التطبيقات المفتوحة.'
  },
  {
    id: 11,
    stationNumber: 11,
    title: 'محطة مراجعة وتثبيت الوحدة الخامسة',
    subtitle: 'Unit 5 Mastery & Exam Readiness',
    type: 'revision',
    unitNumber: 5,
    questionsCount: 100,
    flashcardsCount: 20,
    status: 'available',
    tags: ['كبسولة التنظيف A4', 'هندسة البيانات', 'بنك 100 سؤال'],
    description: 'خطوات تنقية وتجهيز البيانات البرمجية وقواعد استهلاك الـ APIs بالخطوات النموذجية.'
  },
  {
    id: 12,
    stationNumber: 12,
    title: 'الوحدة السادسة: الاستدلال الإحصائي ونماذج الانحدار وتصور البيانات',
    subtitle: 'Unit 6: Statistical Inference, Regression & Data Viz',
    type: 'unit',
    unitNumber: 6,
    lessonsCount: 3,
    questionsCount: 300,
    flashcardsCount: 60,
    status: 'available',
    tags: ['اختبار الفرضيات p-value', 'الانحدار الخطي واللوجستي', 'Storytelling Dashboards'],
    description: 'فترات الثقة واختبار الفرضيات الإحصائية، تقييم نماذج الانحدار ومعامل R²، وقواعد الترميز البصري والرسوم البيانية المؤثرة.'
  },
  {
    id: 13,
    stationNumber: 13,
    title: 'محطة مراجعة وتثبيت الوحدة السادسة',
    subtitle: 'Unit 6 Mastery & Exam Readiness',
    type: 'revision',
    unitNumber: 6,
    questionsCount: 100,
    flashcardsCount: 20,
    status: 'available',
    tags: ['كبسولة الإحصاء A4', 'قوانين الانحدار', 'مخططات بيانية'],
    description: 'كبسولة قوانين الاستدلال الإحصائي، وتفسير المخططات وقراءة نتائج الانحدار المتوقعة وزارياً.'
  },
  {
    id: 14,
    stationNumber: 14,
    title: 'الوحدة السابعة: أسس تعلم الآلة والشبكات العصبية ونماذج LLMs',
    subtitle: 'Unit 7: Machine Learning, Deep Neural Nets & GenAI LLMs',
    type: 'unit',
    unitNumber: 7,
    lessonsCount: 3,
    questionsCount: 300,
    flashcardsCount: 60,
    status: 'available',
    tags: ['التعلم الموجه/غير الموجه', 'Perceptron & CNNs', 'النماذج اللغوية LLMs'],
    description: 'أنماط تعلم الآلة، بنية الشبكات العصبية والانتشار العكسي Backpropagation، وثورة نماذج الذكاء الاصطناعي التوليدي.'
  },
  {
    id: 15,
    stationNumber: 15,
    title: 'محطة مراجعة وتثبيت الوحدة السابعة',
    subtitle: 'Unit 7 Mastery & Exam Readiness',
    type: 'revision',
    unitNumber: 7,
    questionsCount: 100,
    flashcardsCount: 20,
    status: 'available',
    tags: ['كبسولة الذكاء الاصطناعي A4', 'شبكات عميقة', '100 سؤال'],
    description: 'كبسولة مراجعة الشبكات العصبية والـ LLMs، مع نماذج تدريبية شاملة تحاكي أسئلة الثانوية العامة.'
  },
  {
    id: 16,
    stationNumber: 16,
    title: 'المحطة الكبرى: المراجعة الشاملة وامتحانات المحاكاة الوزارية',
    subtitle: 'Grand Finale: 5 Comprehensive Ministerial Mock Exams (250 Questions)',
    type: 'mega_exam',
    questionsCount: 250,
    flashcardsCount: 460,
    status: 'available',
    tags: ['5 امتحانات وزارية', 'محاكاة زمنية كاملة', 'تصحيح كنترول'],
    description: 'محاكي الامتحان الوزاري الفعلي بكامل ضوابط الوقت، التصحيح المعتمد، ومراجعة أوراق الامتحانات الشاملة الخمسة.'
  }
];

export const CurriculumStations: React.FC = () => {
  const { user, userProfile } = useAuth();
  const [filter, setFilter] = useState<'all' | 'units' | 'revisions'>('all');
  const [selectedStation, setSelectedStation] = useState<CurriculumStation | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string>('unit_1/lesson_1_1');
  const [viewingLesson, setViewingLesson] = useState<boolean>(false);
  const [showMegaExam, setShowMegaExam] = useState<boolean>(false);
  const [accessDeniedMessage, setAccessDeniedMessage] = useState<string | null>(null);

  const isStaff = userProfile?.role === 'admin' || userProfile?.role === 'assistant';
  const hasActiveSubscription = userProfile?.subscriptionStatus === 'active';
  const unlockedUnits = Array.isArray(userProfile?.unlockedUnits) ? userProfile.unlockedUnits : [];

  const isStationAccessible = (station: CurriculumStation): boolean => {
    if (isStaff) return true;
    if (station.type === 'index') return true;
    if (!user) return false;
    if (!hasActiveSubscription) return false;

    if (station.type === 'unit' || station.type === 'revision') {
      return station.unitNumber ? unlockedUnits.includes(station.unitNumber) : false;
    }
    if (station.type === 'mega_exam') {
      return unlockedUnits.length > 0;
    }
    return false;
  };

  const filteredStations = STATIONS.filter(st => {
    if (filter === 'units') return st.type === 'unit';
    if (filter === 'revisions') return st.type === 'revision' || st.type === 'mega_exam';
    return true;
  });

  const handleStartStation = (station: CurriculumStation, explicitLessonId?: string) => {
    if (!isStationAccessible(station)) {
      if (!user) {
        setAccessDeniedMessage('يرجى تسجيل الدخول أولاً للوصول إلى المحتوى الدراسي.');
      } else if (!hasActiveSubscription) {
        setAccessDeniedMessage('حسابك الحالي لا يمتلك اشتراكاً نشطاً. يرجى الاشتراك في إحدى الباقات لتفعيل الوحدات.');
      } else if (station.unitNumber && !unlockedUnits.includes(station.unitNumber)) {
        setAccessDeniedMessage(`الوحدة ${station.unitNumber} غير مفعلة في حسابك. يمكنك التواصل مع الإدارة لترقية باقتك.`);
      } else {
        setAccessDeniedMessage('هذا المحتوى مقفل حالياً بحسب خطة اشتراكك.');
      }
      return;
    }

    setSelectedStation(station);

    if (station.type === 'mega_exam') {
      setShowMegaExam(true);
      setViewingLesson(false);
      return;
    }

    if (station.type === 'unit' || station.type === 'revision') {
      const lessonToOpen = explicitLessonId || (
        station.unitNumber 
          ? ALL_LESSONS.find(l => l.unitNumber === station.unitNumber)?.id || 'unit_1/lesson_1_1'
          : 'unit_1/lesson_1_1'
      );
      setSelectedLessonId(lessonToOpen);
      setViewingLesson(true);
      setShowMegaExam(false);
    }
  };

  if (showMegaExam) {
    return (
      <FinalExamsHub 
        onClose={() => {
          setShowMegaExam(false);
          setSelectedStation(null);
        }}
      />
    );
  }

  if (viewingLesson && selectedStation && (selectedStation.type === 'unit' || selectedStation.type === 'revision')) {
    return (
      <LessonViewer 
        lessonId={selectedLessonId}
        stationInfo={selectedStation} 
        onBack={() => {
          setViewingLesson(false);
          setSelectedStation(null);
        }} 
      />
    );
  }

  return (
    <div className="space-y-8 text-right">
      {/* Hero Welcome banner */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/30 overflow-hidden shadow-2xl">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>بوابة التعلم والتحصيل المعتمدة لمقرر علوم البيانات والذكاء الاصطناعي</span>
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
            مرحباً بك في محطات المنهج الـ 16 لمنصة <span className="text-emerald-400">parmaga</span>
          </h2>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            تم استيعاب وتوثيق المنهج بالكامل (23 درساً عبر 7 وحدات تخصصية، 2550 سؤالاً مفسراً، 460 بطاقة استرجاع، و5 امتحانات وزارية شاملة). حسابك مؤمّن ومقترن بجهازك المعتمد.
          </p>

          <div className="mt-6 flex flex-wrap gap-3 sm:gap-4 text-xs">
            <div className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span><strong>23 درساً</strong> تخصصياً مع مقاطع الشرح</span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-teal-400" />
              <span><strong>2550 سؤالاً</strong> بنظام التفسير الفوري</span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span><strong>460 بطاقة</strong> استرجاع 3D Flashcards</span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>العلامة المائية الرقمية مفعلة</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Stations Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            <span>خارطة المحطات التعليمية الـ 16</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            تصفح الوحدات السبع، محطات المراجعة والكبسولات، ومحاكي الامتحانات الشاملة
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            جميع المحطات (16)
          </button>
          <button
            type="button"
            onClick={() => setFilter('units')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filter === 'units'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            الوحدات الدراسية (7)
          </button>
          <button
            type="button"
            onClick={() => setFilter('revisions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filter === 'revisions'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            المراجعات والامتحانات (9)
          </button>
        </div>
      </div>

      {/* Access Denied Alert Modal / Banner */}
      {accessDeniedMessage && (
        <div className="p-4 rounded-2xl bg-amber-950/80 border border-amber-500/50 text-amber-200 flex items-start justify-between gap-3 shadow-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-sm text-white">تنبيه الوصول للمحتوى</div>
              <div className="text-xs mt-0.5">{accessDeniedMessage}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAccessDeniedMessage(null)}
            className="text-xs px-2 py-1 rounded-lg bg-amber-900 hover:bg-amber-800 text-white font-medium cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* Grid of Stations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredStations.map((station) => {
          const isMega = station.type === 'mega_exam';
          const isRevision = station.type === 'revision';
          const isUnit = station.type === 'unit';
          const isAccessible = isStationAccessible(station);
          const unitLessons = isUnit && station.unitNumber 
            ? ALL_LESSONS.filter(l => l.unitNumber === station.unitNumber) 
            : [];

          return (
            <div
              key={station.id}
              className={`relative rounded-3xl border p-5 transition-all flex flex-col justify-between ${
                !isAccessible
                  ? 'bg-slate-950/60 border-slate-800/80 opacity-90'
                  : isMega
                  ? 'bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border-amber-500/40 hover:border-amber-400 shadow-xl shadow-amber-950/20'
                  : isRevision
                  ? 'bg-gradient-to-br from-teal-950/30 via-slate-900 to-slate-900 border-teal-500/30 hover:border-teal-400/60 shadow-lg'
                  : 'bg-slate-900/90 border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900 shadow-md'
              }`}
            >
              <div>
                {/* Station Badge Header */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono ${
                    !isAccessible
                      ? 'bg-slate-800 text-slate-400 border border-slate-700'
                      : isMega
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : isRevision
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                      : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'
                  }`}>
                    المحطة {station.stationNumber}
                  </span>

                  <div className={`flex items-center gap-1.5 text-xs font-semibold ${
                    isAccessible ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {isAccessible ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>متاح للمشتركين</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>مقفلة - تتطلب تفعيلاً</span>
                      </>
                    )}
                  </div>
                </div>

                <h4 className="text-base font-bold text-white line-clamp-2 mb-1">
                  {station.title}
                </h4>
                <p className="text-[11px] font-mono text-slate-400 mb-3" dir="ltr">
                  {station.subtitle}
                </p>

                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  {station.description}
                </p>

                {/* Direct Lessons Quick-List for Unit Stations */}
                {isUnit && unitLessons.length > 0 && (
                  <div className="mb-4 p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-400 mb-1 flex items-center justify-between">
                      <span>دروس الوحدة ({unitLessons.length} دروس):</span>
                      <span className={isAccessible ? "text-emerald-400 text-[10px]" : "text-amber-400 text-[10px]"}>
                        {isAccessible ? "انقر للدخول المباشر" : "مقفلة"}
                      </span>
                    </div>
                    {unitLessons.map((l, idx) => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => handleStartStation(station, l.id)}
                        className={`w-full text-right px-2.5 py-1.5 rounded-xl border text-xs flex items-center justify-between transition-colors cursor-pointer group ${
                          isAccessible
                            ? 'bg-slate-900 hover:bg-emerald-950/40 hover:border-emerald-500/30 border-transparent text-slate-300 hover:text-white'
                            : 'bg-slate-900/50 border-transparent text-slate-500 hover:text-slate-400'
                        }`}
                      >
                        <span className="truncate flex items-center gap-1.5">
                          {!isAccessible && <Lock className="w-3 h-3 text-amber-500/70" />}
                          الدرس {idx + 1}: {l.title.split('(')[0]}
                        </span>
                        <ChevronLeft className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 shrink-0 transition-transform group-hover:-translate-x-0.5" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                {/* Station Metrics */}
                <div className="pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs text-slate-400 mb-4">
                  {station.lessonsCount ? (
                    <div>
                      دروس الوحدة: <strong className="text-white">{station.lessonsCount} دروس</strong>
                    </div>
                  ) : null}
                  {station.questionsCount ? (
                    <div>
                      بنك الأسئلة: <strong className={isAccessible ? "text-emerald-400" : "text-slate-400"}>{station.questionsCount} سؤالاً</strong>
                    </div>
                  ) : null}
                  {station.flashcardsCount ? (
                    <div>
                      الفلاش كاردز: <strong className={isAccessible ? "text-teal-300" : "text-slate-400"}>{station.flashcardsCount} بطاقة</strong>
                    </div>
                  ) : null}
                </div>

                {/* Primary Action Button */}
                <button
                  type="button"
                  onClick={() => handleStartStation(station)}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    !isAccessible
                      ? 'bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700'
                      : isMega
                      ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-950/40'
                      : isRevision
                      ? 'bg-teal-700 hover:bg-teal-600 text-white shadow-md'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                  }`}
                >
                  {!isAccessible ? (
                    <>
                      <Lock className="w-4 h-4 text-amber-400" />
                      <span>محتوى مقفل (انقر للاشتراك أو التفعيل)</span>
                    </>
                  ) : (
                    <>
                      <PlayCircle className="w-4 h-4" />
                      <span>
                        {isMega ? 'فتح مركز الامتحانات الشاملة (5 نماذج)' : isRevision ? 'فتح كبسولة المراجعة A4' : 'استعراض الوحدة والدروس'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
