import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Laptop, 
  Smartphone, 
  ShieldAlert, 
  RefreshCw, 
  LogOut, 
  CheckCircle2, 
  AlertTriangle,
  Lock,
  Headphones,
  Key
} from 'lucide-react';

export const DeviceLockWarning: React.FC = () => {
  const { 
    userProfile, 
    deviceInfo, 
    mismatchedDeviceId, 
    logout, 
    resetDeviceLock,
    isSimulatingSecondDevice,
    simulateSecondDevice,
  } = useAuth();

  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);

  const handleAdminReset = async () => {
    // Verified platform administrators and assistants only
    if (userProfile?.role === 'admin' || userProfile?.role === 'assistant' || userProfile?.email === 'cources01@gmail.com') {
      setIsResetting(true);
      setAdminError(null);
      try {
        await resetDeviceLock();
        setResetSuccess(true);
        setTimeout(() => {
          setResetSuccess(false);
        }, 2000);
      } catch (err: unknown) {
        setAdminError(err instanceof Error ? err.message : 'فشل فك الارتباط.');
      } finally {
        setIsResetting(false);
      }
    } else {
      setAdminError('يتطلب هذا الإجراء صلاحيات مشرف معتمد.');
    }
  };

  return (
    <div 
      id="device-lock-warning-screen"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-lg"
    >
      <div className="w-full max-w-xl bg-slate-900 border border-amber-500/40 rounded-3xl shadow-2xl shadow-amber-950/30 overflow-hidden text-right">
        {/* Header */}
        <div className="p-6 sm:p-8 bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-900 border-b border-slate-800 text-center">
          <div className="inline-flex p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-4 shadow-lg shadow-amber-950/30">
            <ShieldAlert className="w-10 h-10 animate-pulse" />
          </div>

          <h2 className="text-2xl font-black text-white">
            تنبيه أمني: قفل الحساب بجهاز واحد (Single Device Lock)
          </h2>
          
          <div className="mt-4 p-4 rounded-2xl bg-amber-950/60 border border-amber-500/40 text-amber-200 text-sm font-semibold leading-relaxed">
            «هذا الحساب مقترن بجهاز آخر بالفعل، يُرجى فتح الحساب من جهازك الأساسي أو مراجعة إدارة المنصة لفك الارتباط»
          </div>
        </div>

        {/* Device Information Comparison */}
        <div className="p-6 sm:p-8 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Registered Active Device */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-2">
                <Laptop className="w-4 h-4 text-emerald-400" />
                <span>الجهاز الأساسي المقترن بالحساب</span>
              </div>
              <p className="text-xs font-mono text-emerald-300 break-all bg-emerald-950/30 p-2 rounded-lg border border-emerald-500/20">
                {mismatchedDeviceId || userProfile?.activeDeviceId || 'غير محدد'}
              </p>
              <div className="mt-2 text-[11px] text-slate-500">
                تاريخ الارتباط: {userProfile?.deviceLinkedAt ? new Date(userProfile.deviceLinkedAt).toLocaleDateString('ar-EG') : 'غير متوفر'}
              </div>
            </div>

            {/* Current Device Attempting */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-rose-500/30">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-400 mb-2">
                <Smartphone className="w-4 h-4 text-rose-400" />
                <span>الجهاز الحالي (غير مصرح به)</span>
              </div>
              <p className="text-xs font-mono text-rose-300 break-all bg-rose-950/30 p-2 rounded-lg border border-rose-500/20">
                {deviceInfo.deviceId}
              </p>
              <div className="mt-2 text-[11px] text-slate-500">
                {deviceInfo.browser} • {deviceInfo.os}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 text-xs text-slate-300 leading-relaxed space-y-2">
            <p className="font-semibold text-white flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              لماذا تم تقييد الحساب؟
            </p>
            <p className="text-slate-400">
              تطبق منصة <strong className="text-emerald-400">parmaga</strong> سياسة أمنية صارمة تمنع مشاركة أو تداول اشتراك الطالب على أكثر من جهاز واحد في نفس الوقت لحماية المواد التعليمية وحقوق الملكية الفكرية.
            </p>
          </div>

          {/* Admin Reset Device Section - ADMIN ONLY */}
          <div className="pt-2 border-t border-slate-800">
            {userProfile?.role === 'admin' || userProfile?.role === 'assistant' || userProfile?.email === 'cources01@gmail.com' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                    <Key className="w-3.5 h-3.5" />
                    صلاحيات الإشراف مفعلة
                  </span>
                  <button
                    id="btn-admin-reset-device-direct"
                    type="button"
                    disabled={isResetting}
                    onClick={handleAdminReset}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
                    <span>فك ارتباط الجهاز الآن (Reset Device Lock)</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="text-xs text-slate-300 leading-relaxed font-semibold">
                  «حسابك مسجل على جهاز آخر. للحالات الطارئة، تواصل مع المشرف المعتمد لفك الارتباط»
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <a
                    href="https://wa.me/201000000000?text=%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85%20%D8%B9%D9%84%D9%8A%D9%83%D9%85%D8%8C%20%D8%A3%D8%B1%D8%BA%D8%A8%20%D9%81%D9%8A%20%D9%81%D9%83%20%D8%A7%D8%B1%D8%AA%D8%A8%D8%A7%D8%B7%20%D8%A7%D9%84%D8%AC%D9%87%D8%A7%D8%B2%20%D9%84%D8%AD%D8%B3%D8%A7%D8%A8%D9%8A"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Headphones className="w-3.5 h-3.5" />
                    <span>طلب فك الارتباط من المشرف (واتساب)</span>
                  </a>
                  <span className="text-[11px] text-slate-500">
                    متاح للمشرف المعتمد حصرياً
                  </span>
                </div>
              </div>
            )}

            {resetSuccess && (
              <div className="mt-3 p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>تم فك ارتباط الجهاز القديم وإقران هذا الجهاز بنجاح! جاري التحديث...</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 sm:px-8 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between">
          <button
            id="btn-logout-device-mismatch"
            type="button"
            onClick={logout}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>تسجيل الخروج</span>
          </button>

          <span className="text-xs text-slate-500">
            طالب: <strong className="text-slate-300">{userProfile?.fullName}</strong>
          </span>
        </div>
      </div>
    </div>
  );
};
