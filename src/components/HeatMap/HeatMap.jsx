import { useMemo } from 'react';
import { colors, fonts, sizing } from '../../theme';
import {
  aggregateByGradeStandard,
  computeGradeTrends,
  computeStandardTrends,
  calculateGradeOverall,
  GRADE_STANDARDS,
  DOMAIN_NAMES,
} from '../../data/dataUtils';
import HeatMapCell from './HeatMapCell';
import TrendArrow from '../Flags/TrendArrow';
import Tooltip from '../common/Tooltip';

// Alternating subtle background tints for domain groups
const DOMAIN_BG_COLORS = [
  'rgba(116, 119, 184, 0.04)',  // purple tint
  'rgba(240, 91, 148, 0.04)',   // pink tint
  'rgba(116, 119, 184, 0.08)',  // slightly deeper purple
  'rgba(240, 91, 148, 0.08)',   // slightly deeper pink
  'rgba(116, 119, 184, 0.04)',  // repeat
];

/**
 * Group standards by domain and return an array of { domain, standards[] }.
 */
function groupByDomain(standards) {
  const groups = [];
  let currentDomain = null;
  let currentGroup = null;

  for (const code of standards) {
    const domain = code.split('.')[1];
    if (domain !== currentDomain) {
      currentDomain = domain;
      currentGroup = { domain, standards: [] };
      groups.push(currentGroup);
    }
    currentGroup.standards.push(code);
  }
  return groups;
}

export default function HeatMap({ data, activeCell, onCellClick, priorYearLookup, showPriorYear }) {
  const gradeStandardData = useMemo(() => aggregateByGradeStandard(data), [data]);
  const gradeTrends = useMemo(() => computeGradeTrends(data), [data]);
  const standardTrends = useMemo(() => computeStandardTrends(data), [data]);
  const gradeOveralls = useMemo(() => ({
    3: calculateGradeOverall(data, 3),
    4: calculateGradeOverall(data, 4),
    5: calculateGradeOverall(data, 5),
  }), [data]);

  const activeStandards = useMemo(() => {
    const result = {};
    for (const grade of [3, 4, 5]) {
      result[grade] = GRADE_STANDARDS[grade].filter(
        code => gradeStandardData[grade]?.[code]
      );
    }
    return result;
  }, [gradeStandardData]);

  const domainGroupsByGrade = useMemo(() => {
    const result = {};
    for (const grade of [3, 4, 5]) {
      result[grade] = groupByDomain(activeStandards[grade]);
    }
    return result;
  }, [activeStandards]);

  return (
    <div style={{
      backgroundColor: colors.white,
      borderRadius: sizing.cardBorderRadius,
      boxShadow: colors.cardShadow,
      padding: sizing.cardPadding,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
      }}>
        <h2 style={{
          fontFamily: fonts.heading,
          fontWeight: 700,
          fontSize: 14,
          color: colors.navy,
          margin: 0,
        }}>
          School Trends
        </h2>

        {/* Inline legend: colors + arrows */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {[
            { color: colors.green, label: '75%+' },
            { color: colors.yellow, label: '50–74%' },
            { color: colors.red, label: '< 50%' },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                backgroundColor: color,
              }} />
              <span style={{
                fontFamily: fonts.body,
                fontSize: 11,
                color: colors.gray,
              }}>
                {label}
              </span>
            </div>
          ))}

          <div style={{ width: 1, height: 14, backgroundColor: colors.border, margin: '0 2px' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 14, color: colors.green, fontWeight: 700 }}>↑</span>
            <span style={{ fontFamily: fonts.body, fontSize: 11, color: colors.gray }}>Improving over time selected</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 14, color: colors.red, fontWeight: 700 }}>↓</span>
            <span style={{ fontFamily: fonts.body, fontSize: 11, color: colors.gray }}>Declining over time selected</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 12, filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.3))' }}>⚠</span>
            <span style={{ fontFamily: fonts.body, fontSize: 11, color: colors.gray }}>Below Avg</span>
          </div>
        </div>
      </div>

      {/* Heat map rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {[3, 4, 5].map((grade, gradeIdx) => {
          const domainGroups = domainGroupsByGrade[grade];
          if (!domainGroups || domainGroups.length === 0) return null;

          return (
            <div key={grade} style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
              {/* Grade label */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                minWidth: 80,
                paddingBottom: 8,
                paddingRight: 8,
              }}>
                <div style={{
                  fontFamily: fonts.heading,
                  fontWeight: 700,
                  fontSize: 14,
                  color: colors.navy,
                }}>
                  Grade {grade}
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontFamily: fonts.heading,
                  fontWeight: 700,
                  fontSize: 13,
                  color: colors.navy,
                  marginTop: 2,
                }}>
                  {gradeOveralls[grade].hasEnoughData ? `${gradeOveralls[grade].percent}%` : '—'}
                  {gradeTrends[grade] && gradeTrends[grade].trend !== 'stable' && (
                    <TrendArrow
                      trend={gradeTrends[grade].trend}
                      baseline={gradeTrends[grade].baseline}
                      current={gradeTrends[grade].current}
                      diff={gradeTrends[grade].diff}
                      grade={grade}
                    />
                  )}
                </div>
              </div>

              {/* Domain groups */}
              <div style={{ display: 'flex', gap: 10, flex: 1 }}>
                {domainGroups.map((group, groupIdx) => (
                  <div
                    key={group.domain}
                    style={{
                      backgroundColor: DOMAIN_BG_COLORS[groupIdx % DOMAIN_BG_COLORS.length],
                      borderRadius: 6,
                      padding: '6px 6px 8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                    }}
                  >
                    {/* Domain label - only show on first grade row */}
                    {gradeIdx === 0 && (
                      <Tooltip text={DOMAIN_NAMES[group.domain] || group.domain}>
                        <div style={{
                          fontFamily: fonts.body,
                          fontSize: 10,
                          fontWeight: 600,
                          color: colors.purple,
                          letterSpacing: '0.5px',
                          textTransform: 'uppercase',
                          textAlign: 'center',
                          marginBottom: 2,
                          cursor: 'default',
                        }}>
                          {group.domain}
                        </div>
                      </Tooltip>
                    )}

                    {/* Standard codes */}
                    <div style={{ display: 'flex', gap: 4 }}>
                      {group.standards.map(code => (
                        <div key={code} style={{
                          textAlign: 'center',
                          fontFamily: fonts.body,
                          fontSize: 10,
                          color: colors.gray,
                          minWidth: 72,
                        }}>
                          {code}
                        </div>
                      ))}
                    </div>

                    {/* Cells */}
                    <div style={{ display: 'flex', gap: 4 }}>
                      {group.standards.map(code => {
                        const cellData = gradeStandardData[grade]?.[code];
                        if (!cellData) return <div key={code} style={{ minWidth: 72 }} />;

                        const hasFlag = cellData.teachers.some(t => t.belowAverage);
                        const isActive = activeCell?.grade === grade && activeCell?.standard === code;

                        return (
                          <HeatMapCell
                            key={code}
                            masteryPercent={cellData.masteryPercent}
                            hasEnoughData={cellData.hasEnoughData}
                            totalStudents={cellData.totalStudents}
                            celebrateCount={cellData.celebrateCount}
                            naCount={cellData.naCount}
                            dominantMisconception={cellData.dominantMisconception}
                            hasFlag={hasFlag}
                            isActive={isActive}
                            onClick={() => onCellClick(grade, code)}
                            trend={standardTrends[grade]?.[code]?.trend}
                            priorYearPercent={priorYearLookup?.[grade]?.[code]}
                            showPriorYear={showPriorYear}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
