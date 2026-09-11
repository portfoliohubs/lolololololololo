import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { Plus, Edit2, Trash2, CheckCircle2, XCircle, Tag, Layers } from 'lucide-react';

const availableStations = [
  { id: '1', title: 'المحطة 1: الفهرس العام', description: 'منظومة الذكاء الاصطناعي' },
  { id: '2', title: 'المحطة 2: الوحدة الأولى', description: 'هرم المعرفة DIKW' },
  { id: '3', title: 'المحطة 3: الوحدة الثانية', description: 'أساسيات بايثون' },
  { id: '4', title: 'المحطة 4: الوحدة الثالثة', description: 'الاحتمالات وقاعدة بايز' },
  { id: '16', title: 'المحطة 16: ليالي الامتحان', description: 'النماذج الوزارية الشاملة' }
];

interface PackageModel {
  id: string;
  name: string;
  priceEGP: number;
  allowedStations: string[];
  isActive: boolean;
  expiresAt?: string;
}

export const AdminPackages: React.FC = () => {
  const [packages, setPackages] = useState<PackageModel[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Builder State
  const [isBuilding, setIsBuilding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState<number>(0);
  const [formStations, setFormStations] = useState<Set<string>>(new Set());
  const [formActive, setFormActive] = useState(true);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const db = getFirestore();
      const snap = await getDocs(collection(db, 'packages'));
      setPackages(snap.docs.map(d => ({ id: d.id, ...d.data() } as PackageModel)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleStation = (stationId: string) => {
    const newSet = new Set(formStations);
    if (newSet.has(stationId)) newSet.delete(stationId);
    else newSet.add(stationId);
    setFormStations(newSet);
  };

  const handleSave = async () => {
    if (!formName.trim()) return alert('أدخل اسم الباقة');
    
    try {
      const db = getFirestore();
      const payload = {
        name: formName,
        priceEGP: formPrice,
        allowedStations: Array.from(formStations),
        isActive: formActive
      };

      if (editingId) {
        await updateDoc(doc(db, 'packages', editingId), payload);
      } else {
        await addDoc(collection(db, 'packages'), payload);
      }
      
      setIsBuilding(false);
      setEditingId(null);
      fetchPackages();
    } catch (err) {
      console.error(err);
      alert('خطأ أثناء الحفظ');
    }
  };

  const startEdit = (pkg: PackageModel) => {
    setEditingId(pkg.id);
    setFormName(pkg.name);
    setFormPrice(pkg.priceEGP);
    setFormStations(new Set(pkg.allowedStations));
    setFormActive(pkg.isActive);
    setIsBuilding(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('حذف هذه الباقة نهائياً؟')) return;
    try {
      const db = getFirestore();
      await deleteDoc(doc(db, 'packages', id));
      fetchPackages();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="text-white p-10">جاري تحميل الباقات...</div>;

  return (
    <div className="space-y-6">
      {!isBuilding ? (
        <>
          <div className="flex justify-between items-center bg-slate-900 p-6 rounded-3xl border border-slate-800">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">باقات الاشتراك</h2>
              <p className="text-sm text-slate-400">إدارة الباقات والوصلاحيات الممنوحة لكل باقة</p>
            </div>
            <button 
              onClick={() => {
                setEditingId(null);
                setFormName('');
                setFormPrice(0);
                setFormStations(new Set());
                setFormActive(true);
                setIsBuilding(true);
              }}
              className="px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold flex items-center gap-2 shadow-xl shadow-amber-950/40 transition-all"
            >
              <Plus className="w-5 h-5" />
              بناء باقة جديدة
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map(pkg => (
              <div key={pkg.id} className={`bg-slate-900 border rounded-3xl p-6 relative overflow-hidden ${pkg.isActive ? 'border-amber-500/30' : 'border-slate-800 opacity-70'}`}>
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold ${pkg.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                    {pkg.isActive ? 'مفعلة' : 'مخفية'}
                  </span>
                  <div className="flex gap-2 text-slate-500">
                    <button onClick={() => startEdit(pkg)} className="hover:text-white transition-colors"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(pkg.id)} className="hover:text-rose-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                
                <h3 className="text-xl font-black text-white mb-2">{pkg.name}</h3>
                <div className="flex items-center gap-2 text-amber-400 font-bold text-2xl mb-6">
                  {pkg.priceEGP} <span className="text-sm font-medium">ج.م</span>
                </div>
                
                <div className="space-y-2 mb-6">
                  <div className="text-xs text-slate-500 mb-2">المحطات المشمولة ({pkg.allowedStations.length}):</div>
                  <div className="flex flex-wrap gap-2">
                    {pkg.allowedStations.slice(0, 3).map(st => (
                      <span key={st} className="px-2 py-1 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-300 truncate max-w-[120px]">
                        {availableStations.find(c => c.id === st)?.title || `المحطة ${st}`}
                      </span>
                    ))}
                    {pkg.allowedStations.length > 3 && (
                      <span className="px-2 py-1 bg-slate-800 rounded-md text-xs text-slate-400">+{pkg.allowedStations.length - 3}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {packages.length === 0 && (
              <div className="col-span-full p-10 text-center text-slate-500 border border-dashed border-slate-800 rounded-3xl">
                لا توجد باقات حالياً. قم بإنشاء باقة جديدة.
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 animate-in zoom-in-95 duration-300">
          <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-6">
            <h2 className="text-2xl font-black text-white flex items-center gap-3">
              <Tag className="w-6 h-6 text-amber-500" />
              {editingId ? 'تعديل الباقة' : 'بناء باقة جديدة'}
            </h2>
            <button onClick={() => setIsBuilding(false)} className="text-slate-400 hover:text-white">إلغاء</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">اسم الباقة</label>
                <input 
                  type="text" 
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="مثال: باقة النصف الثاني"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">السعر (EGP)</label>
                <input 
                  type="number" 
                  value={formPrice}
                  onChange={e => setFormPrice(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none"
                />
              </div>
              <div className="flex items-center gap-3 pt-4">
                <button 
                  onClick={() => setFormActive(!formActive)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formActive ? 'bg-amber-500' : 'bg-slate-700'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formActive ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className="text-sm font-bold text-slate-300">تفعيل الباقة للطلاب</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-500" />
                المحطات المشمولة (صلاحيات الوصول)
              </label>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 max-h-[300px] overflow-y-auto space-y-2">
                {availableStations.map(station => (
                  <label key={station.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-900 cursor-pointer transition-colors border border-transparent hover:border-slate-800">
                    <input 
                      type="checkbox" 
                      checked={formStations.has(station.id)}
                      onChange={() => toggleStation(station.id)}
                      className="mt-1 w-4 h-4 rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-950"
                    />
                    <div>
                      <div className="text-sm font-bold text-slate-200">{station.title}</div>
                      <div className="text-xs text-slate-500 mt-1">{station.description.substring(0, 50)}...</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t border-slate-800">
            <button 
              onClick={handleSave}
              className="px-8 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold flex items-center gap-2 shadow-xl shadow-amber-950/40"
            >
              <CheckCircle2 className="w-5 h-5" />
              حفظ الباقة
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
