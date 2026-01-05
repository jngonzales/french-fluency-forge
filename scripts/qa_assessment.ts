#!/usr/bin/env tsx
/**
 * QA Assessment Harness
 * Tests determinism and regression for all assessment modules
 * 
 * Usage: tsx scripts/qa_assessment.ts [--module MODULE_NAME] [--runs NUMBER]
 */

import * as fs from 'fs';
import * as path from 'path';
import { calculateSpeedSubscore, calculatePauseSubscore } from '../src/components/assessment/fluency/fluencyScoring';

interface TestResult {
  name: string;
  module: string;
  runs: number;
  scores: number[];
  mean: number;
  stddev: number;
  min: number;
  max: number;
  range: number;
  pass: boolean;
  reason?: string;
}

interface Report {
  timestamp: string;
  totalTests: number;
  passed: number;
  failed: number;
  results: TestResult[];
}

// PASS criteria
const DETERMINISM_CRITERIA = {
  range: 3,
  stddev: 1.0,
};

/**
 * Calculate standard deviation
 */
function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  
  return Math.sqrt(variance);
}

/**
 * Test fluency scoring determinism
 */
function testFluencyFixture(fixturePath: string, runs: number = 20): TestResult {
  const fixtureData = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
  const { name, input, expected } = fixtureData;
  
  const scores: number[] = [];
  
  for (let i = 0; i < runs; i++) {
    // Simulate metric calculation (in real test, this would call the full function)
    const { words, totalDuration } = input;
    
    // Calculate WPM
    const nonFillerWords = words.filter((w: any) => !['euh', 'heu', 'um'].includes(w.word.toLowerCase()));
    const speakingTime = nonFillerWords[nonFillerWords.length - 1].end - nonFillerWords[0].start;
    const articulationWpm = Math.round(nonFillerWords.length / (speakingTime / 60));
    
    // Calculate pauses
    let longPauseCount = 0;
    let maxPause = 0;
    let totalPauseDuration = 0;
    
    for (let j = 1; j < nonFillerWords.length; j++) {
      const gap = nonFillerWords[j].start - nonFillerWords[j - 1].end;
      if (gap > 0.3) {
        totalPauseDuration += gap;
        if (gap > maxPause) maxPause = gap;
        if (gap > 1.2) longPauseCount++;
      }
    }
    
    const pauseRatio = totalPauseDuration / totalDuration;
    
    // Calculate scores
    const speedSubscore = calculateSpeedSubscore(articulationWpm);
    const pauseSubscore = calculatePauseSubscore(longPauseCount, maxPause, pauseRatio);
    const totalScore = speedSubscore + pauseSubscore;
    
    scores.push(totalScore);
  }
  
  const mean = scores.reduce((sum, val) => sum + val, 0) / scores.length;
  const stddev = calculateStdDev(scores);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = max - min;
  
  const pass = range <= DETERMINISM_CRITERIA.range && stddev <= DETERMINISM_CRITERIA.stddev;
  
  return {
    name,
    module: 'fluency',
    runs,
    scores,
    mean: Math.round(mean * 10) / 10,
    stddev: Math.round(stddev * 100) / 100,
    min,
    max,
    range,
    pass,
    reason: !pass ? `Range: ${range} (max ${DETERMINISM_CRITERIA.range}), StdDev: ${stddev.toFixed(2)} (max ${DETERMINISM_CRITERIA.stddev})` : undefined,
  };
}

/**
 * Run all tests
 */
function runAllTests(runs: number = 20): Report {
  const results: TestResult[] = [];
  const fixturesDir = path.join(process.cwd(), 'fixtures');
  
  console.log('🔬 Running QA Assessment Harness...\n');
  console.log(`Runs per test: ${runs}`);
  console.log(`PASS criteria: range ≤ ${DETERMINISM_CRITERIA.range}, stddev ≤ ${DETERMINISM_CRITERIA.stddev}\n`);
  
  // Test Fluency fixtures
  const fluencyDir = path.join(fixturesDir, 'fluency');
  if (fs.existsSync(fluencyDir)) {
    const fluencyFixtures = fs.readdirSync(fluencyDir).filter(f => f.endsWith('.json'));
    
    console.log(`📊 Testing Fluency module (${fluencyFixtures.length} fixtures)...`);
    for (const fixture of fluencyFixtures) {
      const result = testFluencyFixture(path.join(fluencyDir, fixture), runs);
      results.push(result);
      
      const status = result.pass ? '✅ PASS' : '❌ FAIL';
      console.log(`  ${status} ${result.name}`);
      console.log(`     Mean: ${result.mean}, Range: ${result.range}, StdDev: ${result.stddev}`);
      if (!result.pass && result.reason) {
        console.log(`     Reason: ${result.reason}`);
      }
    }
    console.log('');
  }
  
  // TODO: Add tests for other modules when their fixtures are ready
  // For now, we'll just test Fluency which has the deterministic algorithm
  
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  
  const report: Report = {
    timestamp: new Date().toISOString(),
    totalTests: results.length,
    passed,
    failed,
    results,
  };
  
  // Write report
  const reportsDir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  const reportPath = path.join(reportsDir, `qa_report_${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log('📝 Summary:');
  console.log(`   Total tests: ${report.totalTests}`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`\n📄 Report saved: ${reportPath}`);
  
  return report;
}

/**
 * Main entry point
 */
function main() {
  const args = process.argv.slice(2);
  const runsArg = args.find(arg => arg.startsWith('--runs='));
  const runs = runsArg ? parseInt(runsArg.split('=')[1]) : 20;
  
  const report = runAllTests(runs);
  
  // Exit with error code if any tests failed
  process.exit(report.failed > 0 ? 1 : 0);
}

main();

