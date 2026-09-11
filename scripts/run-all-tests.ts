import { execSync } from 'child_process';

console.log('=== STARTING COMPLETE RE-RUNNABLE VERIFICATION SUITE ===\n');

try {
  console.log('--- Step 1: Content Schema & Validation ---');
  execSync('npx tsx scripts/content-schema-validator.ts', { stdio: 'inherit' });

  console.log('\n--- Step 2: Access Control Matrix & RBAC Verification ---');
  execSync('npx tsx scripts/run-access-control-tests.ts', { stdio: 'inherit' });

  console.log('\n✅ ALL VERIFICATION TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
} catch (err) {
  console.error('\n❌ TEST SUITE FAILED:', err);
  process.exit(1);
}
