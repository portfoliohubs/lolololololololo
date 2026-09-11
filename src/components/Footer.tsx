import React from 'react';
import { ShieldCheck, Sparkles, BookOpen, GraduationCap, Code2, Heart } from 'lucide-react';

interface FooterProps {
  onOpenSEO?: () => void;
  onOpenCurriculum?: () => void;
  onOpenPackages?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenSEO, onOpenCurriculum, onOpenPackages }) => {
  return (
    <footer className="w-full bg-slate-950 border-t border-slate-800/80 mt-auto text-right">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-slate-800/60">
          {/* Brand & Overview */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-white">منصة برمجتكم</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                2026 - 2027
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-lg">
              منصة برمجتكم التعليمية — بيئة تعلم ذكية مصممة لراحتك وتفوقك في علوم البيانات والذكاء الاصطناعي. نتمنى لكم تجربة تعليمية ممتعة ومثمرة.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>بيئة أكاديمية موحدة • بنك 2550 سؤالاً • بطاقات استرجاع 3D</span>
            </div>
          </div>

          {/* Quick Curriculum Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              محاور المنهج
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button
                  type="button"
                  onClick={onOpenCurriculum}
                  className="hover:text-emerald-400 transition-colors text-right"
                >
                  الوحدة 1: هرم المعرفة DIKW وتحديات البيانات
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenCurriculum}
                  className="hover:text-emerald-400 transition-colors text-right"
                >
                  الوحدة 2: الأمن السيبراني والتشفير الحديث
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenCurriculum}
                  className="hover:text-emerald-400 transition-colors text-right"
                >
                  الوحدة 7: نماذج اللغة الكبيرة (LLM) والذكاء التوليدي
                </button>
              </li>
            </ul>
          </div>

          {/* Knowledge Library & SEO */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-emerald-400" />
              المكتبة المعرفية
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button
                  type="button"
                  onClick={onOpenSEO}
                  className="hover:text-emerald-400 transition-colors text-right"
                >
                  مقالات الذكاء الاصطناعي وعلوم البيانات (230 مقال)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenPackages}
                  className="hover:text-emerald-400 transition-colors text-right"
                >
                  باقات واشتراكات العام 2026 - 2027
                </button>
              </li>
              <li>
                <a
                  href="/sitemap.xml"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-emerald-400 transition-colors inline-block"
                >
                  خريطة الموقع (Sitemap XML)
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            جميع الحقوق محفوظة لمنصة <strong className="text-slate-200">برمجتكم (parmaga)</strong> التعليمية © 2026 - 2027
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <span>صُممت بعناية فائقة لخدمة طلاب مصر والوطن العربي</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          </div>
        </div>
      </div>
    </footer>
  );
};

