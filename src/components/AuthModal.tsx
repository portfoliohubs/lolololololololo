import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { EGYPTIAN_GOVERNORATES } from '../types';
import { 
  Lock, 
  Mail, 
  User as UserIcon, 
  Phone, 
  MapPin, 
  AlertTriangle, 
  CheckCircle, 
  KeyRound, 
  Clock,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Loader2,
  X
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'register';
  onClose?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, initialMode = 'login', onClose }) => {
  const {
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    sendPasswordReset,
    rateLimiter,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [governorate, setGovernorate] = useState('القاهرة');

  useEffect(() => {
    if (initialMode) setMode(initialMode);
  }, [initialMode]);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (rateLimiter.isLocked) {
      setErrorMsg(
        `تم تجاوز عدد محاولات الدخول المسموح بها (3 محاولات). تم إيقاف الحساب مؤقتاً لمدة 15 دقيقة لدواعي الأمان، أو يمكنك استعادة كلمة المرور عبر بريدك الإلكتروني.`
      );
      return;
    }

    setSubmitting(true);
    try {
      await loginWithEmail(email, password);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'فشل تسجيل الدخول. تحقق من بياناتك.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Validate triple name
    const words = fullName.trim().split(/\s+/);
    if (words.length < 3) {
      setErrorMsg('يُشترط كتابة الاسم الثلاثي بالكامل (على الأقل 3 أسماء).');
      return;
    }

    // Validate Egyptian phone number
    const cleanPhone = phone.trim();
    if (!/^01[0125][0-9]{8}$/.test(cleanPhone)) {
      setErrorMsg('يرجى إدخال رقم هاتف مصري صحيح يبدأ بـ 01 (11 رقماً).');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('كلمة المرور يجب ألا تقل عن 6 خانات.');
      return;
    }

    setSubmitting(true);
    try {
      await registerWithEmail(fullName, email, password, cleanPhone, governorate);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'تعذر إنشاء الحساب، ربما البريد مسجل مسبقاً.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim()) {
      setErrorMsg('يرجى كتابة البريد الإلكتروني أولاً لإرسال رابط الاستعادة.');
      return;
    }

    setSubmitting(true);
    try {
      await sendPasswordReset(email);
      setSuccessMsg('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني بنجاح. تفقد صندوق الوارد أو البريد غير المرغوب.');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'حدث خطأ أثناء إرسال البريد. تأكد من صحة البريد الإلكتروني.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleAuth = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmitting(true);
    try {
      await loginWithGoogle();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'تعذر تسجيل الدخول عبر Google. حاول مجدداً.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div 
        id="auth-modal-card"
        className="w-full max-w-lg bg-slate-900 border border-slate-800/80 rounded-2xl shadow-2xl shadow-emerald-950/30 overflow-hidden"
      >
        {/* Top brand header */}
        <div className="relative px-8 pt-8 pb-6 bg-gradient-to-b from-emerald-950/40 via-slate-900 to-slate-900 border-b border-slate-800/60 text-center">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 left-4 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              aria-label="إغلاق النافذة"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="inline-flex items-center gap-2 px-3 py-1 mb-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold tracking-wide">
            <ShieldCheck className="w-3.5 h-3.5" />
            العام الدراسي 2026 - 2027
          </div>
          
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
            <span className="text-emerald-400 font-black">منصة برمجتكم</span>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">v2.1</span>
          </h1>
          <p className="mt-2 text-sm text-slate-300 max-w-sm mx-auto">
            منظومة التعليم الرقمي المتخصصة في علوم البيانات والذكاء الاصطناعي
          </p>

          {/* Navigation Tabs */}
          {mode !== 'forgot' && (
            <div className="flex p-1 mt-6 bg-slate-950/60 rounded-xl border border-slate-800/80">
              <button
                id="tab-login-btn"
                type="button"
                onClick={() => { setMode('login'); setErrorMsg(null); setSuccessMsg(null); }}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                  mode === 'login'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                تسجيل الدخول
              </button>
              <button
                id="tab-register-btn"
                type="button"
                onClick={() => { setMode('register'); setErrorMsg(null); setSuccessMsg(null); }}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                  mode === 'register'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                إنشاء حساب جديد
              </button>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-8 space-y-6">
          {/* Rate Limiter Alert Box */}
          {rateLimiter.isLocked && (
            <div 
              id="rate-limiter-alert"
              className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 space-y-2"
            >
              <div className="flex items-center gap-2 font-bold text-rose-300 text-sm">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                <span>حسابك مقفل مؤقتاً لدواعي الأمان (3 محاولات خاطئة)</span>
              </div>
              <p className="text-xs leading-relaxed text-rose-200/90">
                تم تجاوز عدد محاولات الدخول المسموح بها (3 محاولات). تم إيقاف الحساب مؤقتاً لمدة 15 دقيقة لدواعي الأمان، أو يمكنك استعادة كلمة المرور عبر بريدك الإلكتروني.
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-rose-900/50">
                <span className="text-xs text-rose-300 font-mono flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  متبقي على فك القفل:
                </span>
                <span className="text-sm font-bold font-mono px-2.5 py-0.5 rounded bg-rose-900/80 text-rose-100 border border-rose-700/50">
                  {formatTime(rateLimiter.remainingSeconds)} دقيقة
                </span>
              </div>
            </div>
          )}

          {/* General Error Banner */}
          {errorMsg && !rateLimiter.isLocked && (
            <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {/* Success Banner */}
          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-xs flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{successMsg}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <Mail className="absolute right-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    id="login-email-input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    dir="ltr"
                    className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    كلمة المرور
                  </label>
                  <button
                    id="btn-forgot-password-link"
                    type="button"
                    onClick={() => { setMode('forgot'); setErrorMsg(null); }}
                    className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    نسيت كلمة المرور؟
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute right-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    id="login-password-input"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    dir="ltr"
                    className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <button
                id="btn-login-submit"
                type="submit"
                disabled={submitting || rateLimiter.isLocked}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جارٍ التحقق والمصادقة...</span>
                  </>
                ) : rateLimiter.isLocked ? (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>الحساب موقوف مؤقتاً ({formatTime(rateLimiter.remainingSeconds)})</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>تسجيل الدخول للمنصة</span>
                  </>
                )}
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-slate-900 text-slate-500">أو الدخول بنقرة واحدة</span>
                </div>
              </div>

              {/* Google Sign-in */}
              <button
                id="btn-google-signin"
                type="button"
                onClick={handleGoogleAuth}
                disabled={submitting}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 text-sm font-semibold flex items-center justify-center gap-3 transition-all cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
                  />
                </svg>
                <span>المتابعة باستخدام حساب Google</span>
              </button>
            </form>
          )}

          {/* REGISTER FORM */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  الاسم الثلاثي للطالب <span className="text-emerald-400">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="absolute right-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    id="register-fullname-input"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="مثال: أحمد محمد علي"
                    className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  البريد الإلكتروني <span className="text-emerald-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute right-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    id="register-email-input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    dir="ltr"
                    className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  كلمة المرور (6 خانات على الأقل) <span className="text-emerald-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute right-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    id="register-password-input"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    dir="ltr"
                    className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    رقم هاتف الطالب أو ولي الأمر <span className="text-emerald-400">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-3 w-4 h-4 text-slate-500" />
                    <input
                      id="register-phone-input"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01012345678"
                      dir="ltr"
                      className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    المحافظة (الـ 27 محافظة) <span className="text-emerald-400">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute right-3 top-3 w-4 h-4 text-slate-500" />
                    <select
                      id="register-governorate-select"
                      value={governorate}
                      onChange={(e) => setGovernorate(e.target.value)}
                      className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors appearance-none cursor-pointer"
                    >
                      {EGYPTIAN_GOVERNORATES.map((gov) => (
                        <option key={gov} value={gov} className="bg-slate-900 text-white">
                          {gov}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
                🔒 يتم ربط هذا الحساب مباشرة بجهازك الحالي وفق سياسة <span className="text-emerald-400 font-semibold">1-Device Lock</span> لمنع تداول الحسابات، مع تفعيل حماية العلامة المائية.
              </div>

              <button
                id="btn-register-submit"
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جارٍ إنشاء الحساب وتوثيق الجهاز...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>إنشاء حساب الطالب الجديد</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* FORGOT PASSWORD FORM */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setErrorMsg(null); setSuccessMsg(null); }}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-3"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>العودة لشاشة تسجيل الدخول</span>
                </button>
                <h3 className="text-lg font-bold text-white">استعادة كلمة المرور</h3>
                <p className="text-xs text-slate-400 mt-1">
                  أدخل بريدك الإلكتروني المسجل وسنرسل لك رابطاً مباشراً لإعادة تعيين كلمة المرور فوراً.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <Mail className="absolute right-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    id="forgot-email-input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    dir="ltr"
                    className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <button
                id="btn-send-reset-email"
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جارٍ إرسال الرابط...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    <span>إرسال رابط إعادة التعيين</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
