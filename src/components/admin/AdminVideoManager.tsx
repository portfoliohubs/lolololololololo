import React, { useState, useEffect } from 'react';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { Video, Save, CheckCircle2, ExternalLink } from 'lucide-react';
import { ALL_LESSONS } from '../../data/curriculumData';

export const AdminVideoManager: React.FC = () => {
  const [videoMap, setVideoMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const db = getFirestore();
        const snap = await getDoc(doc(db, 'settings', 'lesson_videos'));
        if (snap.exists()) {
          setVideoMap(snap.data() as Record<string, string>);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, []);

  const handleChange = (lessonId: string, url: string) => {
    const key = lessonId.replace('/', '_');
    setVideoMap(prev => ({ ...prev, [key]: url }));
    setSavedSuccess(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const db = getFirestore();
      await setDoc(doc(db, 'settings', 'lesson_videos'), videoMap, { merge: true });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء حفظ الروابط.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-white p-10">جارٍ تحميل إعدادات الفيديوهات...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Video className="w-5 h-5 text-emerald-400" />
            <span>إدارة روابط الفيديوهات لجميع محطات المنهج (23 درساً)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            يدعم مشغل المنصة: YouTube, Vimeo, Bunny.net Stream, Cloudflare Stream, وروابط MP4 المباشرة مع حماية العلامة المائية.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-bold text-sm flex items-center gap-2 shadow-lg transition-all"
        >
          {saving ? (
            <span>جارٍ الحفظ...</span>
          ) : savedSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>تم الحفظ بنجاح!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>حفظ جميع الروابط</span>
            </>
          )}
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 bg-slate-950/60 text-xs text-slate-400 font-semibold">
          قائمة دروس المنهج وإدخال رابط البث الخارجي (Embed / Stream URL)
        </div>

        <div className="divide-y divide-slate-800/60">
          {ALL_LESSONS.map((lesson) => {
            const key = lesson.id.replace('/', '_');
            const currentUrl = videoMap[key] || '';
            return (
              <div key={lesson.id} className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-800/20 transition-colors">
                <div className="md:w-1/3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-400 text-xs font-mono font-bold">
                      الوحدة {lesson.unitNumber} - درس {lesson.lessonNumber}
                    </span>
                    <h3 className="text-sm font-bold text-white">{lesson.title}</h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{lesson.subtitle}</p>
                </div>

                <div className="flex-1 w-full flex items-center gap-2">
                  <input
                    type="url"
                    placeholder="https://youtu.be/... أو Bunny/Vimeo stream URL"
                    value={currentUrl}
                    onChange={(e) => handleChange(lesson.id, e.target.value)}
                    dir="ltr"
                    className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700/80 text-emerald-300 text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                  {currentUrl && (
                    <a
                      href={currentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      title="معاينة الرابط الخارجي"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
