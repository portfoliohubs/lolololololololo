import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { BookOpen, Search, ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Article {
  id: string;
  title: string;
  slug: string;
  category: string;
  isPublished: boolean;
  contentMarkdown: string;
  readTimeMinutes: number;
}

export const SEOBlogViewer: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const res = await fetch('/content/seo_articles/all_230_seo_articles.json');
        const jsonArticles: Article[] = await res.json();
        
        // Merge with Firestore if needed, but for public view, just fetch Firestore
        // where isPublished is true.
        const db = getFirestore();
        const snap = await getDocs(collection(db, 'seo_articles'));
        const dbState: Record<string, boolean> = {};
        snap.forEach(d => {
          dbState[d.id] = d.data().isPublished;
        });

        const merged = jsonArticles.map(art => ({
          ...art,
          isPublished: dbState[art.id] !== undefined ? dbState[art.id] : art.isPublished
        }));
        
        setArticles(merged.filter(a => a.isPublished));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, []);

  if (loading) {
    return <div className="p-20 text-center text-slate-400">جاري تحميل المدونة...</div>;
  }

  if (selectedArticle) {
    return <SEOArticleDetail article={selectedArticle} onBack={() => setSelectedArticle(null)} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-right animate-in fade-in duration-300 relative z-10">
      <header className="bg-slate-900 border-b border-slate-800 p-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">مدونة بارماجا التعليمية</h1>
              <p className="text-sm text-slate-400">مقالات تقنية وشروحات مجانية لطلاب الثانوية العامة</p>
            </div>
          </div>
          <button 
            onClick={onBack}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold flex items-center gap-2"
          >
            العودة للمنصة <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {articles.map(art => (
            <div 
              key={art.id} 
              onClick={() => setSelectedArticle(art)}
              className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 p-6 rounded-3xl cursor-pointer group transition-all hover:-translate-y-1 shadow-lg hover:shadow-indigo-900/20"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-lg">
                  {art.category}
                </span>
                <ArrowUpRight className="w-5 h-5 text-slate-600 group-hover:text-indigo-400 transition-colors" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2 leading-tight group-hover:text-indigo-100">{art.title}</h2>
              <div className="text-xs text-slate-500 flex items-center gap-2 mt-6">
                <span>{art.readTimeMinutes} دقائق قراءة</span>
              </div>
            </div>
          ))}
          {articles.length === 0 && (
            <div className="col-span-full text-center text-slate-500 p-10">لا توجد مقالات منشورة حالياً.</div>
          )}
        </div>
      </main>
    </div>
  );
};

const SEOArticleDetail: React.FC<{ article: Article, onBack: () => void }> = ({ article, onBack }) => {
  // Silent Ad Container Mock Config
  const adminConfig = { enableAds: true };
  
  const SilentAdContainer = () => {
    if (!adminConfig.enableAds) return null;
    return (
      <div className="w-full h-24 my-8 bg-slate-900/50 border border-slate-800/50 rounded-2xl flex items-center justify-center relative overflow-hidden">
        <span className="text-[10px] text-slate-600 uppercase tracking-widest">إعلان صامت</span>
      </div>
    );
  };

  const HighConversionCTA = () => (
    <div className="my-10 bg-gradient-to-r from-emerald-900/40 to-teal-900/40 border border-emerald-500/30 p-8 rounded-3xl text-center shadow-2xl shadow-emerald-900/20">
      <h3 className="text-2xl font-black text-white mb-3">هل ترغب في التفوق في المادة؟</h3>
      <p className="text-slate-300 mb-6 font-medium">
        ابدأ الآن مذاكرة الوحدة الأولى مجاناً بالكامل على منصة parmaga، وتمتع بالأسئلة التفاعلية وبطاقات الذاكرة.
      </p>
      <button 
        onClick={onBack}
        className="px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg shadow-xl shadow-emerald-950/50 transition-transform active:scale-95 inline-flex items-center gap-2"
      >
        ابدأ المذاكرة مجاناً الآن
        <ArrowLeft className="w-5 h-5" />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-right animate-in slide-in-from-bottom-8 duration-500 relative z-10">
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 p-4 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button 
            onClick={onBack}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold flex items-center gap-2"
          >
            <ArrowRight className="w-4 h-4" /> العودة للمدونة
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-6 py-12">
        <h1 className="text-3xl md:text-5xl font-black text-white leading-tight mb-6">
          {article.title}
        </h1>
        <div className="flex items-center gap-4 mb-10 text-sm text-slate-400 font-semibold border-b border-slate-800 pb-6">
          <span className="text-indigo-400">{article.category}</span>
          <span>•</span>
          <span>{article.readTimeMinutes} دقائق قراءة</span>
        </div>

        <SilentAdContainer />

        <div className="prose prose-invert prose-lg prose-indigo max-w-none text-slate-300 leading-relaxed font-medium">
          <div className="markdown-body">
            <ReactMarkdown>{article.contentMarkdown}</ReactMarkdown>
          </div>
        </div>

        <HighConversionCTA />

        <SilentAdContainer />
      </main>
    </div>
  );
};
