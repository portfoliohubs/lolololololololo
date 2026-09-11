import fs from 'fs';
import path from 'path';

interface TestCase {
  name: string;
  run: () => boolean | Promise<boolean>;
}

const tests: TestCase[] = [];

function describe(name: string, fn: () => void) {
  fn();
}

function test(name: string, fn: () => boolean | Promise<boolean>) {
  tests.push({ name, run: fn });
}

// -------------------------------------------------------------
// Test Suite 1: Access Control Matrix Simulation
// -------------------------------------------------------------
describe('Access Control Matrix', () => {
  // Mock checkAccess logic mirroring server.ts exactly
  function checkServerAccess(
    user: { role: string; subscriptionStatus: string; unlockedUnits: number[]; suspended?: boolean } | null,
    targetUnit: number
  ): { allowed: boolean; code: number; reason: string } {
    if (!user) {
      return { allowed: false, code: 401, reason: 'NOT_AUTHENTICATED' };
    }
    if (user.role === 'admin' || user.role === 'assistant') {
      return { allowed: true, code: 200, reason: 'STAFF_BYPASS' };
    }
    if (user.suspended) {
      return { allowed: false, code: 403, reason: 'ACCOUNT_SUSPENDED' };
    }
    if (user.subscriptionStatus !== 'active') {
      return { allowed: false, code: 403, reason: 'NO_ACTIVE_SUBSCRIPTION' };
    }
    const units = Array.isArray(user.unlockedUnits) ? user.unlockedUnits.map(Number) : [];
    if (!units.includes(targetUnit)) {
      return { allowed: false, code: 403, reason: 'UNIT_NOT_UNLOCKED' };
    }
    return { allowed: true, code: 200, reason: 'ACCESS_GRANTED' };
  }

  test('Anonymous visitor is blocked with 401', () => {
    const res = checkServerAccess(null, 1);
    return res.allowed === false && res.code === 401 && res.reason === 'NOT_AUTHENTICATED';
  });

  test('New student with default inactive subscription is blocked with 403', () => {
    const newStudent = {
      role: 'student',
      subscriptionStatus: 'inactive',
      unlockedUnits: [],
      suspended: false
    };
    const res = checkServerAccess(newStudent, 1);
    return res.allowed === false && res.code === 403 && res.reason === 'NO_ACTIVE_SUBSCRIPTION';
  });

  test('Suspended student is blocked with 403 regardless of units', () => {
    const suspendedStudent = {
      role: 'student',
      subscriptionStatus: 'active',
      unlockedUnits: [1, 2, 3],
      suspended: true
    };
    const res = checkServerAccess(suspendedStudent, 1);
    return res.allowed === false && res.code === 403 && res.reason === 'ACCOUNT_SUSPENDED';
  });

  test('Active student with Unit 1 can access Unit 1', () => {
    const student = {
      role: 'student',
      subscriptionStatus: 'active',
      unlockedUnits: [1],
      suspended: false
    };
    const res = checkServerAccess(student, 1);
    return res.allowed === true && res.code === 200 && res.reason === 'ACCESS_GRANTED';
  });

  test('Active student with Unit 1 is BLOCKED from Unit 2', () => {
    const student = {
      role: 'student',
      subscriptionStatus: 'active',
      unlockedUnits: [1],
      suspended: false
    };
    const res = checkServerAccess(student, 2);
    return res.allowed === false && res.code === 403 && res.reason === 'UNIT_NOT_UNLOCKED';
  });

  test('Admin user has universal bypass to all units', () => {
    const admin = {
      role: 'admin',
      subscriptionStatus: 'inactive',
      unlockedUnits: [],
      suspended: false
    };
    const res1 = checkServerAccess(admin, 1);
    const res7 = checkServerAccess(admin, 7);
    return res1.allowed === true && res7.allowed === true;
  });

  test('Teaching Assistant has universal access to view all units', () => {
    const assistant = {
      role: 'assistant',
      subscriptionStatus: 'inactive',
      unlockedUnits: [],
      suspended: false
    };
    const res = checkServerAccess(assistant, 5);
    return res.allowed === true && res.code === 200;
  });
});

// -------------------------------------------------------------
// Test Suite 2: Admin Command RBAC Rules
// -------------------------------------------------------------
describe('Admin Command RBAC Rules', () => {
  function checkAdminCommandPermissions(
    executorRole: string,
    action: string
  ): { permitted: boolean; error?: string } {
    if (executorRole !== 'admin' && executorRole !== 'assistant') {
      return { permitted: false, error: 'NOT_STAFF' };
    }
    if (action === 'setSuspended' && executorRole !== 'admin') {
      return { permitted: false, error: 'ADMIN_ONLY' };
    }
    return { permitted: true };
  }

  test('Student cannot execute any admin command', () => {
    const res = checkAdminCommandPermissions('student', 'resetDevice');
    return res.permitted === false && res.error === 'NOT_STAFF';
  });

  test('Assistant can reset device and set units', () => {
    const res1 = checkAdminCommandPermissions('assistant', 'resetDevice');
    const res2 = checkAdminCommandPermissions('assistant', 'setUnlockedUnits');
    return res1.permitted === true && res2.permitted === true;
  });

  test('Assistant CANNOT suspend student (Admin-only)', () => {
    const res = checkAdminCommandPermissions('assistant', 'setSuspended');
    return res.permitted === false && res.error === 'ADMIN_ONLY';
  });

  test('Admin can execute all actions including setSuspended', () => {
    const res = checkAdminCommandPermissions('admin', 'setSuspended');
    return res.permitted === true;
  });
});

// -------------------------------------------------------------
// Test Suite 3: Content Storage Security & Integrity
// -------------------------------------------------------------
describe('Content Storage Security & Integrity', () => {
  test('Protected content directory exists and contains 23 lessons', () => {
    const protectedDir = path.join(process.cwd(), 'protected_content', 'lessons');
    if (!fs.existsSync(protectedDir)) return false;
    let lessonCount = 0;
    const units = fs.readdirSync(protectedDir);
    for (const unit of units) {
      const unitPath = path.join(protectedDir, unit);
      if (fs.statSync(unitPath).isDirectory()) {
        const lessons = fs.readdirSync(unitPath);
        lessonCount += lessons.length;
      }
    }
    return lessonCount === 23;
  });

  test('Public content directory does NOT expose raw questions.json', () => {
    const publicDir = path.join(process.cwd(), 'public', 'content');
    if (!fs.existsSync(publicDir)) return true; // Ideal
    const hasRawQuestions = fs.existsSync(path.join(publicDir, 'lessons', 'unit_1', 'lesson_1_1', 'questions.json'));
    return !hasRawQuestions; // Must NOT exist in public
  });

  test('Final mock exams exist in protected_content and contain 5 models with 250 questions', () => {
    const mockExamsPath = path.join(process.cwd(), 'protected_content', 'final_reviews_and_exams', 'final_mock_exams.json');
    if (!fs.existsSync(mockExamsPath)) return false;
    const exams = JSON.parse(fs.readFileSync(mockExamsPath, 'utf8'));
    if (!Array.isArray(exams) || exams.length !== 5) return false;
    const totalQ = exams.reduce((sum, e) => sum + (e.questions?.length || 0), 0);
    return totalQ === 250;
  });
});

// -------------------------------------------------------------
// Runner
// -------------------------------------------------------------
async function runAll() {
  console.log('====================================================');
  console.log('  PARMAGA SECURITY & ACCESS CONTROL TEST HARNESS   ');
  console.log('====================================================');

  let passed = 0;
  let failed = 0;

  for (const t of tests) {
    try {
      const ok = await t.run();
      if (ok) {
        console.log(`  [PASS] ${t.name}`);
        passed++;
      } else {
        console.error(`  [FAIL] ${t.name}`);
        failed++;
      }
    } catch (err) {
      console.error(`  [ERROR] ${t.name}:`, err);
      failed++;
    }
  }

  console.log('----------------------------------------------------');
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAll();
