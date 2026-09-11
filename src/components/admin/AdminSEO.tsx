import React, { useState, useEffect } from 'react';
import { getFirestore, doc, setDoc, getDocs, collection } from 'firebase/firestore';
import { FileText, Globe, Search, Power } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  slug: string;
  category: string;
  isPublished: boolean;
}

export const AdminSEO: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [publishingId, setPublishingId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        // 1. Load static JSON
        const res = await fetch('/content/seo_articles/all_230_seo_articles.json');
        const jsonArticles: Article[] = await res.json();
        
        // 2. Load Firestore overrides
        const db = getFirestore();
        const snap = await getDocs(collection(db, 'seo_articles'));
        const dbState: Record<string, boolean> = {};
        snap.forEach(d => {
          dbState[d.id] = d.data().isPublished;
        });

        // 3. Merge
        const merged = jsonArticles.map(art => ({
          ...art,
          isPublished: dbState[art.id] !== undefined ? dbState[art.id] : art.isPublished
        }));
        
        setArticles(merged);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const togglePublish = async (id: string, currentStatus: boolean) => {
    setPublishingId(id);
    try {
      const db = getFirestore();
      const newStatus = !currentStatus;
      await setDoc(doc(db, 'seo_articles', id), { isPublished: newStatus }, { merge: true });
      
      setArticles(articles.map(a => a.id === id ? { ...a, isPublished: newStatus } : a));
    } catch (err) {
      console.error(err);
      alert('خطأ في تغيير حالة المقال');
    } finally {
      setPublishingId(null);
    }
  };

  const filtered = articles.filter(a => a.title.includes(searchTerm) || a.category.includes(searchTerm));
  const publishedCount = articles.filter(a => a.isPublished).length;

  if (loading) return <div className="text-white p-10">جاري تحميل ماكينة المقالات...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{articles.length}</div>
            <div className="text-sm text-slate-400 font-semibold">إجمالي المقالات المجهزة</div>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-400">{publishedCount}</div>
            <div className="text-sm text-slate-400 font-semibold">مقال منشور (Live)</div>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex justify-center items-center">
          <div className="text-center">
            <div className="text-xs text-slate-500 mb-1">يتم تحديث خريطة الموقع تلقائياً</div>
            <div className="font-mono text-slate-300 font-bold bg-slate-950 px-3 py-1 rounded border border-slate-800">
              sitemap.xml
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input 
            type="text" 
            placeholder="بحث في العناوين والتصنيفات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pr-10 pl-4 text-white focus:border-indigo-500 outline-none transition-all"
          />
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full text-right text-sm text-slate-300 relative">
            <thead className="text-xs uppercase bg-slate-950 text-slate-400 border-b border-slate-800 sticky top-0 z-10">
              <tr>
                <th className="p-4 font-bold w-20">الحالة</th>
                <th className="p-4 font-bold w-24">مفتاح النشر</th>
                <th className="p-4 font-bold">عنوان المقال (الكلمة المفتاحية)</th>
                <th className="p-4 font-bold">التصنيف</th>
                <th className="p-4 font-bold">الرابط (Slug)</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(art => (
                <tr key={art.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                  <td className="p-4">
                    {art.isPublished ? (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">منشور</span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 text-[10px] font-bold">مسودة</span>
                    )}
                  </td>
                  <td className="p-4">
                    <button 
                      onClick={() => togglePublish(art.id, art.isPublished)}
                      disabled={publishingId === art.id}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${art.isPublished ? 'bg-indigo-500' : 'bg-slate-700'} ${publishingId === art.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${art.isPublished ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </td>
                  <td className="p-4 font-bold text-white max-w-md truncate" title={art.title}>
                    {art.title}
                  </td>
                  <td className="p-4 text-xs text-slate-400">{art.category}</td>
                  <td className="p-4 text-xs text-slate-500 font-mono truncate max-w-[150px]" dir="ltr">/{art.slug}</td>
                </tr>
              ))}
              
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">لا يوجد مقالات مطابقة.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
