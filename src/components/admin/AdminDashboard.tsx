import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AdminStudents } from './AdminStudents';
import { AdminPackages } from './AdminPackages';
import { AdminSEO } from './AdminSEO';
import { AdminVideoManager } from './AdminVideoManager';
import { Users, Package, FileText, ArrowRight, Video, ShieldCheck } from 'lucide-react';

export const AdminDashboard: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.role === 'admin' || userProfile?.email === 'cources01@gmail.com';
  const isAssistant = userProfile?.role === 'assistant';

  const [activeTab, setActiveTab] = useState<'students' | 'packages' | 'videos' | 'seo'>('students');

  if (!isAdmin && !isAssistant) {
    return <div className="text-white p-10 text-center">غير مصرح لك بالدخول إلى لوحة التحكم الإدارية.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col animate-in fade-in duration-300 select-none">
      {/* Admin Header */}
      <header className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border font-black font-mono ${
              isAdmin ? 'bg-amber-500/20 text-amber-500 border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            }`}>
              {isAdmin ? 'SA' : 'AS'}
            </div>
            <div>
              <h1 className="text-xl font-black text-white">
                {isAdmin ? 'لوحة تحكم المشرف العام (Super Admin)' : 'لوحة تحكم المساعدين والمعاونين (Assistant Dashboard)'}
              </h1>
              <p className="text-xs text-slate-400">
                {isAdmin 
                  ? 'إدارة متكاملة لـ 50,000 طالب، محرك الباقات، مشغل الفيديوهات، ومقالات الـ SEO'
                  : 'البحث عن الطلاب، فك ارتباط الأجهزة للطوارئ، ومتابعة حالة الاشتراكات والوحدات'
                }
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold flex items-center gap-2 text-xs transition-colors"
          >
            <span>العودة للمنصة</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Admin Nav */}
      <div className="bg-slate-950 border-b border-slate-800 sticky top-[73px] z-20">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-6 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('students')}
            className={`py-4 px-2 font-bold flex items-center gap-2 border-b-2 text-sm whitespace-nowrap transition-colors ${
              activeTab === 'students' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>إدارة الطلاب والوحدات</span>
          </button>

          {isAdmin && (
            <>
              <button 
                onClick={() => setActiveTab('packages')}
                className={`py-4 px-2 font-bold flex items-center gap-2 border-b-2 text-sm whitespace-nowrap transition-colors ${
                  activeTab === 'packages' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>محرك الباقات المرنة</span>
              </button>

              <button 
                onClick={() => setActiveTab('videos')}
                className={`py-4 px-2 font-bold flex items-center gap-2 border-b-2 text-sm whitespace-nowrap transition-colors ${
                  activeTab === 'videos' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                <Video className="w-4 h-4" />
                <span>إدارة روابط الفيديوهات (23 درساً)</span>
              </button>

              <button 
                onClick={() => setActiveTab('seo')}
                className={`py-4 px-2 font-bold flex items-center gap-2 border-b-2 text-sm whitespace-nowrap transition-colors ${
                  activeTab === 'seo' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>ماكينة مقالات الـ SEO (230 مقال)</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        {activeTab === 'students' && <AdminStudents isAssistant={isAssistant} />}
        {isAdmin && activeTab === 'packages' && <AdminPackages />}
        {isAdmin && activeTab === 'videos' && <AdminVideoManager />}
        {isAdmin && activeTab === 'seo' && <AdminSEO />}
      </main>
    </div>
  );
};
