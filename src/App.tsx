import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthModal } from './components/AuthModal';
import { LandingPage } from './components/LandingPage';
import { WatermarkConsentModal } from './components/WatermarkConsentModal';
import { DeviceLockWarning } from './components/DeviceLockWarning';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { CurriculumStations } from './components/CurriculumStations';
import { SecurityAuditPanel } from './components/SecurityAuditPanel';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { SEOBlogViewer } from './components/SEOBlogViewer';
import { 
  ShieldCheck, 
  Loader2, 
  Sparkles, 
  Cpu, 
  Database,
  Lock,
  Layers,
  ChevronDown,
  BookOpen
} from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { 
    user, 
    userProfile, 
    loading, 
    activeDeviceMismatch, 
    needsWatermarkConsent 
  } = useAuth();

  const [showSecurityPanel, setShowSecurityPanel] = useState<boolean>(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState<boolean>(false);
  const [showBlog, setShowBlog] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    const handleOpenBlog = () => setShowBlog(true);
    window.addEventListener('open-blog', handleOpenBlog);
    return () => window.removeEventListener('open-blog', handleOpenBlog);
  }, []);

  // Initial loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-2xl shadow-emerald-500/20 mb-6 border border-emerald-400/30">
          <span className="text-white font-black text-2xl font-mono">&lt;/&gt;</span>
        </div>
        <h1 className="text-2xl font-extrabold text-white mb-2">
          منصة برمجتكم
        </h1>
        <div className="flex items-center gap-2 text-sm text-slate-400 font-medium">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
          <span>جارٍ التحقق من الهوية المشفرة وبصمة الجهاز...</span>
        </div>
      </div>
    );
  }

  // Blog Viewer View
  if (showBlog) {
    return <SEOBlogViewer onBack={() => setShowBlog(false)} />;
  }

  // Not logged in: Show Pre-login Landing Page with Auth Modal integration
  if (!user) {
    return (
      <>
        <LandingPage 
          onOpenAuth={(mode) => {
            setAuthModalMode(mode);
            setShowAuthModal(true);
          }}
          onOpenBlog={() => setShowBlog(true)}
        />
        <AuthModal 
          isOpen={showAuthModal}
          initialMode={authModalMode}
          onClose={() => setShowAuthModal(false)}
        />
      </>
    );
  }

  // Device Mismatch Gate: 1-Device Lock restriction active
  if (activeDeviceMismatch) {
    return <DeviceLockWarning />;
  }

  // Watermark Consent Gate: Mandatory Academic Charter Modal
  if (needsWatermarkConsent) {
    return <WatermarkConsentModal isOpen={true} />;
  }

  // Normal Authorized Platform View: Admin or Assistant Dashboard
  const canAccessAdmin = userProfile?.role === 'admin' || userProfile?.role === 'assistant' || userProfile?.email === 'cources01@gmail.com';
  if (showAdminDashboard && canAccessAdmin) {
    return <AdminDashboard onClose={() => setShowAdminDashboard(false)} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200 max-w-full overflow-x-hidden break-words hyphens-auto">
      {/* Header */}
      <Header 
        onToggleSecurityPanel={() => setShowSecurityPanel(prev => !prev)} 
        showSecurityPanel={showSecurityPanel}
        onToggleAdminDashboard={() => setShowAdminDashboard(true)}
      />

      {/* Main Learning Hub */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Security Audit & Device Lock Panel (Toggleable / Configurable) */}
        {showSecurityPanel && (
          <SecurityAuditPanel onClose={() => setShowSecurityPanel(false)} />
        )}

        {/* The 16 Educational Stations of parmaga */}
        <CurriculumStations />
      </main>

      {/* Footer */}
      <Footer 
        onOpenSEO={() => setShowBlog(true)} 
        onOpenCurriculum={() => {
          const el = document.getElementById('curriculum-stations-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        onOpenPackages={() => {
          const el = document.getElementById('btn-package-selector');
          if (el) el.click();
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
