import { readFileSync } from 'fs';
const data = JSON.parse(readFileSync('src/data/data.json', 'utf-8'));

function aggregate(rows) {
  const result = {};
  for (const r of rows) {
    const grade = r['Grade'];
    const std = r['Standard'];
    if (!result[grade]) result[grade] = {};
    if (!result[grade][std]) result[grade][std] = { celebrate: 0, total: 0 };
    if (r['Mastery'] !== '4. N/A') {
      result[grade][std].total++;
      if (r['Mastery'] === '1. Celebrate') result[grade][std].celebrate++;
    }
  }
  for (const g in result) {
    for (const s in result[g]) {
      const d = result[g][s];
      result[g][s] = d.total >= 10 ? Math.round(d.celebrate / d.total * 100) : 'n<10';
    }
  }
  return result;
}

const cutoff3m = '2025-11-18';
const data3m = data.filter(r => r['Assignment Date'] >= cutoff3m);

const allAgg = aggregate(data);
const threeMAgg = aggregate(data3m);

console.log('=== Comparison: All vs 3M ===');
console.log(`All: ${data.length} rows | 3M: ${data3m.length} rows`);
for (const grade of [3, 4, 5]) {
  console.log(`\nGrade ${grade}:`);
  const stds = Object.keys(allAgg[grade] || {}).sort();
  for (const std of stds) {
    const allVal = allAgg[grade][std];
    const threeVal = (threeMAgg[grade] && threeMAgg[grade][std]) || 'no data';
    const diff = typeof allVal === 'number' && typeof threeVal === 'number' ? threeVal - allVal : '';
    const diffStr = diff ? ` (${diff > 0 ? '+' : ''}${diff})` : '';
    console.log(`  ${std}: All=${allVal}%  3M=${threeVal}%${diffStr}`);
  }
}
