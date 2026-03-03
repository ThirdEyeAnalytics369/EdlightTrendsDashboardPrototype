import { useMemo } from 'react';
import { colors, fonts, sizing } from '../../theme';
import {
  aggregateByGradeStandard,
  computeGradeTrends,
  calculateGradeOverall,
  GRADE_STANDARDS,
} from '../../data/dataUtils';
import StandardHeader from './StandardHeader';
import GradeRow from './GradeRow';

export default function HeatMap({ data, activeCell, onCellClick }) {
  const gradeStandardData = useMemo(() => aggregateByGradeStandard(data), [data]);
  const gradeTrends = useMemo(() => computeGradeTrends(data), [data]);
  const gradeOveralls = useMemo(() => ({
    3: calculateGradeOverall(data, 3),
    4: calculateGradeOverall(data, 4),
    5: calculateGradeOverall(data, 5),
  }), [data]);

  // Compute active standards per grade (only those with data)
  const activeStandards = useMemo(() => {
    const result = {};
    for (const grade of [3, 4, 5]) {
      result[grade] = GRADE_STANDARDS[grade].filter(
        code => gradeStandardData[grade]?.[code]
      );
    }
    return result;
  }, [gradeStandardData]);

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
          fontSize: 16,
          color: colors.navy,
          margin: 0,
        }}>
          School Trends
        </h2>

        {/* Inline color legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
        </div>
      </div>

      {/* Each grade gets its own grid so column count adapts to available data */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {[3, 4, 5].map(grade => {
          const standards = activeStandards[grade];
          if (standards.length === 0) return null;

          return (
            <div key={grade} style={{ overflow: 'visible', padding: '4px 0' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: `90px 56px repeat(${standards.length}, minmax(72px, 1fr))`,
                gap: sizing.cellGap,
                alignItems: 'center',
                minWidth: 90 + 56 + standards.length * 76,
              }}>
                <StandardHeader standards={standards} />
                <GradeRow
                  grade={grade}
                  standards={standards}
                  gradeData={gradeStandardData[grade]}
                  gradeOverall={gradeOveralls[grade]}
                  gradeTrend={gradeTrends[grade]}
                  activeCell={activeCell}
                  onCellClick={onCellClick}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
