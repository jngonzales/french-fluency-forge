#!/usr/bin/env tsx
/**
 * QA Gate for CI
 * Runs QA harness and fails if determinism tests don't pass
 * 
 * Usage: tsx scripts/qa_gate.ts
 */

import { execSync } from 'child_process';

console.log('🚪 Running QA Gate...\n');

try {
  // Run QA harness
  execSync('tsx scripts/qa_assessment.ts --runs=20', {
    stdio: 'inherit',
    cwd: process.cwd(),
  });
  
  console.log('\n✅ QA Gate PASSED - All determinism tests passed');
  process.exit(0);
} catch (error) {
  console.error('\n❌ QA Gate FAILED - Some tests did not pass');
  console.error('Fix the issues before merging to main.');
  process.exit(1);
}

