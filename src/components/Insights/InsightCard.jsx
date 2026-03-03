import { colors, fonts } from '../../theme';

const TYPE_COLORS = {
  critical: '#F44336',
  warning: '#FF9800',
  positive: '#4CAF50',
  info: '#7477B8',
};

const TYPE_BG = {
  critical: 'rgba(244, 67, 54, 0.06)',
  warning: 'rgba(255, 152, 0, 0.06)',
  positive: 'rgba(76, 175, 80, 0.06)',
  info: 'rgba(116, 119, 184, 0.06)',
};

const TYPE_ICONS = {
  critical: '🔴',
  warning: '🟡',
  positive: '🟢',
  info: '🟣',
};

export default function InsightCard({ insight }) {
  const borderColor = TYPE_COLORS[insight.type] || TYPE_COLORS.info;
  const bgColor = TYPE_BG[insight.type] || TYPE_BG.info;
  const icon = TYPE_ICONS[insight.type] || '';

  return (
    <div style={{
      flex: '1 1 0',
      minWidth: 200,
      maxWidth: 320,
      backgroundColor: bgColor,
      borderLeft: `4px solid ${borderColor}`,
      borderRadius: 8,
      padding: '14px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        <span style={{ fontSize: 12, lineHeight: 1 }}>{icon}</span>
        <span style={{
          fontFamily: fonts.heading,
          fontWeight: 700,
          fontSize: 13,
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
    </div>
  );
}
