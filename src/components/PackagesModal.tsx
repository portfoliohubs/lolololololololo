import React from 'react';
import { useAuth } from '../context/AuthContext';
import { SUBSCRIPTION_PACKAGES } from '../data/curriculumData';
import { Check, Lock, Clock, Sparkles, MessageCircle, X, ShieldCheck, Zap } from 'lucide-react';

interface PackagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  highlightedUnit?: number;
}

export const PackagesModal: React.FC<PackagesModalProps> = ({ isOpen, onClose, highlightedUnit }) => {
  const { userProfile, user } = useAuth();

  if (!isOpen) return null;

  const currentUnlockedUnits = userProfile?.unlockedUnits || [1]; // default unit 1 preview
  const isAllUnlocked = currentUnlockedUnits.length >= 7 || userProfile?.role === 'admin';

  const getPackageStatus = (pkgId: string) => {
    if (userProfile?.role === 'admin') return 'active';
    if (pkgId === 'full_semester') {
      if (isAllUnlocked) return 'active';
      if (userProfile?.packageStatus === 'pending') return 'pending';
      return 'locked';
    }
    if (pkgId === 'unit_pass') {
      if (highlightedUnit && currentUnlockedUnits.includes(highlightedUnit)) return 'active';
      return currentUnlockedUnits.length > 1 ? 'active' : 'locked';
    }
    if (pkgId === 'final_revision') {
      return userProfile?.activePackageId === 'final_revision' ? 'active' : 'locked';
    }
    return 'locked';
  };

  const handleContactWhatsApp = (pkgName: string, price: number) => {
    const studentName = userProfile?.fullName || 'طالب جديد';
    const studentEmail = userProfile?.email || '';
    const phone = userProfile?.phone || '';
    const message = encodeURIComponent(
      `السلام عليكم، أود تفعيل "${pkgName}" (${price} ج.م) على منصة برمجتكم 2026 - 2027.\nالاسم: ${studentName}\nالبريد: ${studentEmail}\nالهاتف: ${phone}`
    );
    window.open(`https://wa.me/201000000000?text=${message}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-right my-8 shadow-2xl relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 left-6 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>العام الدراسي 2026 - 2027</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            باقات واشتراكات منصة برمجتكم
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            اختر الباقة الأنسب لمسارك التعليمي واستمتع بوصول غير محدود لبنوك الأسئلة والشروحات التخصصية
          </p>
        </div>

        {/* Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SUBSCRIPTION_PACKAGES.map((pkg) => {
            const status = getPackageStatus(pkg.id);

            return (
              <div
                key={pkg.id}
                className={`rounded-3xl p-6 flex flex-col justify-between relative transition-all border ${
                  pkg.isPopular
                    ? 'bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950/30 border-emerald-500/50 shadow-xl shadow-emerald-950/20'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                {pkg.badge && (
                  <div className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-emerald-500 text-slate-950 text-[11px] font-black shadow-md">
                    {pkg.badge}
                  </div>
                )}

                <div>
                  {/* Status Tag */}
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                        status === 'active'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : status === 'pending'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {status === 'active' && <Check className="w-3 h-3" />}
                      {status === 'pending' && <Clock className="w-3 h-3 animate-spin" />}
                      {status === 'locked' && <Lock className="w-3 h-3" />}
                      <span>
                        {status === 'active'
                          ? 'مفعلة بحسابك'
                          : status === 'pending'
                          ? 'بانتظار التفعيل'
                          : 'مقفلة'}
                      </span>
                    </span>

                    <span className="text-xs font-mono text-slate-400">2026 - 2027</span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2">{pkg.name}</h3>
                  <p className="text-xs text-slate-400 mb-4 leading-relaxed">{pkg.description}</p>

                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-3xl font-black text-white">{pkg.priceEGP}</span>
                    <span className="text-xs text-slate-400 font-semibold">ج.م / اشتراك رسمي</span>
                  </div>

                  {/* Features List */}
                  <div className="space-y-2.5 mb-6 text-xs text-slate-300">
                    {pkg.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="leading-tight">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action CTA */}
                <div>
                  {status === 'active' ? (
                    <div className="w-full py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      <span>الباقة نشطة ومتاحة</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleContactWhatsApp(pkg.name, pkg.priceEGP)}
                      className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        pkg.isPopular
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-950/40'
                          : 'bg-slate-800 hover:bg-slate-700 text-white'
                      }`}
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>تفعيل الباقة عبر المشرف</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="mt-8 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>التفعيل الفوري متاح على مدار الساعة عبر التحويل البنكي أو فودافون كاش أو إنستاباي.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-300 hover:text-white underline font-semibold"
          >
            إغلاق ومتابعة التعلم
          </button>
        </div>
      </div>
    </div>
  );
};
