import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, updateDoc, doc, writeBatch } from 'firebase/firestore';
import { 
  Search, 
  Filter, 
  Download, 
  ShieldBan, 
  ShieldCheck, 
  Smartphone, 
  CheckSquare, 
  Square,
  RefreshCw,
  Edit3,
  X,
  Lock,
  Unlock,
  Calendar,
  Layers,
  Save
} from 'lucide-react';
import { SUBSCRIPTION_PACKAGES } from '../../data/curriculumData';

interface Student {
  uid: string;
  fullName: string;
  email: string;
  phone?: string;
  governorate?: string;
  activeDeviceId?: string;
  role: string;
  unlockedUnits?: string[];
  packageId?: string;
  subscriptionExpiresAt?: string;
  isBanned?: boolean;
}

const ALL_UNITS = [
  { id: 'unit-1', name: 'الوحدة 1: هرم المعرفة DIKW وتحديات البيانات' },
  { id: 'unit-2', name: 'الوحدة 2: الأمن السيبراني والتشفير الحديث' },
  { id: 'unit-3', name: 'الوحدة 3: هياكل البيانات الخوارزمية وتصميم الأنظمة' },
  { id: 'unit-4', name: 'الوحدة 4: تعلم الآلة (ML) والتحليل التنبئي' },
  { id: 'unit-5', name: 'الوحدة 5: الرؤية الحاسوبية ومعالجة الصور' },
  { id: 'unit-6', name: 'الوحدة 6: معالجة اللغات الطبيعية (NLP)' },
  { id: 'unit-7', name: 'الوحدة 7: نماذج اللغة الكبيرة (LLM) والذكاء التوليدي' },
];

export const AdminStudents: React.FC<{ isAssistant?: boolean }> = ({ isAssistant = false }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  
  // Edit modal state
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editUnits, setEditUnits] = useState<string[]>([]);
  const [editPackageId, setEditPackageId] = useState<string>('full_curriculum');
  const [editExpiresAt, setEditExpiresAt] = useState<string>('');
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const db = getFirestore();
      const snap = await getDocs(collection(db, 'users'));
      const data = snap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as Student));
      setStudents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.role === 'student' &&
    (s.fullName.includes(searchTerm) || s.email.includes(searchTerm) || (s.phone && s.phone.includes(searchTerm)))
  );

  const toggleSelection = (uid: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(uid)) newSet.delete(uid);
    else newSet.add(uid);
    setSelectedIds(newSet);
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredStudents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredStudents.map(s => s.uid)));
    }
  };

  const handleSingleResetDevice = async (student: Student) => {
    if (!window.confirm(`هل أنت متأكد من فك ارتباط الجهاز للطالب: ${student.fullName}؟`)) return;
    try {
      const db = getFirestore();
      await updateDoc(doc(db, 'users', student.uid), {
        activeDeviceId: null,
        deviceLinkedAt: null
      });
      setStudents(students.map(s => s.uid === student.uid ? { ...s, activeDeviceId: undefined } : s));
      alert(`تم فك ارتباط الجهاز للطالب ${student.fullName} بنجاح.`);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء فك الارتباط.');
    }
  };

  const handleResetDeviceBulk = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`هل أنت متأكد من فك ارتباط الجهاز لـ (${selectedIds.size}) طالب؟`)) return;

    try {
      const db = getFirestore();
      const batch = writeBatch(db);
      selectedIds.forEach(uid => {
        batch.update(doc(db, 'users', uid), { activeDeviceId: null, deviceLinkedAt: null });
      });
      await batch.commit();
      
      setStudents(students.map(s => selectedIds.has(s.uid) ? { ...s, activeDeviceId: undefined } : s));
      setSelectedIds(new Set());
      alert('تم فك ارتباط الأجهزة بنجاح.');
    } catch (err) {
      console.error(err);
      alert('حدث خطأ.');
    }
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setEditUnits(student.unlockedUnits || ['unit-1']);
    setEditPackageId(student.packageId || 'full_curriculum');
    setEditExpiresAt(student.subscriptionExpiresAt || '2027-07-01');
  };

  const toggleEditUnit = (unitId: string) => {
    if (editUnits.includes(unitId)) {
      setEditUnits(editUnits.filter(u => u !== unitId));
    } else {
      setEditUnits([...editUnits, unitId]);
    }
  };

  const unlockAllUnits = () => {
    setEditUnits(ALL_UNITS.map(u => u.id));
  };

  const handleSaveStudentEdit = async () => {
    if (!editingStudent) return;
    setSavingEdit(true);
    try {
      const db = getFirestore();
      await updateDoc(doc(db, 'users', editingStudent.uid), {
        unlockedUnits: editUnits,
        packageId: editPackageId,
        subscriptionExpiresAt: editExpiresAt,
      });

      setStudents(students.map(s => s.uid === editingStudent.uid ? {
        ...s,
        unlockedUnits: editUnits,
        packageId: editPackageId,
        subscriptionExpiresAt: editExpiresAt
      } : s));

      setEditingStudent(null);
      alert('تم تحديث صلاحيات ووحدات الطالب بنجاح.');
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء حفظ التعديلات.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleExportCSV = () => {
    const listToExport = selectedIds.size > 0 
      ? students.filter(s => selectedIds.has(s.uid))
      : filteredStudents;

    let csv = '\uFEFF'; // BOM for Arabic support in Excel
    csv += 'الاسم الكامل,البريد الإلكتروني,رقم الهاتف,المحافظة,حالة الجهاز,الباقة,تاريخ الانتهاء,الوحدات المفتوحة\n';
    
    listToExport.forEach(s => {
      const unitsStr = (s.unlockedUnits || []).join(' | ');
      csv += `"${s.fullName}","${s.email}","${s.phone || ''}","${s.governorate || ''}","${s.activeDeviceId ? 'مقفل' : 'حر'}","${s.packageId || 'المنهج الكامل'}","${s.subscriptionExpiresAt || '2027-07-01'}","${unitsStr}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `parmaga_students_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div className="text-white p-10">جارٍ تحميل بيانات الطلاب...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input 
            type="text" 
            placeholder="بحث بالاسم، الإيميل، أو رقم الهاتف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pr-10 pl-4 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold flex items-center gap-2 text-xs transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>تصدير كشف Excel/CSV</span>
          </button>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm text-slate-300">
            <thead className="text-xs uppercase bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-4 w-12">
                  <button onClick={toggleAll} className="text-slate-500 hover:text-amber-500 transition-colors">
                    {selectedIds.size === filteredStudents.length && filteredStudents.length > 0 ? (
                      <CheckSquare className="w-5 h-5 text-amber-500" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                </th>
                <th className="p-4 font-bold">الطالب</th>
                <th className="p-4 font-bold">التواصل</th>
                <th className="p-4 font-bold">المحافظة</th>
                <th className="p-4 font-bold text-center">حالة الجهاز</th>
                <th className="p-4 font-bold text-center">الوحدات والباقة</th>
                <th className="p-4 font-bold text-center">إجراءات التحكم</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map(student => (
                <tr key={student.uid} className={`border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors ${selectedIds.has(student.uid) ? 'bg-amber-500/5' : ''}`}>
                  <td className="p-4">
                    <button onClick={() => toggleSelection(student.uid)} className="text-slate-500 hover:text-amber-500 transition-colors">
                      {selectedIds.has(student.uid) ? (
                        <CheckSquare className="w-5 h-5 text-amber-500" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-white">{student.fullName}</div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">{student.uid.slice(0, 10)}...</div>
                  </td>
                  <td className="p-4">
                    <div className="text-slate-300 text-xs">{student.email}</div>
                    <div className="text-slate-500 text-xs mt-0.5 font-mono" dir="ltr">{student.phone || '---'}</div>
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-xs font-semibold">{student.governorate || '---'}</span>
                  </td>
                  <td className="p-4 text-center">
                    {student.activeDeviceId ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 text-xs font-bold border border-rose-500/20">
                        <Smartphone className="w-3.5 h-3.5" /> مقفل بجهاز
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                        جهاز حر
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <div className="text-xs text-amber-400 font-bold">
                      {student.unlockedUnits?.length ? `${student.unlockedUnits.length} وحدات مفعلة` : 'المنهج كاملاً'}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      ينتهي: {student.subscriptionExpiresAt || '2027-07-01'}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(student)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                        title="تعديل الوحدات والباقة"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                        <span>الوحدات</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSingleResetDevice(student)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                        title="إعادة تعيين قفل الجهاز بنقرة واحدة"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                        <span>فك الجهاز</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">لا يوجد طلاب مطابقين للبحث.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 border border-amber-500/30 p-4 rounded-2xl shadow-2xl shadow-amber-950/40 flex items-center gap-6 z-40">
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 font-semibold">تم تحديد</span>
            <strong className="text-amber-400 text-lg">{selectedIds.size} طالب</strong>
          </div>
          
          <div className="w-px h-10 bg-slate-800" />
          
          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={handleResetDeviceBulk}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold flex items-center gap-2 transition-colors border border-slate-700 text-xs"
            >
              <Smartphone className="w-4 h-4 text-amber-400" />
              <span>فك ارتباط الأجهزة المحددة</span>
            </button>
            <button 
              type="button"
              onClick={handleExportCSV}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold flex items-center gap-2 transition-colors border border-slate-700 text-xs"
            >
              <Download className="w-4 h-4 text-blue-400" />
              <span>تصدير المحددين CSV</span>
            </button>
          </div>
        </div>
      )}

      {/* Student Edit Modal (Units & Package) */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">إدارة صلاحيات ووحدات الطالب</h3>
                <p className="text-xs text-slate-400 mt-0.5">{editingStudent.fullName} ({editingStudent.email})</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Package & Expiry */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">نوع الباقة</label>
                <select
                  value={editPackageId}
                  onChange={(e) => setEditPackageId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                >
                  {SUBSCRIPTION_PACKAGES.map(pkg => (
                    <option key={pkg.id} value={pkg.id}>{pkg.name} ({pkg.priceEGP} ج.م)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">تاريخ انتهاء الاشتراك</label>
                <input
                  type="date"
                  value={editExpiresAt}
                  onChange={(e) => setEditExpiresAt(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Custom Unit Unlock */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300">
                  فتح وحدات محددة (Custom Unit Unlock)
                </label>
                <button
                  type="button"
                  onClick={unlockAllUnits}
                  className="text-xs text-emerald-400 hover:underline font-semibold"
                >
                  فتح جميع الوحدات (المنهج كاملاً)
                </button>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {ALL_UNITS.map(u => {
                  const isChecked = editUnits.includes(u.id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => toggleEditUnit(u.id)}
                      className={`w-full p-3 rounded-xl border flex items-center justify-between text-right text-xs font-semibold transition-colors ${
                        isChecked
                          ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/40'
                      }`}
                    >
                      <span>{u.name}</span>
                      {isChecked ? (
                        <Unlock className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Lock className="w-4 h-4 text-slate-600" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveStudentEdit}
                disabled={savingEdit}
                className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{savingEdit ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
