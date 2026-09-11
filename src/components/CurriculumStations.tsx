import React, { useState } from 'react';
import type { CurriculumStation } from '../types';
import { LessonViewer } from './LessonViewer';
import { FinalExamsHub } from './FinalExamsHub';
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
  Lock
} from 'lucide-react';

const STATIONS: CurriculumStation[] = [
  {
    id: 1,
    stationNumber: 1,
    title: 'الفهرس التفاعلي الرئيسي وخارطة الطريق',
    subtitle: 'Clickable Master Roadmap & Progress Index',
    type: 'index',
    status: 'available',
    tags: ['دليل المنهج', 'خارطة طريق'],
    description: 'الرؤية الشاملة لمسار التعلم، نسب الإنجاز التراكمية، ومؤشرات الجاهزية للامتحان الوزاري.'
  },
  {
    id: 2,
    stationNumber: 2,
    title: 'الوحدة الأولى: المفاهيم الأساسية للبيانات والسحابة',
    subtitle: 'Data Foundations & Cloud Infrastructure',
    type: 'unit',
    unitNumber: 1,
    lessonsCount: 3,
    questionsCount: 150,
    flashcardsCount: 60,
    status: 'available',
    tags: ['البيانات', 'السحابة الحوسبية', 'Big Data'],
    description: 'دورة حياة البيانات، الحوسبة السحابية، وخصائص البيانات الضخمة الـ 5Vs مع التطبيقات المعاصرة.'
  },
  {
    id: 3,
    stationNumber: 3,
    title: 'محطة مراجعة وتثبيت الوحدة الأولى',
    subtitle: 'Unit 1 Mastery & Exam Readiness',
    type: 'revision',
    unitNumber: 1,
    questionsCount: 50,
    flashcardsCount: 20,
    status: 'available',
    tags: ['كبسولة مركزة', 'بنك 50 سؤال', 'فيديو 7 دقائق'],
    description: 'كبسولة المراجعة A4 المركزة، بنك الأسئلة التدريبي المفسر، وبطاقات الذاكرة ثلاثية الأبعاد.'
  },
  {
    id: 4,
    stationNumber: 4,
    title: 'الوحدة الثانية: أمن البيانات والتعافي ومكعبات OLAP',
    subtitle: 'Security, Disaster Recovery & OLAP Cubes',
    type: 'unit',
    unitNumber: 2,
    lessonsCount: 3,
    questionsCount: 150,
    flashcardsCount: 60,
    status: 'available',
    tags: ['التشفير', 'النسخ الاحتياطي', 'مكعبات OLAP'],
    description: 'أمن البيانات، سياسات التعافي من الكوارث (RTO/RPO)، المعالجة التحليلية المباشرة OLAP وتقنيات Slice & Dice.'
  },
  {
    id: 5,
    stationNumber: 5,
    title: 'محطة مراجعة وتثبيت الوحدة الثانية',
    subtitle: 'Unit 2 Mastery & Exam Readiness',
    type: 'revision',
    unitNumber: 2,
    questionsCount: 50,
    flashcardsCount: 20,
    status: 'available',
    tags: ['كبسولة أمنية', 'تمارين OLAP', 'بطاقات حفظ'],
    description: 'تثبيت مفاهيم أمن البيانات، استراتيجيات التشفير، وحل مسائل الـ 6 درجات الوزارية المتوقعة.'
  },
  {
    id: 6,
    stationNumber: 6,
    title: 'الوحدة الثالثة: تنظيف وهندسة البيانات البرمجية',
    subtitle: 'Data Wrangling & Feature Engineering',
    type: 'unit',
    unitNumber: 3,
    lessonsCount: 3,
    questionsCount: 150,
    flashcardsCount: 60,
    status: 'available',
    tags: ['معالجة القيم المفقودة', 'القيم الشاذة', 'Pandas'],
    description: 'تقنيات تنظيف البيانات، استراتيجيات معالجة القيم المفقودة Outliers، والتحويلات الهندسية للمتغيرات.'
  },
  {
    id: 7,
    stationNumber: 7,
    title: 'محطة مراجعة وتثبيت الوحدة الثالثة',
    subtitle: 'Unit 3 Mastery & Exam Readiness',
    type: 'revision',
    unitNumber: 3,
    questionsCount: 50,
    flashcardsCount: 20,
    status: 'available',
    tags: ['كبسولة المعالجة', 'مراجعة الكود', '50 سؤالاً'],
    description: 'الكبسولة الشاملة لخطوات معالجة وتنظيف البيانات مع التدريب على أسئلة الامتحان التحريرية.'
  },
  {
    id: 8,
    stationNumber: 8,
    title: 'الوحدة الرابعة: التحليل الاستكشافي المرئي للبيانات EDA',
    subtitle: 'Exploratory Data Analysis & Visualizations',
    type: 'unit',
    unitNumber: 4,
    lessonsCount: 3,
    questionsCount: 150,
    flashcardsCount: 60,
    status: 'available',
    tags: ['الرسوم البيانية', 'مخططات الصندوق', 'المدرج التكراري'],
    description: 'أصول التحليل البصري الاستكشافي، اختيار المخطط الإحصائي الأمثل، وقراءة وتفسير الرسوم البيانية بدقة.'
  },
  {
    id: 9,
    stationNumber: 9,
    title: 'محطة مراجعة وتثبيت الوحدة الرابعة',
    subtitle: 'Unit 4 Mastery & Exam Readiness',
    type: 'revision',
    unitNumber: 4,
    questionsCount: 50,
    flashcardsCount: 20,
    status: 'available',
    tags: ['كبسولة EDA', 'تحليل المخططات', 'أسئلة معللة'],
    description: 'مراجعة مخططات الصندوق Box Plots والانتشار Scatter وحل أسئلة التفسير البياني.'
  },
  {
    id: 10,
    stationNumber: 10,
    title: 'الوحدة الخامسة: الاحتمالات والإحصاء الرياضي ومبرهنة بايز',
    subtitle: 'Probability, Statistics & Bayes Theorem',
    type: 'unit',
    unitNumber: 5,
    lessonsCount: 3,
    questionsCount: 150,
    flashcardsCount: 60,
    status: 'available',
    tags: ['مبرهنة بايز', 'الاحتمال الشرطي', 'معادلات رياضية'],
    description: 'الاحتمال الشرطي، الاستقلال الإحصائي، وتطبيق مبرهنة بايز Bayes Theorem في تصفية الرسائل المزعجة والتشخيص.'
  },
  {
    id: 11,
    stationNumber: 11,
    title: 'محطة مراجعة وتثبيت الوحدة الخامسة',
    subtitle: 'Unit 5 Mastery & Exam Readiness',
    type: 'revision',
    unitNumber: 5,
    questionsCount: 50,
    flashcardsCount: 20,
    status: 'available',
    tags: ['كبسولة بايز', 'مسائل إحصائية', 'بنك 50 سؤال'],
    description: 'خطوات حل مسائل بايز الـ 6 درجات الوزارية بالخطوات النموذجية وجداول الاحتمالات.'
  },
  {
    id: 12,
    stationNumber: 12,
    title: 'الوحدة السادسة: تعلم الآلة ومصفوفة الارتباك والانحدار',
    subtitle: 'Machine Learning & Confusion Matrix',
    type: 'unit',
    unitNumber: 6,
    lessonsCount: 3,
    questionsCount: 150,
    flashcardsCount: 60,
    status: 'available',
    tags: ['Confusion Matrix', 'الانحدار الخطي', 'دقة النموذج'],
    description: 'التعلم الخاضع للإشراف، الانحدار والتصنيف، وحساب مقاييس الدقة (Precision, Recall, F1-Score) عبر مصفوفة الارتباك.'
  },
  {
    id: 13,
    stationNumber: 13,
    title: 'محطة مراجعة وتثبيت الوحدة السادسة',
    subtitle: 'Unit 6 Mastery & Exam Readiness',
    type: 'revision',
    unitNumber: 6,
    questionsCount: 50,
    flashcardsCount: 20,
    status: 'available',
    tags: ['كبسولة التعلم الآلي', 'قوانين المقاييس', 'بطاقات مفاهيم'],
    description: 'كبسولة قوانين المقاييس الإحصائية للنماذج وحساب الحساسية والدقة المتوقعة في الامتحان.'
  },
  {
    id: 14,
    stationNumber: 14,
    title: 'الوحدة السابعة: الشبكات العصبية والذكاء الاصطناعي التوليدي LLMs',
    subtitle: 'Neural Networks & Generative AI',
    type: 'unit',
    unitNumber: 7,
    lessonsCount: 3,
    questionsCount: 150,
    flashcardsCount: 60,
    status: 'available',
    tags: ['الشبكات العصبية', 'التعلم العميق', 'النماذج اللغوية LLMs'],
    description: 'معمارية الخلايا العصبية الاصطناعية Perceptron، دوال التنشيط، ودخول عصر نماذج اللغة التوليدية الكبيرة.'
  },
  {
    id: 15,
    stationNumber: 15,
    title: 'محطة مراجعة وتثبيت الوحدة السابعة',
    subtitle: 'Unit 7 Mastery & Exam Readiness',
    type: 'revision',
    unitNumber: 7,
    questionsCount: 50,
    flashcardsCount: 20,
    status: 'available',
    tags: ['كبسولة الذكاء الاصطناعي', 'شبكات عصبية', '50 سؤالاً'],
    description: 'كبسولة مراجعة الذكاء الاصطناعي التوليدي، مع نماذج تدريبية شاملة للأسئلة الحديثة.'
  },
  {
    id: 16,
    stationNumber: 16,
    title: 'المحطة الكبرى: المراجعة الشاملة وامتحانات الـ 1000 سؤال',
    subtitle: 'Grand Finale: 1000 Ministerial Mock Exam Simulator',
    type: 'mega_exam',
    questionsCount: 1000,
    flashcardsCount: 460,
    status: 'available',
    tags: ['امتحان وزاري نهائي', '1000 سؤال', 'محاكاة كاملة'],
    description: 'محاكي الامتحان الوزاري الفعلي بكامل ضوابط الوقت والتصحيح الآلي المعتمد وبنك الـ 1000 سؤال التراكمي.'
  }
];

export const CurriculumStations: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'units' | 'revisions'>('all');
  const [selectedStation, setSelectedStation] = useState<CurriculumStation | null>(null);
  const [viewingLesson, setViewingLesson] = useState<boolean>(false);

  const filteredStations = STATIONS.filter(st => {
    if (filter === 'units') return st.type === 'unit';
    if (filter === 'revisions') return st.type === 'revision' || st.type === 'mega_exam';
    return true;
  });

  const handleStartStation = (station: CurriculumStation) => {
    if (station.type === 'unit' || station.type === 'revision') {
      setSelectedStation(station);
      setViewingLesson(true);
    } else if (station.type === 'mega_exam') {
      setSelectedStation(station);
      setViewingLesson(false);
    } else {
      setSelectedStation(station);
    }
  };

  if (viewingLesson && selectedStation && (selectedStation.type === 'unit' || selectedStation.type === 'revision')) {
    return (
      <LessonViewer 
        lessonId="unit_1/lesson_1_1" 
        stationInfo={selectedStation} 
        onBack={() => {
          setViewingLesson(false);
          setSelectedStation(null);
        }} 
      />
    );
  }

  if (selectedStation && selectedStation.type === 'mega_exam') {
    return (
      <FinalExamsHub 
        onClose={() => {
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
            <span>بوابة التعلم والتحصيل المعتمدة لمقرر علوم البيانات</span>
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
            مرحباً بك في محطات المنهج الـ 16 لمنصة <span className="text-emerald-400">parmaga</span>
          </h2>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            تم إعداد المحتوى الأكاديمي والكبسولات المكثفة وبنوك الأسئلة (2550 سؤالاً) وفق المعايير الوزارية المصرية. حسابك مؤمّن ومقترن بنجاح بجهازك الحالي.
          </p>

          <div className="mt-6 flex flex-wrap gap-4 text-xs">
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
              <span><strong>460 بطاقة</strong> استرجاع سريع (Flashcards)</span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>العلامة المائية الرقمية مفعلة بنجاح</span>
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
            تتبع الوحدات الدراسية، المحطات التثبيتية، ومحاكي الامتحان الوزاري
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
            محطات المراجعة والامتحانات (9)
          </button>
        </div>
      </div>

      {/* Grid of Stations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredStations.map((station) => {
          const isMega = station.type === 'mega_exam';
          const isRevision = station.type === 'revision';
          const isUnit = station.type === 'unit';

          return (
            <div
              key={station.id}
              className={`relative rounded-2xl border p-5 transition-all flex flex-col justify-between ${
                isMega
                  ? 'bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border-amber-500/40 hover:border-amber-400 shadow-xl shadow-amber-950/20'
                  : isRevision
                  ? 'bg-gradient-to-br from-teal-950/30 via-slate-900 to-slate-900 border-teal-500/30 hover:border-teal-400/60'
                  : 'bg-slate-900/90 border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900'
              }`}
            >
              <div>
                {/* Station Badge Header */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono ${
                    isMega
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : isRevision
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                      : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'
                  }`}>
                    المحطة {station.stationNumber}
                  </span>

                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>جاهزة للاستعراض</span>
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
                      بنك الأسئلة: <strong className="text-emerald-400">{station.questionsCount} سؤالاً</strong>
                    </div>
                  ) : null}
                  {station.flashcardsCount ? (
                    <div>
                      الفلاش كاردز: <strong className="text-teal-300">{station.flashcardsCount} بطاقة</strong>
                    </div>
                  ) : null}
                </div>

                {/* Action button */}
                <button
                  type="button"
                  onClick={() => handleStartStation(station)}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isMega
                      ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-950/40'
                      : isRevision
                      ? 'bg-teal-700 hover:bg-teal-600 text-white'
                      : 'bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white'
                  }`}
                >
                  <PlayCircle className="w-4 h-4" />
                  <span>استعراض محتويات المحطة</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Station Preview Modal */}
      {selectedStation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5 text-right">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-400">
                  المحطة رقم {selectedStation.stationNumber}
                </span>
                <h3 className="text-xl font-bold text-white mt-1">
                  {selectedStation.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStation(null)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              {selectedStation.description}
            </p>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs text-slate-300">
              <div className="flex items-center justify-between">
                <span>نوع المحطة:</span>
                <strong className="text-white">{selectedStation.type}</strong>
              </div>
              {selectedStation.lessonsCount && (
                <div className="flex items-center justify-between">
                  <span>عدد الدروس التخصصية:</span>
                  <strong className="text-emerald-400">{selectedStation.lessonsCount} دروس</strong>
                </div>
              )}
              {selectedStation.questionsCount && (
                <div className="flex items-center justify-between">
                  <span>إجمالي بنك الأسئلة:</span>
                  <strong className="text-emerald-400">{selectedStation.questionsCount} سؤالاً وزارياً</strong>
                </div>
              )}
              {selectedStation.flashcardsCount && (
                <div className="flex items-center justify-between">
                  <span>بطاقات الاسترجاع (Flashcards):</span>
                  <strong className="text-teal-300">{selectedStation.flashcardsCount} بطاقة 3D</strong>
                </div>
              )}
            </div>

            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-xs text-emerald-300 leading-relaxed">
              💡 مشغل الفيديو الموحد مع العلامة المائية المتحركة KaTeX ومحاكي الـ 100 سؤال جاهز للربط في المرحلة التالية (Stage 2).
            </div>

            <button
              type="button"
              onClick={() => setSelectedStation(null)}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
