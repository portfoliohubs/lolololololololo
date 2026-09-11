import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());

interface DecodedUser {
  uid: string;
  email?: string;
  role: 'student' | 'assistant' | 'admin';
  subscriptionStatus: 'inactive' | 'active' | 'expired' | 'suspended';
  unlockedUnits: number[];
  suspended: boolean;
  activeDeviceId?: string;
}

// Extract and verify user session from Authorization header
async function authenticateRequest(req: Request): Promise<{ user?: DecodedUser; error?: string; status: number }> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Authentication required. No Bearer token provided.', status: 401 };
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) {
    return { error: 'Malformed authorization token.', status: 401 };
  }

  try {
    // Decode JWT payload without third-party libraries
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { error: 'Invalid JWT structure.', status: 401 };
    }

    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
    const uid = payload.user_id || payload.sub;
    if (!uid) {
      return { error: 'Invalid token claims: missing subject identifier.', status: 401 };
    }

    // Check token expiration
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return { error: 'Token has expired. Please refresh your session.', status: 401 };
    }

    // Query Firestore REST API with the token to verify permissions & retrieve latest state
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/parmaga-c67d4/databases/(default)/documents/users/${uid}`;
    const fsRes = await fetch(firestoreUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!fsRes.ok) {
      // If Firestore rejects the token or document is not readable
      const errBody = await fsRes.text();
      return { error: `Access denied by Firestore security rules: ${fsRes.statusText}`, status: 403 };
    }

    const docData: any = await fsRes.json();
    const fields = docData.fields || {};

    const role = (fields.role?.stringValue || 'student') as 'student' | 'assistant' | 'admin';
    const subscriptionStatus = (fields.subscriptionStatus?.stringValue || 'inactive') as any;
    
    // Parse unlockedUnits as numbers
    const rawUnits = fields.unlockedUnits?.arrayValue?.values || [];
    const unlockedUnits: number[] = rawUnits
      .map((v: any) => {
        if (v.integerValue !== undefined) return parseInt(v.integerValue, 10);
        if (v.stringValue !== undefined) {
          const num = parseInt(v.stringValue.replace(/\D/g, ''), 10);
          return isNaN(num) ? null : num;
        }
        return null;
      })
      .filter((n: any): n is number => n !== null);

    const suspended = fields.suspended?.booleanValue || false;
    const activeDeviceId = fields.activeDeviceId?.stringValue;

    return {
      status: 200,
      user: {
        uid,
        email: payload.email,
        role,
        subscriptionStatus,
        unlockedUnits,
        suspended,
        activeDeviceId
      }
    };
  } catch (err: any) {
    return { error: `Authentication validation failure: ${err.message}`, status: 401 };
  }
}

// 1. Health check API
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 2. Protected Curriculum Content API
app.get('/api/content/lessons/:unitId/:lessonId/:file', async (req: Request, res: Response) => {
  const { unitId, lessonId, file } = req.params;
  const unitNum = parseInt(unitId.replace('unit_', ''), 10);

  // Authenticate user
  const authResult = await authenticateRequest(req);
  if (!authResult.user) {
    return res.status(authResult.status).json({
      error: 'permission_denied',
      code: 'AUTH_FAILED',
      message: authResult.error
    });
  }

  const user = authResult.user;

  // Staff (admin/assistant) have unrestricted learning access
  if (user.role !== 'admin' && user.role !== 'assistant') {
    // Check suspension
    if (user.suspended) {
      return res.status(403).json({
        error: 'permission_denied',
        code: 'ACCOUNT_SUSPENDED',
        message: 'تم إيقاف هذا الحساب. يرجى مراجعة إدارة المنصة.'
      });
    }

    // Check subscription status
    if (user.subscriptionStatus !== 'active') {
      return res.status(403).json({
        error: 'permission_denied',
        code: 'SUBSCRIPTION_INACTIVE',
        message: 'لا يوجد اشتراك نشط لهذا الحساب. يرجى تفعيل الاشتراك للمتابعة.'
      });
    }

    // Check unit unlock
    if (isNaN(unitNum) || !user.unlockedUnits.includes(unitNum)) {
      return res.status(403).json({
        error: 'permission_denied',
        code: 'UNIT_LOCKED',
        message: `الوحدة ${unitNum} مقفلة. لم يتم تفعيلها ضمن باقتك الدراسية.`
      });
    }
  }

  // File path resolution inside protected_content
  const safeFile = path.basename(file);
  const filePath = path.join(process.cwd(), 'protected_content', 'lessons', unitId, lessonId, safeFile);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'file_not_found', message: 'الملف المطلوب غير متوفر.' });
  }

  if (safeFile.endsWith('.json')) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return res.json(data);
  } else {
    const content = fs.readFileSync(filePath, 'utf8');
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    return res.send(content);
  }
});

// 3. Final Mock Exams API
app.get('/api/content/final-exams', async (req: Request, res: Response) => {
  const authResult = await authenticateRequest(req);
  if (!authResult.user) {
    return res.status(authResult.status).json({
      error: 'permission_denied',
      code: 'AUTH_FAILED',
      message: authResult.error
    });
  }

  const user = authResult.user;
  if (user.role !== 'admin' && user.role !== 'assistant') {
    if (user.suspended) {
      return res.status(403).json({
        error: 'permission_denied',
        code: 'ACCOUNT_SUSPENDED',
        message: 'الحساب موقوف.'
      });
    }
    if (user.subscriptionStatus !== 'active') {
      return res.status(403).json({
        error: 'permission_denied',
        code: 'SUBSCRIPTION_INACTIVE',
        message: 'الاشتراك غير مفعّل.'
      });
    }
    // Final mock exams require active subscription with all units or package
    if (user.unlockedUnits.length === 0) {
      return res.status(403).json({
        error: 'permission_denied',
        code: 'UNIT_LOCKED',
        message: 'يتطلب فتح الامتحانات الشاملة تفعيل باقة دراسية نشطة.'
      });
    }
  }

  const examPath = path.join(process.cwd(), 'protected_content', 'final_reviews_and_exams', 'final_mock_exams.json');
  if (!fs.existsSync(examPath)) {
    return res.status(404).json({ error: 'exams_not_found', message: 'امتحانات المحاكاة غير متوفرة.' });
  }

  const examsData = JSON.parse(fs.readFileSync(examPath, 'utf8'));
  return res.json(examsData);
});

// 4. Unit Capsule A4 PDF / Markdown API
app.get('/api/content/unit-capsule/:unitNumber', async (req: Request, res: Response) => {
  const unitNum = parseInt(req.params.unitNumber, 10);
  const authResult = await authenticateRequest(req);
  if (!authResult.user) {
    return res.status(authResult.status).json({
      error: 'permission_denied',
      code: 'AUTH_FAILED',
      message: authResult.error
    });
  }

  const user = authResult.user;
  if (user.role !== 'admin' && user.role !== 'assistant') {
    if (user.suspended || user.subscriptionStatus !== 'active' || !user.unlockedUnits.includes(unitNum)) {
      return res.status(403).json({
        error: 'permission_denied',
        code: 'UNIT_LOCKED',
        message: `كبسولة الوحدة ${unitNum} مقفلة.`
      });
    }
  }

  const capsulePath = path.join(process.cwd(), 'protected_content', 'final_reviews_and_exams', 'unit_capsules', `unit_${unitNum}_capsule.md`);
  if (!fs.existsSync(capsulePath)) {
    return res.status(404).json({ error: 'capsule_not_found', message: 'الكبسولة المطلوبة غير متوفرة.' });
  }

  const content = fs.readFileSync(capsulePath, 'utf8');
  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  return res.send(content);
});

// 5. Centralized Admin Execution API
app.post('/api/admin/execute-command', async (req: Request, res: Response) => {
  const authResult = await authenticateRequest(req);
  if (!authResult.user) {
    return res.status(authResult.status).json({ ok: false, code: 'UNAUTHORIZED', message: authResult.error });
  }

  const executor = authResult.user;
  if (executor.role !== 'admin' && executor.role !== 'assistant') {
    return res.status(403).json({ ok: false, code: 'FORBIDDEN', message: 'صلاحيات إدارية مطلوبة.' });
  }

  const { action, targetUserId, values, reason } = req.body;
  if (!targetUserId || !action) {
    return res.status(400).json({ ok: false, code: 'INVALID_PARAMETERS', message: 'معرف الطالب ونوع العملية مطلوبان.' });
  }

  // Assistant permissions boundary check
  if (executor.role === 'assistant') {
    const allowedForAssistant = ['resetDevice', 'setUnlockedUnits', 'setSubscription'];
    if (!allowedForAssistant.includes(action)) {
      return res.status(403).json({
        ok: false,
        code: 'ASSISTANT_RESTRICTION',
        message: 'لا يمتلك المساعد صلاحية تنفيذ هذا الإجراء الإداري.'
      });
    }
  }

  const token = req.headers.authorization!.split('Bearer ')[1].trim();

  try {
    const userDocUrl = `https://firestore.googleapis.com/v1/projects/parmaga-c67d4/databases/(default)/documents/users/${targetUserId}`;
    
    // Read previous student state
    const prevRes = await fetch(userDocUrl, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!prevRes.ok) {
      return res.status(404).json({ ok: false, code: 'USER_NOT_FOUND', message: 'تعذر العثور على مستند الطالب في قاعدة البيانات.' });
    }

    const prevDoc: any = await prevRes.json();
    const prevFields = prevDoc.fields || {};

    // Prepare updated fields
    const updatedFirestoreFields: Record<string, any> = {};
    const patchMask: string[] = [];

    if (action === 'setUnlockedUnits') {
      const units: number[] = Array.isArray(values?.unlockedUnits) ? values.unlockedUnits.map(Number) : [];
      updatedFirestoreFields['unlockedUnits'] = {
        arrayValue: {
          values: units.map(u => ({ integerValue: u.toString() }))
        }
      };
      patchMask.push('unlockedUnits');
      
      // Auto-activate subscription if units > 0
      if (units.length > 0 && prevFields.subscriptionStatus?.stringValue !== 'active') {
        updatedFirestoreFields['subscriptionStatus'] = { stringValue: 'active' };
        patchMask.push('subscriptionStatus');
      }
    } else if (action === 'setSubscription') {
      const status = values?.subscriptionStatus || 'active';
      updatedFirestoreFields['subscriptionStatus'] = { stringValue: status };
      patchMask.push('subscriptionStatus');
      if (values?.packageId) {
        updatedFirestoreFields['packageId'] = { stringValue: values.packageId };
        patchMask.push('packageId');
      }
      if (values?.subscriptionExpiresAt) {
        updatedFirestoreFields['subscriptionExpiresAt'] = { stringValue: values.subscriptionExpiresAt };
        patchMask.push('subscriptionExpiresAt');
      }
    } else if (action === 'resetDevice') {
      updatedFirestoreFields['activeDeviceId'] = { nullValue: null };
      patchMask.push('activeDeviceId');
    } else if (action === 'setSuspended') {
      if (executor.role !== 'admin') {
        return res.status(403).json({ ok: false, code: 'ADMIN_ONLY', message: 'إيقاف الحساب مقتصر على المشرف الرئيسي فقط.' });
      }
      const suspended = Boolean(values?.suspended);
      updatedFirestoreFields['suspended'] = { booleanValue: suspended };
      patchMask.push('suspended');
    }

    // Add updatedAt timestamp
    const nowIso = new Date().toISOString();
    updatedFirestoreFields['updatedAt'] = { stringValue: nowIso };
    patchMask.push('updatedAt');

    // Execute Patch on Firestore with Mask
    const maskParams = patchMask.map(m => `updateMask.fieldPaths=${encodeURIComponent(m)}`).join('&');
    const patchUrl = `${userDocUrl}?${maskParams}`;

    const patchRes = await fetch(patchUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: updatedFirestoreFields
      })
    });

    if (!patchRes.ok) {
      const errText = await patchRes.text();
      return res.status(patchRes.status).json({
        ok: false,
        code: 'FIRESTORE_WRITE_FAILED',
        message: `فشل الحفظ في Firestore: ${errText}`
      });
    }

    // Write immutable audit log
    const auditUrl = `https://firestore.googleapis.com/v1/projects/parmaga-c67d4/databases/(default)/documents/audit_logs`;
    await fetch(auditUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          executorUid: { stringValue: executor.uid },
          executorEmail: { stringValue: executor.email || '' },
          executorRole: { stringValue: executor.role },
          targetUserId: { stringValue: targetUserId },
          action: { stringValue: action },
          newValuesJson: { stringValue: JSON.stringify(values || {}) },
          timestamp: { stringValue: nowIso },
          reason: { stringValue: reason || 'إجراء إداري معتمد' }
        }
      })
    });

    // Re-read document to verify persistence
    const verifyRes = await fetch(userDocUrl, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const verifiedDoc: any = await verifyRes.json();

    return res.json({
      ok: true,
      userId: targetUserId,
      updatedFields: values,
      updatedAt: nowIso,
      docFields: verifiedDoc.fields
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, code: 'SERVER_ERROR', message: err.message });
  }
});

// Vite Middleware for SPA Frontend
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Parmaga secure server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
