import React, { useState, useEffect } from 'react';
import { Layers, RotateCcw, ThumbsUp, ArrowRight, CheckCircle2, RotateCw } from 'lucide-react';
import { useContentProtection } from '../hooks/useContentProtection';

interface Flashcard {
  id: string;
  front: string;
  back: string;
  hint?: string;
  category?: string;
}

interface FlashcardsEngineProps {
  lessonId: string;
  onClose: () => void;
}

export const FlashcardsEngine: React.FC<FlashcardsEngineProps> = ({ lessonId, onClose }) => {
  useContentProtection(true);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [knownCount, setKnownCount] = useState(0);

  useEffect(() => {
    const fetchCards = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/content/lessons/${lessonId}/flashcards.json`);
        if (!res.ok) throw new Error('Flashcards not found');
        const data = await res.json();
        setCards(data);
      } catch (err) {
        setError('تعذر تحميل بطاقات الذاكرة. قد لا تكون متوفرة لهذا الدرس بعد.');
      } finally {
        setLoading(false);
      }
    };
    fetchCards();
  }, [lessonId]);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = (known: boolean) => {
    setIsFlipped(false);
    
    // Add a tiny delay so the flip animation hides the transition
    setTimeout(() => {
      const currentCard = cards[currentIndex];
      
      if (known) {
        setKnownCount(prev => prev + 1);
        if (currentIndex < cards.length - 1) {
          setCurrentIndex(currentIndex + 1);
        } else {
          setCompleted(true);
        }
      } else {
        // Move to the end of the deck
        const updatedCards = [...cards];
        updatedCards.push(updatedCards.splice(currentIndex, 1)[0]);
        setCards(updatedCards);
        // index remains the same, but it points to the next card now
      }
    }, 200);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setCompleted(false);
    setKnownCount(0);
    setIsFlipped(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-slate-400 font-semibold animate-pulse">جاري سحب البطاقات الذكية...</p>
      </div>
    );
  }

  if (error || cards.length === 0) {
    return (
      <div className="text-center p-10 max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl mt-10">
        <p className="text-slate-400 mb-6">{error || 'لا توجد بطاقات لهذا الدرس.'}</p>
        <button onClick={onClose} className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold">
          العودة
        </button>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="max-w-2xl mx-auto p-10 bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-3xl mt-10 text-center space-y-6 shadow-2xl shadow-indigo-950/20 animate-in zoom-in-95 duration-500">
        <div className="w-24 h-24 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20 shadow-lg shadow-emerald-500/20">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-black text-white">إنجاز ممتاز!</h2>
        <p className="text-slate-300">لقد راجعت جميع المفاهيم والبطاقات بنجاح وتم تثبيت الحفظ.</p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
          <button 
            onClick={handleRestart}
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center gap-2"
          >
            <RotateCw className="w-5 h-5" />
            إعادة المراجعة
          </button>
          <button 
            onClick={onClose}
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center justify-center gap-2"
          >
            العودة للدرس
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  const card = cards[currentIndex];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in duration-500 select-none">
      {/* Header & Progress */}
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={onClose}
          className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-sm font-semibold flex items-center gap-2"
        >
          <ArrowRight className="w-4 h-4" />
          إنهاء المراجعة
        </button>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-slate-300">
            بطاقة {currentIndex + 1} من {cards.length}
          </span>
          <div className="w-48 h-2.5 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
            <div 
              className="h-full bg-indigo-500 transition-all duration-300"
              style={{ width: `${(currentIndex / cards.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3D Flip Card Container */}
      <div className="perspective-1000 w-full max-w-2xl mx-auto h-[450px] sm:h-[400px]">
        <div 
          className={`relative w-full h-full transition-all duration-500 preserve-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}
          onClick={handleFlip}
        >
          {/* Front of Card */}
          <div className="absolute inset-0 w-full h-full backface-hidden rounded-3xl bg-slate-900 border-2 border-slate-800 p-8 sm:p-12 flex flex-col items-center justify-center text-center shadow-2xl hover:border-indigo-500/50 transition-colors">
            <div className="absolute top-6 right-6 px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 text-xs font-bold border border-indigo-500/20">
              {card.category || 'مفهوم رئيسي'}
            </div>
            
            <div className="w-16 h-16 rounded-2xl bg-slate-800/50 text-slate-400 flex items-center justify-center mb-6">
              <Layers className="w-8 h-8" />
            </div>
            
            <h3 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
              {card.front}
            </h3>
            
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-sm font-semibold text-slate-500 flex items-center gap-2 animate-pulse">
              انقر للقلب <RotateCw className="w-4 h-4" />
            </div>
          </div>

          {/* Back of Card */}
          <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 border-2 border-indigo-500/50 p-8 sm:p-10 flex flex-col justify-center shadow-2xl shadow-indigo-950/50">
            <h4 className="text-xl font-bold text-indigo-300 mb-6 pb-4 border-b border-indigo-500/20 text-center">
              {card.front}
            </h4>
            
            <p className="text-lg sm:text-xl text-slate-200 leading-relaxed text-center font-medium">
              {card.back}
            </p>
            
            {card.hint && (
              <div className="mt-8 p-4 rounded-xl bg-slate-950/50 border border-slate-800 text-center text-sm text-slate-400">
                <strong className="text-amber-400">مثال / ملاحظة:</strong> {card.hint}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons (Only visible when flipped) */}
      <div className={`mt-10 max-w-lg mx-auto grid grid-cols-2 gap-4 transition-all duration-300 ${isFlipped ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <button 
          onClick={(e) => { e.stopPropagation(); handleNext(false); }}
          className="py-4 rounded-2xl bg-slate-900 border border-rose-500/30 hover:bg-rose-950/40 text-rose-400 font-bold text-lg flex items-center justify-center gap-3 transition-colors shadow-lg"
        >
          <RotateCcw className="w-5 h-5" />
          لا أعرفه 🔄
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); handleNext(true); }}
          className="py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg flex items-center justify-center gap-3 transition-colors shadow-xl shadow-emerald-900/30"
        >
          <ThumbsUp className="w-5 h-5" />
          أعرفه 👍
        </button>
      </div>

    </div>
  );
};
