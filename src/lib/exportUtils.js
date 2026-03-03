/**
 * Export Utilities — CSV generation and print helpers.
 */

import { GRADE_STANDARDS, getStandardDescription } from '../data/dataUtils';

/**
 * Generate a CSV string for the heat map summary.
 * Columns: Grade, Standard, Description, Mastery %, Students, Celebrate Count, Flagged Teachers
 */
export function generateHeatMapCSV(gradeStandardData) {
  const headers = ['Grade', 'Standard', 'Description', 'Mastery %', 'Students', 'Celebrate Count', 'Flagged Teachers'];
  const rows = [headers.join(',')];

  for (const grade of [3, 4, 5]) {
    const standards = GRADE_STANDARDS[grade];
    for (const code of standards) {
      const cell = gradeStandardData[grade]?.[code];
      if (!cell) continue;

      const flagged = cell.teachers
        .filter(t => t.belowAverage)
        .map(t => t.teacherName)
        .join('; ');

      rows.push([
        grade,
        code,
        `"${getStandardDescription(code)}"`,
        cell.hasEnoughData ? cell.masteryPercent : 'n<10',
        cell.totalStudents,
        cell.celebrateCount,
        flagged ? `"${flagged}"` : '',
      ].join(','));
    }
  }

  return rows.join('\n');
}

/**
 * Generate a CSV string for a drill-down student list.
 * Columns: Student, Mastery, Misconception, Teacher, Section
 */
export function generateStudentCSV(drillData, drillState) {
  if (!drillData) return null;

  const headers = ['Teacher', 'Section', 'Student', 'Mastery', 'Misconception'];
  const rows = [headers.join(',')];

  for (const teacher of drillData.teachers) {
    for (const student of teacher.students) {
      rows.push([
        `"${teacher.teacherName}"`,
        `"${teacher.section}"`,
        `"${student.studentName}"`,
        student.currentMastery,
        student.misconception ? `"${student.misconception}"` : '',
      ].join(','));
    }
  }

  return rows.join('\n');
}

/**
 * Trigger a file download in the browser.
 */
export function downloadCSV(csvContent, filename) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Trigger the browser print dialog.
 */
export function printView() {
  window.print();
}
