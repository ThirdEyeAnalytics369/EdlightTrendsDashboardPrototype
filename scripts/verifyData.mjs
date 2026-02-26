/**
 * Verification script for generated data.
 * Run with: node scripts/verifyData.mjs
 */
import { generateData } from '../src/data/generateData.js';
import { aggregateByGradeStandard, computeGradeTrends, calculateCelebratePercent } from '../src/data/dataUtils.js';

const data = generateData();
console.log(`\n=== DATA VERIFICATION ===\n`);
console.log(`Total rows: ${data.length}`);

// Row count check (~5,800 ±500)
const ok = data.length >= 5300 && data.length <= 6300;
console.log(`Row count in range [5300-6300]: ${ok ? 'PASS' : 'FAIL'}`);

// Grade distribution
for (const grade of [3, 4, 5]) {
  const gradeRows = data.filter(r => r['Grade'] === grade);
  console.log(`  Grade ${grade}: ${gradeRows.length} rows`);
}

// Grade trends
const trends = computeGradeTrends(data);
console.log(`\n--- Grade Trends ---`);
for (const grade of [3, 4, 5]) {
  const t = trends[grade];
  console.log(`  Grade ${grade}: baseline=${t.baseline}%, current=${t.current}%, diff=${t.diff > 0 ? '+' : ''}${t.diff}pt, trend=${t.trend}`);
}
console.log(`Grade 3 declining: ${trends[3].trend === 'declining' ? 'PASS' : 'FAIL'}`);
console.log(`Grade 5 improving: ${trends[5].trend === 'improving' ? 'PASS' : 'FAIL'}`);
console.log(`Grade 4 stable: ${trends[4].trend === 'stable' ? 'PASS' : 'FAIL'}`);

// Below-average teachers
const agg = aggregateByGradeStandard(data);
console.log(`\n--- Below-Average Teachers ---`);

function checkBelowAvg(grade, teacherName) {
  let flaggedCount = 0;
  for (const [std, summary] of Object.entries(agg[grade])) {
    const teacher = summary.teachers.find(t => t.teacherName === teacherName);
    if (teacher && teacher.belowAverage) {
      flaggedCount++;
      console.log(`  ${teacherName} flagged on ${std} (${teacher.masteryPercent}% vs grade avg, below by ${teacher.belowAverageBy}pt)`);
    }
  }
  return flaggedCount;
}

const jwFlagged = checkBelowAvg(3, 'James Wright');
console.log(`James Wright flagged on ≥2 standards: ${jwFlagged >= 2 ? 'PASS' : 'FAIL'} (${jwFlagged})`);

const ohFlagged = checkBelowAvg(4, 'Omar Hassan');
console.log(`Omar Hassan flagged on ≥2 standards: ${ohFlagged >= 2 ? 'PASS' : 'FAIL'} (${ohFlagged})`);

const crFlagged = checkBelowAvg(5, 'Carlos Rivera');
console.log(`Carlos Rivera flagged on ≥2 standards: ${crFlagged >= 2 ? 'PASS' : 'FAIL'} (${crFlagged})`);

// Omar Hassan n<10
console.log(`\n--- Minimum Threshold ---`);
let omarSmallSample = false;
for (const [std, summary] of Object.entries(agg[4])) {
  const omar = summary.teachers.find(t => t.teacherName === 'Omar Hassan');
  if (omar && !omar.hasEnoughData) {
    console.log(`  Omar Hassan n<10 on ${std}: total=${omar.totalStudents}`);
    omarSmallSample = true;
  }
}
console.log(`Omar Hassan has n<10 standard: ${omarSmallSample ? 'PASS' : 'FAIL'}`);

// Angela Foster N/A rate
console.log(`\n--- N/A Rates ---`);
const angelaRows = data.filter(r => r['Teacher'] === 'Angela Foster');
const angelaNa = angelaRows.filter(r => r['Mastery'] === '4. N/A').length;
const angelaNaRate = Math.round((angelaNa / angelaRows.length) * 100);
console.log(`  Angela Foster N/A rate: ${angelaNaRate}%`);
console.log(`Angela Foster ~12% N/A: ${angelaNaRate >= 9 && angelaNaRate <= 15 ? 'PASS' : 'FAIL'}`);

const overallNa = data.filter(r => r['Mastery'] === '4. N/A').length;
const overallNaRate = Math.round((overallNa / data.length) * 100);
console.log(`  Overall N/A rate: ${overallNaRate}%`);
console.log(`Overall N/A ~5-8%: ${overallNaRate >= 4 && overallNaRate <= 10 ? 'PASS' : 'FAIL'}`);

// Misconception clustering
console.log(`\n--- Misconception Clustering ---`);
// Check a computation-heavy standard (NBT)
for (const grade of [3, 4, 5]) {
  for (const [std, summary] of Object.entries(agg[grade])) {
    if (std.includes('NBT') && summary.misconceptions.length > 0) {
      console.log(`  ${std} dominant: ${summary.misconceptions[0].type} (${summary.misconceptions[0].percent}%)`);
      break;
    }
  }
}
// Check a conceptual standard (NF)
for (const grade of [3, 4, 5]) {
  for (const [std, summary] of Object.entries(agg[grade])) {
    if (std.includes('NF') && summary.misconceptions.length > 0) {
      console.log(`  ${std} dominant: ${summary.misconceptions[0].type} (${summary.misconceptions[0].percent}%)`);
      break;
    }
  }
}

console.log(`\n=== VERIFICATION COMPLETE ===\n`);
