import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LogOut, 
  Clock, 
  MapPin, 
  Laptop, 
  ShieldCheck, 
  User, 
  SlidersHorizontal,
  Sparkles,
  BookOpen
} from 'lucide-react';

interface HeaderProps {
  onToggleSecurityPanel?: () => void;
  showSecurityPanel?: boolean;
  onToggleAdminDashboard?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onToggleSecurityPanel, 
  showSecurityPanel,
  onToggleAdminDashboard
}) => {
  const { userProfile, logout, deviceInfo } = useAuth();
  const [cairoTime, setCairoTime] = useState<string>('');

  // Cairo Live Time (Africa/Cairo timezone UTC+2 / UTC+3 DST)
  useEffect(() => {
    const updateTime = () => {
      try {
        const timeStr = new Intl.DateTimeFormat('ar-EG', {
          timeZone: 'Africa/Cairo',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }).format(new Date());
        setCairoTime(timeStr);
      } catch {
        setCairoTime(new Date().toLocaleTimeString('ar-EG'));
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-950/50 border border-emerald-400/30">
              <span className="text-white font-black text-xl font-mono tracking-tighter">&lt;/&gt;</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-black text-white tracking-tight">
                  parmaga
                </span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium block">
                منظومة علوم البيانات والذكاء الاصطناعي
              </span>
            </div>
          </div>

          {/* Live Cairo Clock */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 shadow-inner">
            <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-slate-400 font-medium">توقيت القاهرة:</span>
            <span className="text-emerald-300 font-mono font-bold" dir="ltr">
              {cairoTime || '--:--:--'}
            </span>
          </div>
        </div>

        {/* User Status and Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Student details chip */}
          {userProfile && (
            <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                <User className="w-4 h-4" />
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white max-w-[140px] truncate">
                    {userProfile.fullName}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/20">
                    {userProfile.role === 'admin' || userProfile.email === 'cources01@gmail.com' 
                      ? 'مشرف المنصة' 
                      : userProfile.role === 'assistant' 
                      ? 'معاون أكاديمي' 
                      : 'طالب مقيد'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <span className="flex items-center gap-0.5">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    {userProfile.governorate || 'مصر'}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="flex items-center gap-0.5 text-emerald-400 font-mono">
                    <ShieldCheck className="w-3 h-3" />
                    جهاز موثق
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Blog button */}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-blog'))}
            className="hidden lg:flex p-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 text-xs font-semibold items-center gap-1.5 transition-colors cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            <span>المدونة</span>
          </button>

          {/* Admin & Assistant Dashboard button */}
          {(userProfile?.role === 'admin' || userProfile?.role === 'assistant' || userProfile?.email === 'cources01@gmail.com') && onToggleAdminDashboard && (
            <button
              type="button"
              onClick={onToggleAdminDashboard}
              className="p-2 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden lg:inline">
                {userProfile?.role === 'assistant' ? 'لوحة المساعدين' : 'لوحة الإدارة'}
              </span>
            </button>
          )}

          {/* Security & Device Tools button */}
          {onToggleSecurityPanel && (
            <button
              id="btn-security-tools-toggle"
              type="button"
              onClick={onToggleSecurityPanel}
              title="لوحة فحص الأمان وربط الجهاز"
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                showSecurityPanel
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-slate-900 text-slate-300 hover:text-white border-slate-800 hover:border-slate-700'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden lg:inline">لوحة الأمان والأجهزة</span>
            </button>
          )}

          {/* Sign Out button */}
          <button
            id="btn-header-signout"
            type="button"
            onClick={logout}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/40 text-slate-300 hover:text-rose-300 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">تسجيل الخروج</span>
          </button>
        </div>
      </div>
    </header>
  );
};
