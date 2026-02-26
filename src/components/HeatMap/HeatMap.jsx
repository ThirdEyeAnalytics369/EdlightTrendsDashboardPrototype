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

  const maxStandards = Math.max(...Object.values(GRADE_STANDARDS).map(s => s.length));

  return (
    <div style={{
      backgroundColor: colors.white,
      borderRadius: sizing.cardBorderRadius,
      boxShadow: colors.cardShadow,
      padding: sizing.cardPadding,
    }}>
      <h2 style={{
        fontFamily: fonts.heading,
        fontWeight: 700,
        fontSize: 16,
        color: colors.navy,
        marginBottom: 16,
      }}>
        School Trends
      </h2>

      {/* Scrollable container for the grid */}
      <div style={{ overflowX: 'auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `90px 56px repeat(${maxStandards}, minmax(72px, 1fr))`,
          gap: sizing.cellGap,
          alignItems: 'center',
          minWidth: 90 + 56 + maxStandards * 76,
        }}>
          {[3, 4, 5].map(grade => {
            const standards = GRADE_STANDARDS[grade];
            return (
              <div key={grade} style={{ display: 'contents' }}>
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
            );
          })}
        </div>
      </div>
    </div>
  );
}
