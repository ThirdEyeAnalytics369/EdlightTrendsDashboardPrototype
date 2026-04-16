import { useState, useEffect, useMemo } from 'react';
import Header from '../components/Layout/Header';
import MainContent from '../components/Layout/MainContent';
import SchoolCard from '../components/District/SchoolCard';
import { useFilter } from '../context/FilterContext';
import { fonts, colors, sizing } from '../theme';
import districtSummary from '../data/districtSummary.json';
import {
  filterByTimeRange,
  calculateCelebratePercent,
  computeGradeTrends,
  aggregateByGradeStandard,
  DOMAIN_NAMES,
} from '../data/dataUtils';

// ── Lazy-load school data files (same pattern as SchoolView) ───────────────
const SCHOOL_DATA_MAP = {
  'westfield-elementary': () => import('../data/data_westfield.json'),
  'lincoln-heights': () => import('../data/data_lincoln.json'),
  'riverside-academy': () => import('../data/data_riverside.json'),
  'oak-park': () => import('../data/data_oakpark.json'),
};

// ── Helpers ────────────────────────────────────────────────────────────────

/** Derive a domain label from a standard code (e.g., "3.NF.A.1" -> "Number & Operations -- Fractions") */
function domainFromStandard(standardCode) {
  if (!standardCode) return '';
  const parts = standardCode.split('.');
  if (parts.length < 2) return '';
  const domainKey = parts[1]; // "NF", "OA", etc.
  return DOMAIN_NAMES[domainKey] || domainKey;
}

/** Compute a school trend label from grade trends */
function deriveTrend(gradeTrends) {
  const trends = Object.values(gradeTrends);
  if (trends.length === 0) return 'stable';
  const declining = trends.filter(t => t.trend === 'declining').length;
  const improving = trends.filter(t => t.trend === 'improving').length;
  if (declining >= 2) return 'declining';
  if (improving >= 2 && declining === 0) return 'strong';
  if (improving > 0 && declining > 0) return 'mixed';
  if (improving >= 1) return 'improving';
  return 'stable';
}

/**
 * Generate a topConcern string from the filtered data for a single school.
 * Strategy: find the grade with the worst celebrate %, then check for a flagged teacher.
 */
function generateTopConcern(filteredRows, gradeStandardData, gradeTrends) {
  if (!filteredRows || filteredRows.length === 0) return 'No data for selected time range';

  // Check for flagged teachers first (most actionable concern)
  let worstFlagged = null;
  let worstFlaggedDelta = 0;
  for (const grade of Object.keys(gradeStandardData)) {
    for (const standardCode of Object.keys(gradeStandardData[grade])) {
      const cell = gradeStandardData[grade][standardCode];
      for (const teacher of cell.teachers) {
        if (teacher.belowAverage && teacher.belowAverageBy > worstFlaggedDelta) {
          worstFlaggedDelta = teacher.belowAverageBy;
          worstFlagged = {
            grade,
            standardCode,
            domain: domainFromStandard(standardCode),
            teacherName: teacher.teacherName,
            section: teacher.section,
            delta: teacher.belowAverageBy,
          };
        }
      }
    }
  }

  if (worstFlagged) {
    return `Grade ${worstFlagged.grade} ${worstFlagged.domain} \u2014 ${worstFlagged.teacherName}'s class (${worstFlagged.section}) ${worstFlagged.delta}pts below avg`;
  }

  // Fallback: check for declining grade trends
  const decliningGrades = Object.entries(gradeTrends)
    .filter(([, t]) => t.trend === 'declining')
    .map(([g]) => g);
  if (decliningGrades.length > 0) {
    return 'Grade-level declining trends detected';
  }

  // Fallback: find the grade with the worst celebrate %
  let worstGrade = null;
  let worstPct = 100;
  for (const grade of [3, 4, 5]) {
    const gradeRows = filteredRows.filter(r => r['Grade'] === grade);
    if (gradeRows.length === 0) continue;
    const stats = calculateCelebratePercent(gradeRows);
    if (stats.percent !== null && stats.percent < worstPct) {
      worstPct = stats.percent;
      worstGrade = grade;
    }
  }
  if (worstGrade !== null && worstPct < 50) {
    return `Grade ${worstGrade} has the lowest celebrate rate (${worstPct}%)`;
  }

  return 'No major concerns detected';
}

/**
 * Compute all summary metrics for a single school from its filtered data.
 */
function computeSchoolSummary(slug, name, filteredRows) {
  if (!filteredRows || filteredRows.length === 0) {
    return {
      name,
      slug,
      overallCelebratePercent: 0,
      totalStudents: 0,
      totalTeachers: 0,
      redCellCount: 0,
      decliningGrades: 0,
      flaggedTeachers: 0,
      trend: 'stable',
      topConcern: 'No data for selected time range',
    };
  }

  // Overall celebrate %
  const overallStats = calculateCelebratePercent(filteredRows);
  const overallCelebratePercent = overallStats.percent ?? 0;

  // Unique students & teachers
  const totalStudents = new Set(filteredRows.map(r => r['sis_id'])).size;
  const totalTeachers = new Set(filteredRows.map(r => r['Teacher'])).size;

  // Aggregate by grade-standard for red cells and flagged teachers
  const gradeStandardData = aggregateByGradeStandard(filteredRows);

  // Red cell count: cells where celebrate % < 50
  let redCellCount = 0;
  let flaggedTeachers = 0;
  const flaggedTeacherNames = new Set();
  for (const grade of Object.keys(gradeStandardData)) {
    for (const standardCode of Object.keys(gradeStandardData[grade])) {
      const cell = gradeStandardData[grade][standardCode];
      if (cell.hasEnoughData && cell.masteryPercent !== null && cell.masteryPercent < 50) {
        redCellCount++;
      }
      // Count unique flagged teachers across all cells
      for (const teacher of cell.teachers) {
        if (teacher.belowAverage && !flaggedTeacherNames.has(teacher.teacherName)) {
          flaggedTeacherNames.add(teacher.teacherName);
          flaggedTeachers++;
        }
      }
    }
  }

  // Grade trends for declining count and overall trend
  const gradeTrends = computeGradeTrends(filteredRows);
  const decliningGrades = Object.values(gradeTrends).filter(t => t.trend === 'declining').length;
  const trend = deriveTrend(gradeTrends);

  // Top concern
  const topConcern = generateTopConcern(filteredRows, gradeStandardData, gradeTrends);

  return {
    name,
    slug,
    overallCelebratePercent,
    totalStudents,
    totalTeachers,
    redCellCount,
    decliningGrades,
    flaggedTeachers,
    trend,
    topConcern,
  };
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function DistrictView() {
  const { timeRange, setTimeRange } = useFilter();

  // Raw data keyed by slug — loaded in background
  const [schoolData, setSchoolData] = useState({});
  const [dataLoaded, setDataLoaded] = useState(false);

  // Lazy-load all school data files in parallel on mount
  useEffect(() => {
    let cancelled = false;

    const slugs = Object.keys(SCHOOL_DATA_MAP);
    const promises = slugs.map(slug =>
      SCHOOL_DATA_MAP[slug]()
        .then(mod => ({ slug, data: mod.default }))
        .catch(() => ({ slug, data: [] }))
    );

    Promise.all(promises).then(results => {
      if (cancelled) return;
      const loaded = {};
      for (const { slug, data } of results) {
        loaded[slug] = data;
      }
      setSchoolData(loaded);
      setDataLoaded(true);
    });

    return () => { cancelled = true; };
  }, []);

  // Compute per-school summaries from loaded data + current timeRange
  const computedSchools = useMemo(() => {
    if (!dataLoaded) return null;

    return districtSummary.schools.map(staticSchool => {
      const rawRows = schoolData[staticSchool.slug];
      if (!rawRows || rawRows.length === 0) {
        return { ...staticSchool, overallCelebratePercent: 0, topConcern: 'No data available' };
      }
      const filteredRows = filterByTimeRange(rawRows, timeRange);
      return computeSchoolSummary(staticSchool.slug, staticSchool.name, filteredRows);
    });
  }, [dataLoaded, schoolData, timeRange]);

  // Use computed schools when available, otherwise fall back to static data
  const schools = computedSchools || districtSummary.schools;

  // Compute district-level summary stats
  const summaryStats = useMemo(() => {
    const avgCelebrate = schools.length > 0
      ? Math.round(schools.reduce((sum, s) => sum + s.overallCelebratePercent, 0) / schools.length)
      : 0;
    const totalFlagged = schools.reduce((sum, s) => sum + s.flaggedTeachers, 0);
    const totalDeclining = schools.reduce((sum, s) => sum + s.decliningGrades, 0);
    const totalStudents = schools.reduce((sum, s) => sum + s.totalStudents, 0);
    const schoolsBelow50 = schools.filter(s => s.overallCelebratePercent < 50).length;
    return { avgCelebrate, totalFlagged, totalDeclining, totalStudents, schoolsBelow50 };
  }, [schools]);

  return (
    <>
      <Header
        schoolName={districtSummary.districtName}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
      />

      <MainContent>
        {/* District header */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{
            fontFamily: fonts.heading,
            fontWeight: 700,
            fontSize: 18,
            color: colors.navy,
            margin: '0 0 4px 0',
          }}>
            School Performance Overview
          </h2>
          <p style={{
            fontFamily: fonts.body,
            fontSize: 13,
            color: colors.gray,
            margin: 0,
          }}>
            {schools.length} schools &middot; Click a school to view detailed trends
            {!dataLoaded && (
              <span style={{
                marginLeft: 10,
                fontSize: 12,
                color: colors.purple,
              }}>
                Loading live data...
              </span>
            )}
          </p>
        </div>

        {/* District Metrics -- above school cards */}
        <div style={{
          backgroundColor: colors.white,
          borderRadius: sizing.cardBorderRadius,
          boxShadow: colors.cardShadow,
          padding: sizing.cardPadding,
          marginBottom: 20,
          position: 'relative',
          transition: 'opacity 300ms ease',
          opacity: dataLoaded ? 1 : 0.75,
        }}>
          {!dataLoaded && <LoadingOverlay />}
          <div style={{
            display: 'flex',
            gap: 16,
          }}>
            <SummaryStatBox
              label="Total Students"
              value={summaryStats.totalStudents.toLocaleString()}
            />
            <SummaryStatBox
              label="District Celebrate %"
              value={`${summaryStats.avgCelebrate}%`}
              valueColor={summaryStats.avgCelebrate >= 75 ? colors.green : summaryStats.avgCelebrate >= 50 ? colors.yellow : colors.red}
            />
            <SummaryStatBox
              label="Schools Below 50%"
              value={summaryStats.schoolsBelow50}
              valueColor={summaryStats.schoolsBelow50 > 0 ? colors.red : colors.green}
            />
            <SummaryStatBox
              label="Flagged Teachers"
              value={summaryStats.totalFlagged}
              valueColor={summaryStats.totalFlagged > 0 ? colors.red : colors.navy}
            />
            <SummaryStatBox
              label="Declining Grades"
              value={summaryStats.totalDeclining}
              valueColor={summaryStats.totalDeclining > 0 ? colors.red : colors.navy}
            />
          </div>
        </div>

        {/* 2x2 school card grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 20,
          transition: 'opacity 300ms ease',
          opacity: dataLoaded ? 1 : 0.75,
        }}>
          {schools.map(school => (
            <SchoolCard key={school.slug} school={school} />
          ))}
        </div>

        {/* School Comparison Bar Chart */}
        <div style={{
          backgroundColor: colors.white,
          borderRadius: sizing.cardBorderRadius,
          boxShadow: colors.cardShadow,
          padding: sizing.cardPadding,
          marginTop: 24,
          position: 'relative',
          transition: 'opacity 300ms ease',
          opacity: dataLoaded ? 1 : 0.75,
        }}>
          {!dataLoaded && <LoadingOverlay />}
          {/* School comparison bar chart */}
          <div style={{
            fontFamily: fonts.body,
            fontSize: 11,
            color: colors.gray,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: 12,
          }}>
            School Comparison — Celebrate %
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {schools.map(school => {
              const barColor = school.overallCelebratePercent >= 75
                ? colors.green
                : school.overallCelebratePercent >= 50
                  ? colors.yellow
                  : colors.red;
              return (
                <div key={school.slug} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{
                    fontFamily: fonts.body,
                    fontSize: 12,
                    color: colors.navy,
                    minWidth: 220,
                    fontWeight: 500,
                    textAlign: 'right',
                  }}>
                    {school.name}
                  </span>
                  <div style={{
                    flex: 1,
                    height: 20,
                    backgroundColor: '#EEEEEE',
                    borderRadius: 4,
                    overflow: 'hidden',
                    position: 'relative',
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${school.overallCelebratePercent}%`,
                      backgroundColor: barColor,
                      borderRadius: 4,
                      transition: 'width 500ms ease',
                      minWidth: 2,
                    }} />
                  </div>
                  <span style={{
                    fontFamily: fonts.heading,
                    fontSize: 13,
                    fontWeight: 700,
                    color: barColor,
                    minWidth: 40,
                  }}>
                    {school.overallCelebratePercent}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </MainContent>
    </>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function SummaryStatBox({ label, value, valueColor }) {
  return (
    <div style={{
      flex: '1 1 0',
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: '14px 16px',
      textAlign: 'center',
    }}>
      <div style={{
        fontFamily: fonts.heading,
        fontWeight: 700,
        fontSize: 24,
        color: valueColor,
        lineHeight: 1,
        marginBottom: 4,
      }}>
        {value}
      </div>
      <div style={{
        fontFamily: fonts.body,
        fontSize: 11,
        color: colors.gray,
      }}>
        {label}
      </div>
    </div>
  );
}

/** Subtle loading overlay shown while school data files are being fetched */
function LoadingOverlay() {
  return (
    <div style={{
      position: 'absolute',
      top: 8,
      right: 12,
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontFamily: fonts.body,
      fontSize: 11,
      color: colors.purple,
      zIndex: 1,
    }}>
      <div style={{
        width: 12,
        height: 12,
        border: `2px solid ${colors.border}`,
        borderTopColor: colors.purple,
        borderRadius: '50%',
        animation: 'districtSpin 0.8s linear infinite',
      }} />
      Loading...
      <style>{`@keyframes districtSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
