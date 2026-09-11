import React, { useState } from 'react';
import { 
  Sparkles, 
  BookOpen, 
  HelpCircle, 
  Layers, 
  ShieldCheck, 
  ArrowLeft, 
  Smartphone, 
  CheckCircle2, 
  Zap, 
  Play, 
  GraduationCap, 
  Award,
  ChevronLeft,
  ChevronDown
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { PackagesModal } from './PackagesModal';
import { Footer } from './Footer';
import { ALL_LESSONS, SUBSCRIPTION_PACKAGES } from '../data/curriculumData';

interface LandingPageProps {
  onOpenAuth: (mode: 'login' | 'register') => void;
  onOpenBlog: () => void;
}

const UNITS_OVERVIEW = [
  { id: 'unit-1', num: '01', title: 'هرم المعرفة DIKW وتحديات البيانات', lessons: 3, questions: 350, desc: 'تحويل البيانات الخام إلى حكمة تنفيذية، معايير جودة البيانات، وتنظيف الجداول الضخمة.' },
  { id: 'unit-2', num: '02', title: 'الأمن السيبراني والتشفير الحديث', lessons: 3, questions: 350, desc: 'التشفير المتماثل واللامتماثل RSA، بروتوكول Diffie-Hellman، وبوابات الدفاع السيبراني.' },
  { id: 'unit-3', num: '03', title: 'هياكل البيانات الخوارزمية وتصميم الأنظمة', lessons: 4, questions: 450, desc: 'المصفوفات، القوائم المترابطة، المكدسات، الطوابير، والأشجار الثنائية لتحسين الكفاءة.' },
  { id: 'unit-4', num: '04', title: 'تعلم الآلة (ML) والتحليل التنبئي', lessons: 4, questions: 450, desc: 'خوارزميات الانحدار والتصنيف والتجميع، تقييم النماذج، ودوال الخسارة الرياضية.' },
  { id: 'unit-5', num: '05', title: 'الرؤية الحاسوبية ومعالجة الصور', lessons: 3, questions: 300, desc: 'المرشحات الرقمية، كشف الحواف (Sobel)، والشبكات العصبية الالتفافية (CNN).' },
  { id: 'unit-6', num: '06', title: 'معالجة اللغات الطبيعية (NLP)', lessons: 3, questions: 300, desc: 'تضمين الكلمات (Word2Vec)، تحليل المشاعر، واستخلاص المعنى الدلالي للنصوص.' },
  { id: 'unit-7', num: '07', title: 'نماذج اللغة الكبيرة (LLM) والذكاء التوليدي', lessons: 3, questions: 350, desc: 'معمارية المحولات (Transformer)، آليات الانتباه الذاتي (Self-Attention)، وهندسة الأوامر.' },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth, onOpenBlog }) => {
  const [showPackagesModal, setShowPackagesModal] = useState(false);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-black font-mono shadow-lg shadow-emerald-500/20">
              &lt;/&gt;
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-white">منصة برمجتكم</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 font-mono">
                  2026 - 2027
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                منظومة علوم البيانات والذكاء الاصطناعي للثانوية العامة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onOpenBlog}
              className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>المكتبة ومقالات الـ SEO</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPackagesModal(true)}
              className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>الباقات</span>
            </button>

            <PWAInstallButton />

            <button
              type="button"
              onClick={() => onOpenAuth('login')}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-bold transition-all"
            >
              تسجيل الدخول
            </button>

            <button
              type="button"
              onClick={() => onOpenAuth('register')}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-lg shadow-emerald-950/50 transition-all flex items-center gap-1.5"
            >
              <span>إنشاء حساب</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32">
        {/* Background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-emerald-500/15 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-md">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>المنهج الوزاري المعتمد للثانوية العامة • العام الدراسي 2026 - 2027</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-tight sm:leading-snug max-w-4xl mx-auto">
            احترف <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500">علوم البيانات والذكاء الاصطناعي</span> واضمن الدرجة النهائية
          </h1>

          {/* Description */}
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            البيئة التعليمية الأكثر تطوراً لطلاب الثانوية العامة في مصر. شروحات معمقة، بنوك أسئلة تحاكي امتحانات الكنترول، بطاقات استرجاع ذكية، وتطبيقات عملية تواكب الثورة الرقمية.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              type="button"
              onClick={() => onOpenAuth('register')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-base shadow-xl shadow-emerald-950/60 flex items-center justify-center gap-3 transition-transform hover:scale-105"
            >
              <GraduationCap className="w-5 h-5" />
              <span>ابدأ دراسة المنهج الآن مجاناً</span>
              <ArrowLeft className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => scrollToSection('curriculum-units')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-base transition-colors"
            >
              استعراض وحدات المنهج الـ 7
            </button>
          </div>

          {/* Metrics Numbers Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12 max-w-4xl mx-auto">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
              <div className="text-3xl font-black text-emerald-400 font-mono">7</div>
              <div className="text-xs text-slate-400 mt-1 font-semibold">محاور ومنظومات أساسية</div>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
              <div className="text-3xl font-black text-teal-400 font-mono">23</div>
              <div className="text-xs text-slate-400 mt-1 font-semibold">درساً دراسياً تفاعلياً</div>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
              <div className="text-3xl font-black text-amber-400 font-mono">2550</div>
              <div className="text-xs text-slate-400 mt-1 font-semibold">سؤالاً وزارياً مفسراً</div>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
              <div className="text-3xl font-black text-indigo-400 font-mono">460</div>
              <div className="text-xs text-slate-400 mt-1 font-semibold">بطاقة استرجاع 3D</div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Core Features */}
      <section className="py-16 bg-slate-900/40 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              أدوات تعليمية متكاملة مصممة لتفوقك
            </h2>
            <p className="text-sm text-slate-400">
              صممت المنصة بمعايير هندسية متطورة لتزويدك بكل ما يلزمك لحصد الدرجات النهائية.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-emerald-500/30 transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">محرك الامتحانات الوزارية (Exam Engine)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                100 سؤال لكل درس مقسمة إلى 3 مستويات (تذكر وتطبيق ومستويات عليا)، مع مؤقت دقيق، وتوزيع درجات الكنترول وحفظ فوري للإجابات في IndexedDB عند انقطاع الإنترنت.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-teal-500/30 transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">بطاقات التكرار المتباعد 3D (Flashcards)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                20 بطاقة تفاعلية ثلاثية الأبعاد لكل درس مع تقييم الفهم الشخصي (سهل - متوسط - صعب)، لتثبيت المصطلحات والقواعد البرمجية في الذاكرة طويلة المدى.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-indigo-500/30 transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">قفل الجهاز الواحد وحماية المحتوى</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                بيئة آمنة تضمن استقرار اشتراك الطالب، مع دعم تشغيل الفيديوهات عبر خوادم البث العالمية المشفرة بدون إعلانات وبأعلى جودة صوت وصورة.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Curriculum Units Grid */}
      <section id="curriculum-units" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-emerald-400 text-xs font-bold border border-slate-800">
            <span>محتوى العام الدراسي 2026 - 2027</span>
          </div>
          <h2 className="text-3xl font-black text-white">
            خريطة محاور المنهج الـ 7
          </h2>
          <p className="text-sm text-slate-400">
            تغطي المنصة جميع نواتج التعلم المستهدفة لشهادة الثانوية العامة بشرح وافٍ وتطبيقات دقيقة.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {UNITS_OVERVIEW.map((unit) => (
            <div
              key={unit.id}
              className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black font-mono text-emerald-500/40 group-hover:text-emerald-400 transition-colors">
                    {unit.num}
                  </span>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-semibold">
                    <span className="px-2 py-0.5 rounded-md bg-slate-800">{unit.lessons} دروس</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-950/40 text-emerald-400">{unit.questions} سؤال</span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                  {unit.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {unit.desc}
                </p>
              </div>

              <button
                type="button"
                onClick={() => onOpenAuth('register')}
                className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-emerald-600 text-slate-300 hover:text-white text-xs font-bold border border-slate-800 hover:border-emerald-500 flex items-center justify-center gap-2 transition-all"
              >
                <span>دخول المحور</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Subscription Packages Section */}
      <section className="py-20 bg-gradient-to-b from-slate-950 via-slate-900/60 to-slate-950 border-t border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl font-black text-white">
              باقات الاشتراك للعام الدراسي 2026 - 2027
            </h2>
            <p className="text-sm text-slate-400">
              خيارات اشتراك مرنة تناسب احتياجاتك الدراسية مع إمكانية التفعيل الفوري.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SUBSCRIPTION_PACKAGES.map((pkg) => (
              <div
                key={pkg.id}
                className={`p-6 sm:p-8 rounded-3xl border flex flex-col justify-between space-y-6 transition-all ${
                  pkg.isPopular 
                    ? 'bg-gradient-to-b from-emerald-950/30 to-slate-900 border-emerald-500/50 shadow-2xl shadow-emerald-950/40 ring-1 ring-emerald-500/30' 
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">{pkg.name}</h3>
                    {pkg.isPopular && (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black">
                        الأكثر اختياراً
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-white">{pkg.priceEGP}</span>
                    <span className="text-xs text-slate-400 font-bold">ج.م</span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    {pkg.description}
                  </p>

                  <div className="space-y-2.5 pt-4 border-t border-slate-800/80">
                    {pkg.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenAuth('register')}
                  className={`w-full py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                    pkg.isPopular
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg'
                      : 'bg-slate-800 hover:bg-slate-700 text-white'
                  }`}
                >
                  <span>اشترك في هذه الباقة</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reassuring Academic Integrity Statement */}
      <section className="py-12 bg-slate-950 border-t border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/20">
            <Award className="w-6 h-6" />
          </div>
          <p className="text-sm sm:text-base font-semibold text-slate-300 leading-relaxed">
            «منصة برمجتكم التعليمية — بيئة تعلم ذكية مصممة لراحتك وتفوقك في علوم البيانات والذكاء الاصطناعي. نتمنى لكم تجربة تعليمية ممتعة ومثمرة للعام الدراسي 2026 - 2027.»
          </p>
        </div>
      </section>

      {/* Footer */}
      <Footer 
        onOpenSEO={onOpenBlog}
        onOpenCurriculum={() => scrollToSection('curriculum-units')}
        onOpenPackages={() => setShowPackagesModal(true)}
      />

      {/* Packages Modal */}
      {showPackagesModal && (
        <PackagesModal isOpen={showPackagesModal} onClose={() => setShowPackagesModal(false)} />
      )}
    </div>
  );
};
