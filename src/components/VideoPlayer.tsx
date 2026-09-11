import React, { useMemo } from 'react';
import { Camera, Play, ShieldCheck } from 'lucide-react';
import { WatermarkOverlay } from './WatermarkOverlay';

interface VideoPlayerProps {
  videoUrl?: string;
  title?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, title }) => {
  const embedData = useMemo(() => {
    if (!videoUrl || !videoUrl.trim()) return null;
    const url = videoUrl.trim();

    // YouTube parsing
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (ytMatch) {
      return {
        type: 'iframe',
        src: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?rel=0&modestbranding=1&playsinline=1`
      };
    }

    // Vimeo parsing
    const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?([0-9]+)/);
    if (vimeoMatch) {
      return {
        type: 'iframe',
        src: `https://player.vimeo.com/video/${vimeoMatch[1]}?dnt=1&title=0&byline=0`
      };
    }

    // Direct MP4 / Bunny / Cloudflare / HTML5 Stream
    if (url.endsWith('.mp4') || url.endsWith('.m3u8') || url.includes('b-cdn.net') || url.includes('cloudflarestream.com')) {
      return {
        type: 'video',
        src: url
      };
    }

    // Default iframe for embed urls (Bunny embed, Drive preview, etc.)
    return {
      type: 'iframe',
      src: url
    };
  }, [videoUrl]);

  return (
    <div 
      onContextMenu={(e) => e.preventDefault()}
      className="w-full aspect-video bg-slate-950 rounded-3xl border border-slate-800/80 overflow-hidden relative shadow-2xl shadow-black/50 flex items-center justify-center select-none group"
    >
      {embedData ? (
        <>
          {embedData.type === 'video' ? (
            <video
              src={embedData.src}
              controls
              controlsList="nodownload noplaybackrate"
              disablePictureInPicture
              onContextMenu={(e) => e.preventDefault()}
              className="w-full h-full object-contain relative z-10"
            />
          ) : (
            <iframe 
              src={embedData.src}
              title={title || 'محاضرة تعليمية محمية'}
              className="w-full h-full border-0 relative z-10"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
          <WatermarkOverlay />
        </>
      ) : (
        <>
          {/* Background Ambient Glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="text-center p-6 sm:p-10 max-w-xl mx-auto relative z-10">
            <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center mb-6 border border-emerald-500/20 shadow-lg shadow-emerald-950/40">
              <Camera className="w-10 h-10" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white mb-3 tracking-tight">
              🎥 هذا الدرس قيد المونتاج والتجهيز النهائي
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
              يجري الآن رفع البث عالي الدقة. يمكنك متابعة الشرح النصي، والشرائح التفاعلية، وحل بنك الأسئلة والكبسولة أدناه.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-emerald-400 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>مشغل محمي بالعلامة المائية المخصصة لطالب المنصة</span>
            </div>
          </div>
          <WatermarkOverlay />
        </>
      )}
    </div>
  );
};
