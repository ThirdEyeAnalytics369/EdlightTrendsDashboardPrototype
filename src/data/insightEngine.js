/**
 * Insight Engine — Scans aggregated data and returns actionable insights.
 *
 * Insight types:
 *   critical (red)   — Standards needing immediate attention
 *   warning (yellow) — Flagged teachers, declining trends
 *   positive (green) — Improving trends, high-performing areas
 *   info (purple)    — Top misconception patterns, data summary
 */

/**
 * Generate insights from aggregated grade-standard data and trends.
 * @param {Object} gradeStandardData — { [grade]: { [standard]: summary } }
 * @param {Object} trends — { [grade]: { baseline, current, diff, trend } }
 * @returns {Array} Sorted insights (critical first)
 */
export function generateInsights(gradeStandardData, trends) {
  const insights = [];

  // ── 1. Red cell count ──────────────────────────────────────────────
  const redCells = [];
  const yellowCells = [];
  const greenCells = [];

  for (const grade of Object.keys(gradeStandardData)) {
    for (const [code, summary] of Object.entries(gradeStandardData[grade])) {
      if (!summary.hasEnoughData) continue;
      if (summary.masteryPercent < 50) {
        redCells.push({ grade, code, percent: summary.masteryPercent });
      } else if (summary.masteryPercent < 75) {
        yellowCells.push({ grade, code, percent: summary.masteryPercent });
      } else {
        greenCells.push({ grade, code, percent: summary.masteryPercent });
      }
    }
  }

  if (redCells.length > 0) {
    const worst = redCells.sort((a, b) => a.percent - b.percent)[0];
    insights.push({
      type: 'critical',
      title: `${redCells.length} standard${redCells.length > 1 ? 's' : ''} need${redCells.length === 1 ? 's' : ''} attention`,
      detail: `Lowest: Grade ${worst.grade} ${worst.code} at ${worst.percent}%`,
      metric: redCells.length,
      priority: 0,
    });
  }

  // ── 2. Flagged teachers ────────────────────────────────────────────
  const flaggedTeachers = new Set();
  for (const grade of Object.keys(gradeStandardData)) {
    for (const summary of Object.values(gradeStandardData[grade])) {
      for (const teacher of summary.teachers) {
        if (teacher.belowAverage) {
          flaggedTeachers.add(teacher.teacherName);
        }
      }
    }
  }

  if (flaggedTeachers.size > 0) {
    const names = [...flaggedTeachers].slice(0, 3);
    const extra = flaggedTeachers.size > 3 ? ` +${flaggedTeachers.size - 3} more` : '';
    insights.push({
      type: 'warning',
      title: `${flaggedTeachers.size} teacher${flaggedTeachers.size > 1 ? 's' : ''} below average`,
      detail: names.join(', ') + extra,
      metric: flaggedTeachers.size,
      priority: 1,
    });
  }

  // ── 3. Grade trends ────────────────────────────────────────────────
  for (const [grade, data] of Object.entries(trends)) {
    if (data.trend === 'declining') {
      insights.push({
        type: 'critical',
        title: `Grade ${grade} declining`,
        detail: `Down ${Math.abs(data.diff)} points (${data.baseline}% → ${data.current}%)`,
        metric: data.diff,
        priority: 0,
      });
    } else if (data.trend === 'improving') {
      insights.push({
        type: 'positive',
        title: `Grade ${grade} improving`,
        detail: `Up ${data.diff} points (${data.baseline}% → ${data.current}%)`,
        metric: data.diff,
        priority: 3,
      });
    }
  }

  // ── 4. Top misconception school-wide ───────────────────────────────
  const misconceptionTotals = {};
  let totalErrors = 0;

  for (const grade of Object.keys(gradeStandardData)) {
    for (const summary of Object.values(gradeStandardData[grade])) {
      for (const m of summary.misconceptions) {
        misconceptionTotals[m.type] = (misconceptionTotals[m.type] || 0) + m.count;
        totalErrors += m.count;
      }
    }
  }

  if (totalErrors > 0) {
    const sorted = Object.entries(misconceptionTotals).sort((a, b) => b[1] - a[1]);
    const topType = sorted[0][0];
    const topCount = sorted[0][1];
    const topPercent = Math.round((topCount / totalErrors) * 100);

    // Shorten the type name for display
    const shortName = topType.split('(')[0].trim();

    insights.push({
      type: 'info',
      title: `Top error: ${shortName}`,
      detail: `${topPercent}% of all errors school-wide (${topCount} occurrences)`,
      metric: topPercent,
      priority: 2,
    });
  }

  // ── 5. Green cells celebration ─────────────────────────────────────
  if (greenCells.length > 0) {
    insights.push({
      type: 'positive',
      title: `${greenCells.length} standard${greenCells.length > 1 ? 's' : ''} on track`,
      detail: `${greenCells.length} of ${greenCells.length + yellowCells.length + redCells.length} standards at 75%+ mastery`,
      metric: greenCells.length,
      priority: 4,
    });
  }

  // Sort by priority (lower = more important)
  return insights.sort((a, b) => a.priority - b.priority);
}
