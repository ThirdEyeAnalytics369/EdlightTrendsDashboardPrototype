import { colors, fonts, sizing, getCellColor, getCellTextColor } from '../../theme';
import Tooltip from '../common/Tooltip';

export default function HeatMapCell({
  masteryPercent,
  hasEnoughData,
  totalStudents,
  celebrateCount,
  naCount,
  dominantMisconception,
  hasFlag,
  isActive,
  onClick,
}) {
  const bgColor = getCellColor(masteryPercent, hasEnoughData);
  const textColor = getCellTextColor(masteryPercent, hasEnoughData);

  let tooltipText;
  if (hasEnoughData) {
    tooltipText = `${masteryPercent}% Celebrate (${celebrateCount} of ${totalStudents} students)`;
    if (naCount > 0) tooltipText += ` · ${naCount} N/A excluded`;
  } else {
    tooltipText = `Insufficient data (fewer than 10 students)`;
  }

  return (
    <Tooltip text={tooltipText}>
      <div
        className={hasFlag && hasEnoughData ? 'flag-pulse' : undefined}
        onClick={hasEnoughData ? onClick : undefined}
        style={{
          minWidth: 72,
          height: 58,
          backgroundColor: bgColor,
          borderRadius: sizing.cellBorderRadius,
          border: isActive
            ? `2px solid ${colors.navy}`
            : `1px solid ${colors.border}`,
          padding: sizing.cellPadding,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: hasEnoughData ? 'pointer' : 'default',
          position: 'relative',
          transition: 'filter 150ms, border-color 150ms, transform 150ms, box-shadow 150ms',
          transform: isActive ? 'scale(1.05)' : 'scale(1)',
          boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.2)' : 'none',
          gap: 2,
        }}
        onMouseEnter={e => { if (hasEnoughData) e.currentTarget.style.filter = 'brightness(1.1)'; }}
        onMouseLeave={e => { e.currentTarget.style.filter = 'brightness(1)'; }}
      >
        {/* Flag indicator */}
        {hasFlag && (
          <span style={{
            position: 'absolute',
            top: 2,
            right: 4,
            fontSize: 10,
            opacity: 0.8,
          }}>
            ⚠
          </span>
        )}

        {/* Percentage or n<10 */}
        <span style={{
          fontFamily: fonts.heading,
          fontWeight: 700,
          fontSize: hasEnoughData ? 18 : 11,
          color: textColor,
          lineHeight: 1,
        }}>
          {hasEnoughData ? `${masteryPercent}%` : 'n < 10'}
        </span>

        {/* Dominant misconception label */}
        {dominantMisconception && hasEnoughData && (
          <Tooltip text={`${dominantMisconception.percent}% of errors are ${dominantMisconception.type}`}>
            <span style={{
              fontFamily: fonts.body,
              fontSize: 9,
              color: textColor,
              opacity: 0.8,
              lineHeight: 1,
              textAlign: 'center',
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {dominantMisconception.abbreviation}
            </span>
          </Tooltip>
        )}
      </div>
    </Tooltip>
  );
}
