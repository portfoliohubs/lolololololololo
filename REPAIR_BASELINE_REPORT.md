# تقرير خط الأساس قبل الإصلاح (REPAIR_BASELINE_REPORT.md)
**التاريخ:** 2026-09-11  
**المنصة:** Parmaga (2026 - 2027)  
**الغرض:** إعادة إنتاج وتوثيق الثغرات الأمنية وانعدام فرض أوامر لوحة الإدارة ووصول الحساب الجديد بدون اشتراك قبل تطبيق الإصلاحات الهندسية.

---

## 1. الفحص المعماري لخط الأساس (Current State Architecture Audit)

### أ. موضع المحتوى (Content Exposure):
- **النتيجة:** جميع ملفات الدروس (23 درساً)، والأسئلة (2550 سؤالاً)، والبطاقات (460 بطاقة)، ونماذج الامتحانات النهائية محفوظة داخل مجلد العرض العام `public/content/`.
- **الخلل:** خادم Vite وخوادم الاستضافة الثابتة تتيح الوصول المباشر لهذه الملفات دون أي مصادقة عبر طلبات HTTP GET مباشرة (مثل `/content/lessons/unit_1/lesson_1_1/student_content.md`). أي طالب أو زائر يستطيع تحميل بنوك الأسئلة والشروحات بدون حساب أو اشتراك.

### ب. تنفيذ أوامر لوحة الإدارة (Admin Commands Execution):
- **النتيجة:** مكون `AdminStudents.tsx` يكتب حقولاً غير متوافقة (`unlockedUnits` كمصفوفة نصوص مثل `['unit-1', 'unit-2']` بدلاً من مصفوفة أرقام `[1, 2]`).
- لا توجد خدمة مركزية للعمليات الإدارية (`setStudentAccess`, `setSubscription`, `setUnlockedUnits`, `resetStudentDevice`, `setStudentSuspended`).
- لا يتم التحقق الصارم من رتبة المنفذ (`admin` مقابل `assistant`)، ولا يتم تسجيل سجل تدقيق غير قابل للتعديل (`audit_logs`) عند كل تعديل.
- مكون `CurriculumStations.tsx` يضبط حالة جميع المحطات على `status: 'available'` بشكل ثابت (Hardcoded) ولا يفحص إطلاقاً حالة اشتراك الطالب أو مصفوفة `unlockedUnits` المحفوظة في Firestore!

---

## 2. نتيجة السيناريو A: فتح الوحدات (Unit Unlocking Baseline)

### خطوات إعادة الإنتاج:
1. **حساب طالب تجريبي:** طالب مسجل في النظام.
2. **محاولة المشرف تحديد الوحدة 1 والوحدة 2 فقط:**
   - في واجهة `AdminStudents.tsx` السابقة، حفظ المشرف العملية نتج عنه كتابة `unlockedUnits: ['unit-1', 'unit-2']` في Firestore.
3. **إعادة تحميل لوحة الإدارة:**
   - قراءة مستند الطالب من Firestore أظهرت: `unlockedUnits = ["unit-1", "unit-2"]` (نوع البيانات نصوص وليس أرقام، ولا يوجد فحص للوحدة في الواجهة).
4. **فحص قدرة الطالب على قراءة المحتوى:**
   - طلب محتوى الوحدة 1 (`/content/lessons/unit_1/lesson_1_1/student_content.md`): **مسموح (Allowed - 200 OK)**
   - طلب محتوى الوحدة 2 (`/content/lessons/unit_2/lesson_2_1/student_content.md`): **مسموح (Allowed - 200 OK)**
   - طلب محتوى الوحدة 3 (`/content/lessons/unit_3/lesson_3_1/student_content.md`): **مسموح (Allowed - 200 OK - فشل أمني كارثي!)**

### تقييم النتيجة قبل الإصلاح:
```text
unlockedUnits === ["unit-1", "unit-2"] (Invalid Type, Should be [1, 2])
unit 1: allowed
unit 2: allowed
unit 3: allowed (FAILED: Security Breach - Unit 3 was NOT denied)
```

---

## 3. نتيجة السيناريو B: الاشتراك والوصول (Subscription & Content Access Baseline)

### خطوات إعادة الإنتاج:
1. **إنشاء حساب جديد:** تسجيل طالب جديد عبر البريد وكلمة المرور.
2. **تسجيل الدخول:** تم بنجاح بدون تفعيل اشتراك.
3. **فحص المستند في Firestore:**
   - حقل `subscriptionStatus`: غير موجود أو غير مفروض في جلب المحتوى.
   - حقل `unlockedUnits`: فارغ أو غير منشأ.
4. **فحص طلبات المحتوى من المتصفح والشبكة:**
   - طلب درس: `GET /content/lessons/unit_1/lesson_1_1/student_content.md` -> **200 OK (المحتوى متاح بالكامل)**
   - طلب أسئلة: `GET /content/lessons/unit_1/lesson_1_1/questions.json` -> **200 OK (الأسئلة متاحة بالكامل)**
   - طلب بطاقات: `GET /content/lessons/unit_1/lesson_1_1/flashcards.json` -> **200 OK (البطاقات متاحة بالكامل)**
   - طلب امتحان: `GET /content/final_reviews_and_exams/final_mock_exams.json` -> **200 OK (الامتحانات الوزارية متاحة بدون اشتراك)**

### تقييم النتيجة قبل الإصلاح:
```text
new account: authenticated
subscriptionStatus: inactive (or undefined)
protected content: allowed (FAILED: Security Breach - Content was served via public directory)
```

---

## 4. خطة العمل المعتمدة للإصلاح الجذري

1. **نقل المحتوى المحمي:**
   - إخراج `lessons` و `final_reviews_and_exams` بالكامل من المجلد العام `public/content/` ونقلها إلى دليل محمي `protected_content/`.
   - توفير بوابة وصول مؤمنة عبر خادم الـ API أو الدوال السحابية تتحقق من المصادقة، والاشتراك النشط، ورقم الوحدة المفتوحة لكل طالب.
2. **توحيد نموذج المستخدم في Firestore:**
   - حقول صريحة: `role: 'student' | 'assistant' | 'admin'`.
   - `subscriptionStatus: 'inactive' | 'active' | 'expired' | 'suspended'`.
   - `unlockedUnits: number[]` (أرقام حصراً: `[1, 2]`).
   - `suspended: boolean`.
3. **بناء خدمة العمليات الإدارية المركزية:**
   - تنفيذ `setStudentAccess`, `setSubscription`, `setUnlockedUnits`, `resetStudentDevice`, `setStudentSuspended`.
   - تسجيل عمليات التدقيق في `audit_logs` بشكل فوري وغير قابل للتعديل.
4. **تحديث شاشات العرض:**
   - ربط `CurriculumStations.tsx` و `LessonViewer.tsx` و `ExamEngine.tsx` بالبوابة المؤمنة وإظهار القفل على الوحدات غير المفتوحة.
5. **توحيد ومطابقة مخططات الأسئلة والبطاقات:**
   - تشغيل `content-schema-validator` لضمان صحة 2550 سؤالاً و460 بطاقة.
6. **مصفوفة الاختبارات القابلة لإعادة التشغيل:**
   - تشغيل `npm run test`, `npm run test:content`, `npm run test:rules` والتحقق من الرفض القاطع للمستخدمين غير المصرح لهم.
