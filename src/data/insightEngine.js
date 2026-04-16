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
      drillTarget: { grade: worst.grade, standard: worst.code },
    });
  }

  // ── 2. Flagged teachers ────────────────────────────────────────────
  const flaggedTeachers = new Set();
  let firstFlagged = null;
  for (const grade of Object.keys(gradeStandardData)) {
    for (const [code, summary] of Object.entries(gradeStandardData[grade])) {
      for (const teacher of summary.teachers) {
        if (teacher.belowAverage) {
          flaggedTeachers.add(teacher.teacherName);
          if (!firstFlagged) {
            firstFlagged = { grade, standard: code };
          }
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
      drillTarget: firstFlagged ? { grade: firstFlagged.grade, standard: firstFlagged.standard } : null,
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
        drillTarget: null,
      });
    } else if (data.trend === 'improving') {
      insights.push({
        type: 'positive',
        title: `Grade ${grade} improving`,
        detail: `Up ${data.diff} points (${data.baseline}% → ${data.current}%)`,
        metric: data.diff,
        priority: 3,
        drillTarget: null,
      });
    }
  }

  // ── 4. Top misconception school-wide ───────────────────────────────
  const misconceptionTotals = {};
  const misconceptionStandards = {}; // { [type]: [ { grade, code, count } ] }
  let totalErrors = 0;

  for (const grade of Object.keys(gradeStandardData)) {
    for (const [code, summary] of Object.entries(gradeStandardData[grade])) {
      for (const m of summary.misconceptions) {
        misconceptionTotals[m.type] = (misconceptionTotals[m.type] || 0) + m.count;
        totalErrors += m.count;

        // Track which standards contribute to each misconception type
        if (!misconceptionStandards[m.type]) misconceptionStandards[m.type] = [];
        misconceptionStandards[m.type].push({ grade, code, count: m.count });
      }
    }
  }

  // For each misconception type, sort standards by count descending and keep top 3
  for (const type of Object.keys(misconceptionStandards)) {
    misconceptionStandards[type].sort((a, b) => b.count - a.count);
    misconceptionStandards[type] = misconceptionStandards[type].slice(0, 3);
  }

  if (totalErrors > 0) {
    const sorted = Object.entries(misconceptionTotals).sort((a, b) => b[1] - a[1]);
    const topType = sorted[0][0];
    const topCount = sorted[0][1];
    const topPercent = Math.round((topCount / totalErrors) * 100);

    // Shorten the type name for display
    const shortName = topType.split('(')[0].trim();

    const topStandards = misconceptionStandards[topType] || [];

    insights.push({
      type: 'info',
      title: `Top error: ${shortName}`,
      detail: `${topPercent}% of all errors school-wide (${topCount} occurrences)`,
      metric: topPercent,
      priority: 2,
      standards: topStandards.map(s => ({ grade: s.grade, code: s.code })),
      drillTarget: topStandards.length > 0
        ? { grade: topStandards[0].grade, standard: topStandards[0].code }
        : null,
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
      drillTarget: null,
    });
  }

  // ── 6. "Start Here" focus insight for struggling schools ──────────
  const decliningGradeCount = Object.values(trends).filter(t => t.trend === 'declining').length;
  if (redCells.length >= 5 || decliningGradeCount >= 2) {
    // Find the grade+domain combo with the most red cells
    const gradeDomainCounts = {};
    for (const cell of redCells) {
      const domain = cell.code.split('.')[1] || cell.code;
      const key = `${cell.grade}|${domain}`;
      if (!gradeDomainCounts[key]) {
        gradeDomainCounts[key] = { grade: cell.grade, domain, count: 0, worstCode: cell.code, worstPercent: 100 };
      }
      gradeDomainCounts[key].count += 1;
      if (cell.percent < gradeDomainCounts[key].worstPercent) {
        gradeDomainCounts[key].worstPercent = cell.percent;
        gradeDomainCounts[key].worstCode = cell.code;
      }
    }
    const sorted = Object.values(gradeDomainCounts).sort((a, b) => b.count - a.count);
    if (sorted.length > 0) {
      const focus = sorted[0];
      // Count total students affected across red cells in that grade+domain
      let affectedStudents = 0;
      for (const cell of redCells) {
        const domain = cell.code.split('.')[1] || cell.code;
        if (String(cell.grade) === String(focus.grade) && domain === focus.domain) {
          const cellData = gradeStandardData[cell.grade]?.[cell.code];
          if (cellData) affectedStudents += cellData.totalStudents;
        }
      }
      insights.push({
        type: 'focus',
        title: `Suggested Focus: Grade ${focus.grade} ${focus.domain}`,
        detail: `Highest concentration of needs across ${affectedStudents} students — ${focus.count} standard${focus.count > 1 ? 's' : ''} below 50%`,
        metric: focus.count,
        priority: -1, // Always first
        drillTarget: { grade: focus.grade, standard: focus.worstCode },
      });
    }
  }

  // Sort by priority (lower = more important)
  return insights.sort((a, b) => a.priority - b.priority);
}
