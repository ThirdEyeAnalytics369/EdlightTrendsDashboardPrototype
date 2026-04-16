import { colors, fonts } from '../../theme';
import HeatMapCell from './HeatMapCell';
import TrendArrow from '../Flags/TrendArrow';

export default function GradeRow({
  grade,
  domainGroups,
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

      {/* Standard cells grouped by domain with spacers */}
      {domainGroups.map((group, groupIdx) => (
        <div key={group.domain} style={{ display: 'contents' }}>
          {/* Spacer between domain groups */}
          {groupIdx > 0 && (
            <div style={{ width: 16 }} />
          )}

          {/* Cells within this domain */}
          {group.standards.map(code => {
            const cellData = gradeData?.[code];
            if (!cellData) return null;

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
      ))}
    </div>
  );
}
