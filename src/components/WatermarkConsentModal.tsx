import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Scale, CheckCircle2, FileText, UserCheck, AlertOctagon, Loader2 } from 'lucide-react';

interface WatermarkConsentModalProps {
  isOpen: boolean;
}

export const WatermarkConsentModal: React.FC<WatermarkConsentModalProps> = ({ isOpen }) => {
  const { userProfile, acceptWatermarkConsent } = useAuth();
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!agreed) return;
    setSubmitting(true);
    try {
      await acceptWatermarkConsent();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div 
      id="watermark-consent-modal"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/95 backdrop-blur-xl overflow-y-auto"
    >
      <div className="w-full max-w-2xl bg-slate-900 border-2 border-emerald-500/40 rounded-3xl shadow-2xl shadow-emerald-950/50 overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="relative px-6 py-6 sm:px-8 sm:py-7 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold font-mono">
                  العام الدراسي 2026 - 2027
                </span>
                <span className="text-xs text-slate-400">منصة برمجتكم التعليمية</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                ميثاق الشرف والالتزام الأكاديمي
              </h2>
            </div>
          </div>
        </div>

        {/* Student Identification Banner */}
        <div className="px-6 py-3 bg-slate-950/80 border-b border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-300 gap-2">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span>الطالب العزيز: <strong className="text-white font-bold">{userProfile?.fullName || 'طالب منصة برمجتكم'}</strong></span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>الهاتف: <strong className="text-emerald-300 font-mono" dir="ltr">{userProfile?.phone || 'مسجل بالنظام'}</strong></span>
            <span>المحافظة: <strong className="text-white">{userProfile?.governorate || 'مصر'}</strong></span>
          </div>
        </div>

        {/* Consent Clauses Body */}
        <div className="p-6 sm:p-8 space-y-6 text-slate-200">
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-sm font-semibold leading-relaxed">
            «منصة برمجتكم التعليمية — بيئة تعلم ذكية مصممة لراحتك وتفوقك في علوم البيانات والذكاء الاصطناعي. نتمنى لكم تجربة تعليمية ممتعة ومثمرة.»
          </div>

          <div className="space-y-4">
            {/* Clause 1 */}
            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-950/40 border border-slate-800/70">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold flex items-center justify-center shrink-0 text-sm">
                1
              </div>
              <p className="text-sm leading-relaxed text-slate-300">
                إظهار اسمي ورقم هاتفي كعلامة مائية خفيفة لحفظ الهوية وتخصيص تجربة التعلم التفاعلية طوال فترة المشاهدة.
              </p>
            </div>

            {/* Clause 2 */}
            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-950/40 border border-slate-800/70">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold flex items-center justify-center shrink-0 text-sm">
                2
              </div>
              <p className="text-sm leading-relaxed text-slate-300">
                الحرص على الاستخدام الشخصي للمواد والشروحات والكبسولات لتحقيق أقصى درجات التفوق الأكاديمي.
              </p>
            </div>

            {/* Clause 3 */}
            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-950/40 border border-slate-800/70">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold flex items-center justify-center shrink-0 text-sm">
                3
              </div>
              <p className="text-sm leading-relaxed text-slate-300">
                الالتزام بالحفاظ على بيانات الحساب وعدم مشاركته، لدعم جودة الخدمة واستقرار المنظومة التعليمية.
              </p>
            </div>
          </div>

          {/* Academic badge */}
          <div className="flex flex-wrap gap-2 pt-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/80 text-emerald-400 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              بيئة تعليمية ذكية ومطمئنة
            </span>
          </div>

          {/* Checkbox */}
          <label className="flex items-start gap-3 p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 cursor-pointer select-none group transition-colors hover:bg-emerald-950/40">
            <input
              id="watermark-consent-checkbox"
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-500"
            />
            <div className="text-xs sm:text-sm text-emerald-200 leading-relaxed font-semibold">
              أقر بأنني اطلعت على ميثاق الالتزام الأكاديمي، وأتعهد بالالتزام به لبدء رحلة التعلم والتفوق.
            </div>
          </label>
        </div>

        {/* Modal Action Footer */}
        <div className="px-6 py-5 sm:px-8 sm:py-6 bg-slate-950 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>نرحب بك في منصة برمجتكم ونتمنى لك مستقبلاً باهراً في علوم البيانات.</span>
          </div>

          <button
            id="btn-agree-watermark-consent"
            type="button"
            disabled={!agreed || submitting}
            onClick={handleConfirm}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/50 transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جارٍ تأكيد الاشتراك...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>الموافقة وبدء الدراسة</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
