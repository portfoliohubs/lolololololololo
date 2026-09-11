import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  Laptop, 
  Smartphone, 
  RefreshCw, 
  CheckCircle2, 
  Database, 
  AlertTriangle,
  Lock,
  Clock,
  Key,
  HelpCircle,
  FileCheck
} from 'lucide-react';

interface SecurityAuditPanelProps {
  onClose?: () => void;
}

export const SecurityAuditPanel: React.FC<SecurityAuditPanelProps> = ({ onClose }) => {
  const { 
    userProfile, 
    deviceInfo, 
    resetDeviceLock, 
    simulateSecondDevice, 
    isSimulatingSecondDevice,
    rateLimiter,
    activeDeviceMismatch
  } = useAuth();

  const [isResetting, setIsResetting] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const handleReset = async () => {
    setIsResetting(true);
    setSuccessNotice(null);
    try {
      await resetDeviceLock();
      setSuccessNotice('تم فك ارتباط الجهاز بنجاح وإعادة ربط الجهاز الحالي!');
      setTimeout(() => setSuccessNotice(null), 3000);
    } catch (err: unknown) {
      setSuccessNotice(err instanceof Error ? err.message : 'فشلت عملية فك الارتباط');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6 text-right">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              لوحة فحص الأمان والتحكم في قفل الأجهزة (Single Device Lock)
            </h3>
            <p className="text-xs text-slate-400">
              مراقبة بصمات العتاد، فك الارتباط بنقرة زر، ومحاكاة الأجهزة لاختبار النظام
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-xs px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
          >
            إغلاق
          </button>
        )}
      </div>

      {successNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Grid of Security Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Device Lock Status */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
              <Laptop className="w-4 h-4 text-emerald-400" />
              حالة ربط الجهاز
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              نشط ومقترن
            </span>
          </div>

          <div className="text-xs font-mono text-emerald-300 break-all p-2 rounded bg-emerald-950/20 border border-emerald-500/20">
            {userProfile?.activeDeviceId || 'جاري التعيين...'}
          </div>

          <div className="text-[11px] text-slate-500 flex items-center justify-between">
            <span>تاريخ الربط:</span>
            <span className="font-mono text-slate-400">
              {userProfile?.deviceLinkedAt ? new Date(userProfile.deviceLinkedAt).toLocaleDateString('ar-EG') : 'الآن'}
            </span>
          </div>
        </div>

        {/* 3-Strike Rate Limiter Status */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-teal-400" />
              محدد المحاولات (3-Strike)
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              rateLimiter.isLocked 
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
            }`}>
              {rateLimiter.isLocked ? 'مقفل مؤقتاً' : 'طبيعي ومؤمّن'}
            </span>
          </div>

          <div className="text-xs text-slate-300">
            المحاولات الفاشلة الحالية: <strong className="text-white font-mono">{rateLimiter.failedAttempts}</strong> من 3
          </div>

          <div className="text-[11px] text-slate-500">
            فترة التجميد عند 3 أخطاء: <span className="text-slate-300 font-semibold">15 دقيقة تلقائية</span>
          </div>
        </div>

        {/* Watermark Legal Consent Status */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-indigo-400" />
              الإقرار القانوني للعلامة المائية
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              موقع ومعتمد ✓
            </span>
          </div>

          <div className="text-xs text-slate-300">
            تاريخ التوقيع: <span className="font-mono text-white text-[11px]">{userProfile?.consentDate ? new Date(userProfile.consentDate).toLocaleDateString('ar-EG') : 'مسجل'}</span>
          </div>

          <div className="text-[11px] text-slate-500">
            حماية معتمدة لحقوق المحتوى والملكية الرقمية
          </div>
        </div>
      </div>

      {/* Admin Action Buttons */}
      <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-sm font-bold text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-emerald-400" />
            <span>إجراءات المشرف السريعة (Admin Quick Actions)</span>
          </div>
          <p className="text-xs text-slate-400">
            يمكنك فك ارتباط الجهاز الحالي أو محاكاة الدخول من جهاز ثانٍ لاختبار شاشة الحظر.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Reset Device Lock Button */}
          <button
            id="btn-panel-reset-device"
            type="button"
            disabled={isResetting}
            onClick={handleReset}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span>فك ارتباط الجهاز (Reset Device Lock)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
