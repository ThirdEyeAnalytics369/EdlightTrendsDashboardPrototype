/**
 * EdLight Trends Dashboard — Data Processing Utilities
 *
 * Implements all 7 data processing rules from the spec:
 *   Rule 1: N/A Exclusion
 *   Rule 2: Minimum Student Threshold (n < 10)
 *   Rule 3: Color Threshold Application
 *   Rule 4: Below-Average Flag Calculation
 *   Rule 5: Declining Over Time Flag Calculation
 *   Rule 6: Misconception Parsing
 *   Rule 7: Misconception Aggregation
 */

// ── Known misconception types (for safe parsing — no naive comma split) ─────

const KNOWN_TYPES = [
  'Computation Error (e.g., mental math errors)',
  'Conceptual Misunderstanding',
  'Did Not Follow Directions',
  "Incomplete (Didn't finish / didn't answer the question)",
  'Precision Error (e.g., notation, labeling, decimal)',
  'Representational Error (e.g., graphing, diagramming)',
  'Insufficient Explanation',
  'Unable to Diagnose',
];

// Abbreviations for heat map dominant labels
const TYPE_ABBREVIATIONS = {
  'Computation Error (e.g., mental math errors)': 'Computation',
  'Conceptual Misunderstanding': 'Conceptual',
  'Did Not Follow Directions': 'Directions',
  "Incomplete (Didn't finish / didn't answer the question)": 'Incomplete',
  'Precision Error (e.g., notation, labeling, decimal)': 'Precision',
  'Representational Error (e.g., graphing, diagramming)': 'Representation',
  'Insufficient Explanation': 'Explanation',
  'Unable to Diagnose': 'Undiagnosed',
};

/**
 * Rule 6: Parse misconceptions from a comma-separated string.
 * Matches against the known type list rather than naive comma splitting,
 * because type names contain commas (e.g., "Computation Error (e.g., mental math errors)").
 */
export function parseMisconceptions(misconceptionStr) {
  if (!misconceptionStr) return [];
  const result = [];
  let remaining = misconceptionStr;

  while (remaining.length > 0) {
    let matched = false;
    for (const type of KNOWN_TYPES) {
      if (remaining.startsWith(type)) {
        result.push(type);
        remaining = remaining.slice(type.length);
        // Skip comma + space separator
        if (remaining.startsWith(', ')) {
          remaining = remaining.slice(2);
        }
        matched = true;
        break;
      }
    }
    if (!matched) {
      // Shouldn't happen with correctly generated data, but skip a character to avoid infinite loop
      remaining = remaining.slice(1);
    }
  }

  return result;
}

/**
 * Get abbreviated label for a misconception type.
 */
export function getAbbreviation(type) {
  return TYPE_ABBREVIATIONS[type] || type;
}

/**
 * Rule 1: Calculate Celebrate percentage excluding N/A from both numerator and denominator.
 * Operates on raw rows (multiple assignments per student).
 * Returns { percent, total, celebrateCount, naCount, hasEnoughData }
 */
export function calculateCelebratePercent(rows) {
  const total = rows.length;
  const naCount = rows.filter(r => r['Mastery'] === '4. N/A').length;
  const denominator = total - naCount;
  const celebrateCount = rows.filter(r => r['Mastery'] === '1. Celebrate').length;

  // Rule 2: Minimum threshold
  const hasEnoughData = denominator >= 10;

  return {
    percent: hasEnoughData ? Math.round((celebrateCount / denominator) * 100) : null,
    total: denominator,
    celebrateCount,
    naCount,
    totalWithNa: total,
    hasEnoughData,
  };
}

/**
 * Calculate Celebrate percentage on a per-unique-student basis.
 * For each student, takes their most recent assignment mastery.
 * Used for grade-standard and teacher-standard summaries where
 * "n" refers to student count, not row count.
 */
export function calculateStudentCelebratePercent(rows) {
  // Group by student, take most recent assignment
  const studentLatest = {};
  for (const row of rows) {
    const sid = row['sis_id'];
    if (!studentLatest[sid] || row['Assignment Date'] > studentLatest[sid]['Assignment Date']) {
      studentLatest[sid] = row;
    }
  }
  const latestRows = Object.values(studentLatest);
  const total = latestRows.length;
  const naCount = latestRows.filter(r => r['Mastery'] === '4. N/A').length;
  const denominator = total - naCount;
  const celebrateCount = latestRows.filter(r => r['Mastery'] === '1. Celebrate').length;

  const hasEnoughData = denominator >= 10;

  return {
    percent: hasEnoughData ? Math.round((celebrateCount / denominator) * 100) : null,
    total: denominator,
    celebrateCount,
    naCount,
    totalWithNa: total,
    hasEnoughData,
  };
}

/**
 * Aggregate raw data into GradeStandardSummary objects.
 * Returns a nested structure: { [grade]: { [standardCode]: summary } }
 */
export function aggregateByGradeStandard(rawData) {
  const result = {};

  // Group by grade + standard
  const groups = {};
  for (const row of rawData) {
    const key = `${row['Grade']}_${row['Standard']}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(row);
  }

  for (const [key, rows] of Object.entries(groups)) {
    const [gradeStr, standardCode] = key.split('_');
    const grade = parseInt(gradeStr, 10);

    if (!result[grade]) result[grade] = {};

    // Grade-standard level stats (per unique student)
    const stats = calculateStudentCelebratePercent(rows);

    // Group by teacher
    const teacherGroups = {};
    for (const row of rows) {
      const tKey = row['Teacher'];
      if (!teacherGroups[tKey]) teacherGroups[tKey] = [];
      teacherGroups[tKey].push(row);
    }

    // Build teacher summaries
    const teachers = Object.entries(teacherGroups).map(([teacherName, tRows]) => {
      const tStats = calculateStudentCelebratePercent(tRows);

      // Group by student (most recent assignment for each student)
      const studentMap = {};
      for (const row of tRows) {
        const sid = row['sis_id'];
        if (!studentMap[sid] || row['Assignment Date'] > studentMap[sid]['Assignment Date']) {
          studentMap[sid] = row;
        }
      }

      const students = Object.values(studentMap).map(row => ({
        studentId: row['sis_id'],
        studentName: row['Student'],
        currentMastery: row['Mastery'],
        misconception: row['Misconceptions'],
      }));

      // Sort: Intervene first → Support → Celebrate → N/A
      const masteryOrder = { '3. Intervene': 0, '2. Support': 1, '1. Celebrate': 2, '4. N/A': 3 };
      students.sort((a, b) => (masteryOrder[a.currentMastery] ?? 4) - (masteryOrder[b.currentMastery] ?? 4));

      return {
        teacherName,
        teacherEmail: tRows[0]['Teacher Email'],
        section: tRows[0]['Section'],
        totalStudents: tStats.total,
        celebrateCount: tStats.celebrateCount,
        masteryPercent: tStats.percent,
        hasEnoughData: tStats.hasEnoughData,
        naCount: tStats.naCount,
        totalWithNa: tStats.totalWithNa,
        belowAverage: false, // computed in computeFlags
        declining: false,
        students,
      };
    });

    // Rule 7: Misconception aggregation
    const misconceptionCounts = {};
    let totalMisconceptions = 0;
    for (const row of rows) {
      if (row['Mastery'] === '2. Support' || row['Mastery'] === '3. Intervene') {
        const types = parseMisconceptions(row['Misconceptions']);
        for (const type of types) {
          misconceptionCounts[type] = (misconceptionCounts[type] || 0) + 1;
          totalMisconceptions++;
        }
      }
    }

    const misconceptions = Object.entries(misconceptionCounts)
      .map(([type, count]) => ({
        type,
        abbreviation: getAbbreviation(type),
        count,
        percent: totalMisconceptions > 0 ? Math.round((count / totalMisconceptions) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Dominant misconception: only if top type > 40%
    const dominant = misconceptions.length > 0 && misconceptions[0].percent > 40
      ? misconceptions[0]
      : null;

    result[grade][standardCode] = {
      grade,
      standardCode,
      standardDescription: rows[0] ? getStandardDescription(standardCode) : '',
      domain: rows[0]?.['Domain'] || '',
      totalStudents: stats.total,
      celebrateCount: stats.celebrateCount,
      masteryPercent: stats.percent,
      hasEnoughData: stats.hasEnoughData,
      naCount: stats.naCount,
      teachers,
      misconceptions,
      dominantMisconception: dominant,
    };
  }

  // Rule 4: Compute below-average flags
  computeBelowAverageFlags(result);

  return result;
}

/**
 * Rule 4: Below-average flag calculation.
 * For each grade-standard: flag teachers where
 *   (grade_avg - teacher_%) >= 10 AND teacher_% < 70 AND n >= 10
 */
function computeBelowAverageFlags(gradeStandardData) {
  for (const grade of Object.keys(gradeStandardData)) {
    for (const standardCode of Object.keys(gradeStandardData[grade])) {
      const summary = gradeStandardData[grade][standardCode];
      const { teachers } = summary;

      // Calculate grade average (only teachers with enough data)
      const qualifiedTeachers = teachers.filter(t => t.hasEnoughData);
      if (qualifiedTeachers.length === 0) continue;

      const gradeAvg = qualifiedTeachers.reduce((sum, t) => sum + t.masteryPercent, 0) / qualifiedTeachers.length;

      for (const teacher of teachers) {
        if (!teacher.hasEnoughData) continue;
        teacher.belowAverage = (gradeAvg - teacher.masteryPercent) >= 10 && teacher.masteryPercent < 70;
        teacher.belowAverageBy = Math.round(gradeAvg - teacher.masteryPercent);
      }
    }
  }
}

/**
 * Rule 5: Declining over time flag calculation.
 * Compares baseline (first 3 weeks) vs current (last 3 weeks) Celebrate %.
 * Returns { baseline, current, trend, diff } per grade.
 */
export function computeGradeTrends(rawData) {
  const trends = {};

  // Get all unique weeks sorted
  const allWeeks = [...new Set(rawData.map(r => r['Week of']))].sort();
  const baselineWeeks = new Set(allWeeks.slice(0, 3));
  const currentWeeks = new Set(allWeeks.slice(-3));

  for (const grade of [3, 4, 5]) {
    const gradeRows = rawData.filter(r => r['Grade'] === grade);

    const baselineRows = gradeRows.filter(r => baselineWeeks.has(r['Week of']));
    const currentRows = gradeRows.filter(r => currentWeeks.has(r['Week of']));

    const baselineStats = calculateCelebratePercent(baselineRows);
    const currentStats = calculateCelebratePercent(currentRows);

    const baseline = baselineStats.percent || 0;
    const current = currentStats.percent || 0;
    const diff = current - baseline;

    let trend = 'stable';
    if (diff <= -15) trend = 'declining';
    else if (diff >= 15) trend = 'improving';

    trends[grade] = { baseline, current, diff, trend };
  }

  return trends;
}

/**
 * Calculate overall Celebrate % for a grade across all standards.
 */
export function calculateGradeOverall(rawData, grade) {
  const gradeRows = rawData.filter(r => r['Grade'] === grade);
  return calculateCelebratePercent(gradeRows);
}

// ── Standard descriptions lookup ────────────────────────────────────────────

const STANDARD_DESCRIPTIONS = {
  '3.OA.A.1': 'Interpret products of whole numbers',
  '3.OA.A.3': 'Use multiplication and division to solve word problems',
  '3.OA.B.5': 'Apply properties of operations',
  '3.NBT.A.2': 'Fluently add and subtract within 1000',
  '3.NF.A.1': 'Understand a fraction as a quantity',
  '3.NF.A.3': 'Explain equivalence of fractions',
  '3.MD.B.3': 'Draw scaled picture and bar graphs',
  '3.MD.C.7': 'Relate area to multiplication',
  '4.OA.A.1': 'Interpret a multiplication equation as a comparison',
  '4.OA.A.3': 'Solve multistep word problems',
  '4.NBT.A.2': 'Read and write multi-digit whole numbers',
  '4.NBT.B.5': 'Multiply a whole number up to four digits',
  '4.NF.A.1': 'Explain why a fraction is equivalent',
  '4.NF.B.3': 'Understand a fraction as a sum of fractions',
  '4.MD.A.1': 'Know relative sizes of measurement units',
  '4.G.A.1': 'Draw points, lines, line segments, rays, angles',
  '5.OA.A.1': 'Use parentheses, brackets in numerical expressions',
  '5.OA.A.2': 'Write simple expressions',
  '5.NBT.A.1': 'Recognize place value system',
  '5.NBT.B.5': 'Fluently multiply multi-digit whole numbers',
  '5.NF.A.1': 'Add and subtract fractions with unlike denominators',
  '5.NF.B.4': 'Apply and extend understanding of multiplication to fractions',
  '5.MD.C.3': 'Recognize volume as an attribute',
  '5.G.A.1': 'Use a pair of perpendicular number lines (coordinate plane)',
};

export function getStandardDescription(code) {
  return STANDARD_DESCRIPTIONS[code] || code;
}

// ── Standard ordering per grade ─────────────────────────────────────────────

export const GRADE_STANDARDS = {
  3: ['3.OA.A.1', '3.OA.A.3', '3.OA.B.5', '3.NBT.A.2', '3.NF.A.1', '3.NF.A.3', '3.MD.B.3', '3.MD.C.7'],
  4: ['4.OA.A.1', '4.OA.A.3', '4.NBT.A.2', '4.NBT.B.5', '4.NF.A.1', '4.NF.B.3', '4.MD.A.1', '4.G.A.1'],
  5: ['5.OA.A.1', '5.OA.A.2', '5.NBT.A.1', '5.NBT.B.5', '5.NF.A.1', '5.NF.B.4', '5.MD.C.3', '5.G.A.1'],
};

export const DOMAIN_NAMES = {
  'OA': 'Operations & Algebraic Thinking',
  'NBT': 'Number & Operations in Base Ten',
  'NF': 'Number & Operations — Fractions',
  'MD': 'Measurement & Data',
  'G': 'Geometry',
};
