import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, Share, PlusSquare, X } from 'lucide-react';

export const PWAInstallButton: React.FC<{ className?: string; variant?: 'header' | 'landing' }> = ({
  className = '',
  variant = 'header'
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        id="btn-install-pwa"
        type="button"
        onClick={install}
        className={`flex items-center gap-2 rounded-xl font-bold transition-all cursor-pointer shadow-lg shadow-emerald-950/40 ${
          variant === 'landing'
            ? 'px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-sm'
            : 'px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs'
        } ${className}`}
      >
        <Download className="w-4 h-4 animate-bounce" />
        <span>تثبيت التطبيق (PWA)</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          id="btn-install-pwa-ios"
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-2 rounded-xl font-bold transition-all cursor-pointer ${
            variant === 'landing'
              ? 'px-6 py-3.5 bg-slate-900 border border-emerald-500/40 text-emerald-400 hover:bg-slate-800 text-sm'
              : 'px-3 py-1.5 bg-slate-900 border border-slate-700 text-slate-200 hover:text-white text-xs'
          } ${className}`}
        >
          <Smartphone className="w-4 h-4 text-emerald-400" />
          <span>تثبيت على آيفون</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
            <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-emerald-500/30 p-6 shadow-2xl text-right text-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-emerald-400" />
                  تثبيت التطبيق على iPhone / iPad
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3 text-xs leading-relaxed text-slate-300">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
                  <Share className="w-5 h-5 text-sky-400 shrink-0" />
                  <span>1. اضغط على زر <strong>مشاركة (Share)</strong> في شريط متصفح Safari السفلي.</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
                  <PlusSquare className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>2. مرر للأسفل واضغط على <strong>إضافة إلى الشاشة الرئيسية (Add to Home Screen)</strong>.</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
              >
                فهمت ذلك
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // If prompt is not yet triggered but user might be on desktop or mobile Chrome, provide subtle button
  return (
    <button
      id="btn-install-pwa-ambient"
      type="button"
      onClick={() => alert('لتثبيت التطبيق على جهازك، اضغط على زر التثبيت في شريط المتصفح العلوي أو من قائمة الخيارات')}
      className={`hidden md:flex items-center gap-2 rounded-xl text-slate-300 hover:text-white text-xs font-semibold px-3 py-1.5 bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all ${className}`}
    >
      <Download className="w-3.5 h-3.5 text-emerald-400" />
      <span>تطبيق الويب (PWA)</span>
    </button>
  );
};
