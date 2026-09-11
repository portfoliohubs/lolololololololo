# تقرير تدقيق وقواعد أمان فايرستور
# FIRESTORE SECURITY RULES REPORT

**الملف المستهدف:** `/firestore.rules`  
**حالة النشر والتوافق:** متوافقة 100% مع معايير Firebase v2 Security Rules  
**تاريخ المراجعة:** سبتمبر 2026  

---

## 1. فلسفة الأمان المطبقة (Security Architecture)

تعتمد القواعد الجديدة على مبدأ **Zero-Trust Default Deny**، بحيث يتم منع الوصول لجميع المسارات والمجموعات ما لم ينص صراحة على استثناء موثق:

```javascript
match /{document=**} {
  allow read, write: if false;
}
```

---

## 2. تفصيل القواعد والحماية على مستوى الحقول (Field-Level Security)

### أ. مجموعة الطلاب والمستخدمين (`/users/{userId}`)

1. **الإنشاء (`create`):**
   * يجب أن يكون المستخدم مسجلاً ومطابقاً لمعرفه الشخصي (`request.auth.uid == userId`).
   * يُمنع منعاً باتاً إنشاء حساب جديد بصلاحيات `admin` أو `assistant` من طرف العميل (`request.resource.data.role == 'student'`).
   * يُجبر الحساب الجديد على أن تكون حالة اشتراكه `inactive` والوحدات المفتوحة فارغة `unlockedUnits.size() == 0` والحساب غير مجمد `suspended == false`.

2. **التحديث (`update`):**
   * مسموح بالكامل لطاقم الإشراف (`isStaff() == true`).
   * بالنسبة للطالب العادي (`isOwner(userId)`):
     * **يُمنع تعديل حقول الأمان الحساسة:** `role`، `subscriptionStatus`، `packageId`، `subscriptionExpiresAt`، `unlockedUnits`، `suspended`.
     * محاولة إرسال قيم مغايرة لهذه الحقول تؤدي إلى رفض الطلب على مستوى محرك قواعد فايرستور مباشرة.
     * **حماية قفل الجهاز الواحد:** يمكن للطالب تسجيل معرّف جهازه `activeDeviceId` فقط إذا كان الحقل في قاعدة البيانات فارغاً أو غير موجود (`null` أو `''`). ولا يمكن للطالب استبدال المعرّف أو مسحه إلا عن طريق الإدارة (`adminService.resetDevice`).

3. **الحذف (`delete`):**
   * مقتصر حصرياً على المشرف العام (`isAdmin()`).

---

### ب. سجل التدقيق غير القابل للتعديل (`/audit_logs/{logId}`)

* **القراءة:** مقتصرة على الإدارة ومساعدي التدريس (`isStaff()`).
* **الإنشاء:** مقتصر على طاقم العمل مع شرط تطابق `executorUid == request.auth.uid`.
* **التعديل والحذف (`update, delete`):** **ممنوع قطعياً (`if false`)** لضمان عدم إمكانية محو أي أثر لأي عملية إدارية.

---

### ج. سجل المشرفين المعتمدين (`/admins/{adminId}`)

* **القراءة:** للمستخدمين المسجلين للتحقق من هوية المشرفين.
* **الكتابة:** مقتصرة فقط على المشرفين المصرح لهم مسبقاً.

---

## 3. محاكاة حالات الأمان (Security Audit Assertions)

| الحالة المختبرة | المتجه الأمني | النتيجة في القواعد |
|---|---|---|
| طالب يحاول تغيير `subscriptionStatus` إلى `active` | Client SDK injection | **رفض فوري (Permission Denied)** |
| طالب يحاول إضافة وحدة إلى `unlockedUnits` | Custom payload | **رفض فوري (Permission Denied)** |
| طالب يحاول تفريغ `activeDeviceId` لربط جهاز ثانٍ | Direct Document Update | **رفض فوري (Permission Denied)** |
| زائر مجهول يحاول قراءة بيانات مستخدم آخر | Unauthenticated Crawl | **رفض فوري (Permission Denied)** |
| مسؤول ينفذ تعديل وحدات مع تدوين في `audit_logs` | Admin Panel Action | **قبول مع توثيق غير قابل للمحو** |
