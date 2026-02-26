import { colors, fonts } from '../../theme';
import HeatMapCell from './HeatMapCell';
import TrendArrow from '../Flags/TrendArrow';

export default function GradeRow({
  grade,
  standards,
  gradeData,
  gradeOverall,
  gradeTrend,
  activeCell,
  onCellClick,
}) {
  return (
    <div style={{ display: 'contents' }}>
      {/* Grade label */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        fontFamily: fonts.heading,
        fontWeight: 700,
        fontSize: 14,
        color: colors.navy,
        minWidth: 90,
        padding: '0 4px',
      }}>
        Grade {grade}
      </div>

      {/* Grade overall Celebrate % + trend */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        minWidth: 56,
        fontFamily: fonts.heading,
        fontWeight: 700,
        fontSize: 14,
        color: colors.navy,
      }}>
        {gradeOverall.hasEnoughData ? `${gradeOverall.percent}%` : '—'}
        {gradeTrend && gradeTrend.trend !== 'stable' && (
          <TrendArrow
            trend={gradeTrend.trend}
            baseline={gradeTrend.baseline}
            current={gradeTrend.current}
            diff={gradeTrend.diff}
            grade={grade}
          />
        )}
      </div>

      {/* Standard cells */}
      {standards.map(code => {
        const cellData = gradeData?.[code];
        if (!cellData) {
          // Standard not yet taught
          return (
            <div
              key={code}
              style={{
                minWidth: 72,
                height: 58,
                backgroundColor: '#F0F0F0',
                borderRadius: 4,
                border: `1px solid ${colors.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: fonts.body,
                fontSize: 14,
                color: '#BDBDBD',
              }}
            >
              —
            </div>
          );
        }

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
          />
        );
      })}
    </div>
  );
}
