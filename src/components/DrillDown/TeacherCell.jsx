import { colors, fonts, getCellColor, getCellTextColor } from '../../theme';
import BelowAverageIcon from '../Flags/BelowAverageIcon';
import Tooltip from '../common/Tooltip';

export default function TeacherCell({ teacher, isActive, onClick }) {
  const {
    teacherName,
    section,
    masteryPercent,
    hasEnoughData,
    totalStudents,
    celebrateCount,
    belowAverage,
    belowAverageBy,
  } = teacher;

  const bgColor = hasEnoughData ? getCellColor(masteryPercent, true) : colors.grayCell;
  const textColor = hasEnoughData ? getCellTextColor(masteryPercent, true) : colors.textOnYellowGray;

  const tooltipText = hasEnoughData
    ? `${masteryPercent}% Celebrate (${celebrateCount} of ${totalStudents} students)`
    : `Insufficient data (fewer than 10 students)`;

  return (
    <Tooltip text={tooltipText}>
      <div
        onClick={hasEnoughData ? onClick : undefined}
        style={{
          backgroundColor: colors.white,
          border: isActive
            ? `2px solid ${colors.navy}`
            : `1px solid ${colors.border}`,
          borderRadius: 8,
          padding: 12,
          cursor: hasEnoughData ? 'pointer' : 'default',
          transition: 'box-shadow 150ms, border-color 150ms',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          minWidth: 140,
        }}
        onMouseEnter={e => { if (hasEnoughData) e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
      >
        {/* Teacher name + flag */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{
              fontFamily: fonts.heading,
              fontWeight: 700,
              fontSize: 13,
              color: colors.navy,
            }}>
              {teacherName}
            </div>
            <div style={{
              fontFamily: fonts.body,
              fontSize: 11,
              color: colors.gray,
            }}>
              Section {section}
            </div>
          </div>
          {belowAverage && <BelowAverageIcon belowAverageBy={belowAverageBy} />}
        </div>

        {/* Mastery bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <div style={{
            flex: 1,
            height: 8,
            backgroundColor: colors.grayCell,
            borderRadius: 4,
            overflow: 'hidden',
          }}>
            {hasEnoughData && (
              <div style={{
                width: `${masteryPercent}%`,
                height: '100%',
                backgroundColor: bgColor,
                borderRadius: 4,
                transition: 'width 200ms ease',
              }} />
            )}
          </div>
          <span style={{
            fontFamily: fonts.heading,
            fontWeight: 700,
            fontSize: 14,
            color: hasEnoughData ? colors.navy : colors.gray,
            minWidth: 42,
            textAlign: 'right',
          }}>
            {hasEnoughData ? `${masteryPercent}%` : 'n < 10'}
          </span>
        </div>

        {/* Student count */}
        <div style={{
          fontFamily: fonts.body,
          fontSize: 11,
          color: colors.gray,
        }}>
          {totalStudents} student{totalStudents !== 1 ? 's' : ''}
        </div>
      </div>
    </Tooltip>
  );
}
