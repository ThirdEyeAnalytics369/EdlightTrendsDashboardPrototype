import { colors, fonts } from '../../theme';

const TYPE_COLORS = {
  focus: '#F05B94',
  critical: '#F44336',
  warning: '#FF9800',
  positive: '#4CAF50',
  info: '#7477B8',
};

const TYPE_BG = {
  focus: 'rgba(240, 91, 148, 0.06)',
  critical: 'rgba(244, 67, 54, 0.06)',
  warning: 'rgba(255, 152, 0, 0.06)',
  positive: 'rgba(76, 175, 80, 0.06)',
  info: 'rgba(116, 119, 184, 0.06)',
};

const TYPE_ICONS = {
  focus: '\u2794',
  critical: '\uD83D\uDD34',
  warning: '\uD83D\uDFE1',
  positive: '\uD83D\uDFE2',
  info: '\uD83D\uDFE3',
};

export default function InsightCard({ insight, onClick }) {
  const isFocus = insight.type === 'focus';
  const borderColor = TYPE_COLORS[insight.type] || TYPE_COLORS.info;
  const bgColor = TYPE_BG[insight.type] || TYPE_BG.info;
  const icon = TYPE_ICONS[insight.type] || '';
  const isClickable = !!insight.drillTarget && !!onClick;

  const handleClick = () => {
    if (isClickable) {
      onClick(insight.drillTarget);
    }
  };

  return (
    <div
      onClick={handleClick}
      style={{
        flex: '1 1 0',
        minWidth: isFocus ? 240 : 200,
        maxWidth: isFocus ? 380 : 320,
        backgroundColor: bgColor,
        borderLeft: `${isFocus ? 5 : 4}px solid ${borderColor}`,
        borderRadius: 8,
        padding: isFocus ? '16px 18px' : '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        cursor: isClickable ? 'pointer' : 'default',
        transition: 'box-shadow 150ms',
      }}
      onMouseEnter={e => {
        if (isClickable) e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={e => {
        if (isClickable) e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        <span style={{ fontSize: isFocus ? 14 : 12, lineHeight: 1 }}>{icon}</span>
        <span style={{
          fontFamily: fonts.heading,
          fontWeight: 700,
          fontSize: isFocus ? 14 : 13,
          color: colors.navy,
          lineHeight: 1.2,
        }}>
          {insight.title}
        </span>
      </div>
      <span style={{
        fontFamily: fonts.body,
        fontSize: 12,
        color: colors.gray,
        lineHeight: 1.4,
      }}>
        {insight.detail}
      </span>

      {/* Standard chips */}
      {insight.standards && insight.standards.length > 0 && (
        <div style={{
          display: 'flex',
          gap: 4,
          flexWrap: 'wrap',
          marginTop: 2,
        }}>
          {insight.standards.map((s, i) => (
            <span
              key={i}
              style={{
                backgroundColor: 'rgba(116,119,184,0.12)',
                color: '#7477B8',
                fontSize: 10,
                fontFamily: fonts.body,
                fontWeight: 600,
                padding: '3px 6px',
                borderRadius: 3,
                lineHeight: 1.2,
              }}
            >
              {s.code}
            </span>
          ))}
        </div>
      )}

      {/* View details link for clickable cards */}
      {isClickable && (
        <span style={{
          fontFamily: fonts.body,
          fontSize: 11,
          color: colors.purple,
          marginTop: 2,
        }}>
          View details →
        </span>
      )}
    </div>
  );
}
