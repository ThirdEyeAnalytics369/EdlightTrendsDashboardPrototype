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
  trend,
  priorYearPercent,
  showPriorYear,
}) {
  const bgColor = getCellColor(masteryPercent, hasEnoughData);
  const textColor = getCellTextColor(masteryPercent, hasEnoughData);

  // Build tooltip text — now includes dominant misconception (Change 3)
  let tooltipText;
  if (hasEnoughData) {
    tooltipText = `${masteryPercent}% Celebrate (${celebrateCount} of ${totalStudents} students)`;
    if (naCount > 0) tooltipText += ` \u00b7 ${naCount} N/A excluded`;
    if (dominantMisconception) {
      tooltipText += ` | Top gap: ${dominantMisconception.type}`;
    }
  } else {
    tooltipText = `Insufficient data (fewer than 10 students)`;
  }

  // Prior year comparison
  const showPY = showPriorYear && priorYearPercent != null && hasEnoughData && masteryPercent != null;
  const pyImproving = showPY && masteryPercent >= priorYearPercent;
  const pyDiff = showPY ? masteryPercent - priorYearPercent : 0;

  // Cell height adjusts when prior year is shown to accommodate split layout
  const cellHeight = showPY ? 80 : 68;

  return (
    <Tooltip text={tooltipText}>
      <div
        className={hasFlag && hasEnoughData ? 'flag-pulse' : undefined}
        onClick={hasEnoughData ? onClick : undefined}
        style={{
          minWidth: 80,
          height: cellHeight,
          backgroundColor: bgColor,
          borderRadius: sizing.cellBorderRadius,
          border: isActive
            ? `2px solid ${colors.navy}`
            : `1px solid ${colors.border}`,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: hasEnoughData ? 'pointer' : 'default',
          position: 'relative',
          transition: 'filter 150ms, border-color 150ms, transform 150ms, box-shadow 150ms',
          transform: isActive ? 'scale(1.05)' : 'scale(1)',
          boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.2)' : 'none',
          overflow: 'hidden',
        }}
        onMouseEnter={e => { if (hasEnoughData) e.currentTarget.style.filter = 'brightness(1.1)'; }}
        onMouseLeave={e => { e.currentTarget.style.filter = 'brightness(1)'; }}
      >
        {/* Flag indicator */}
        {hasFlag && (
          <span style={{
            position: 'absolute',
            top: 3,
            right: 5,
            fontSize: 13,
            color: '#FFFFFF',
            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))',
          }}>
            ⚠
          </span>
        )}

        {/* Main content area */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: sizing.cellPadding,
          gap: 2,
        }}>
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
        </div>

        {/* Prior year split layout (Change 6) */}
        {showPY && (
          <div style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0,
            padding: '3px 6px',
            backgroundColor: pyImproving
              ? 'rgba(76, 175, 80, 0.15)'
              : 'rgba(244, 67, 54, 0.15)',
            borderTop: '1px solid rgba(255,255,255,0.3)',
          }}>
            <span style={{
              fontFamily: fonts.heading,
              fontSize: 11,
              fontWeight: 700,
              color: textColor,
              lineHeight: 1,
            }}>
              {masteryPercent}%
            </span>
            <span style={{
              width: 1,
              height: 10,
              backgroundColor: 'rgba(255,255,255,0.4)',
              margin: '0 5px',
              flexShrink: 0,
            }} />
            <span style={{
              fontFamily: fonts.body,
              fontSize: 10,
              fontWeight: 600,
              color: textColor,
              opacity: 0.85,
              lineHeight: 1,
            }}>
              PY {priorYearPercent}%
            </span>
            <span style={{
              fontSize: 14,
              fontWeight: 700,
              color: '#FFFFFF',
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))',
              marginLeft: 3,
              lineHeight: 1,
            }}>
              {pyImproving ? '\u2191' : '\u2193'}
            </span>
          </div>
        )}

        {/* Standard-level trend arrow */}
        {trend && trend !== 'stable' && hasEnoughData && !showPY && (
          <span style={{
            position: 'absolute',
            bottom: 3,
            right: 5,
            fontSize: 14,
            fontWeight: 700,
            color: '#FFFFFF',
            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))',
            lineHeight: 1,
          }}>
            {trend === 'declining' ? '\u2193' : '\u2191'}
          </span>
        )}
      </div>
    </Tooltip>
  );
}
