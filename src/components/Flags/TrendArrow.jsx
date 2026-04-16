import { colors } from '../../theme';
import Tooltip from '../common/Tooltip';

export default function TrendArrow({ trend, baseline, current, diff, grade }) {
  if (trend === 'stable') return null;

  const isDeclining = trend === 'declining';
  const arrow = isDeclining ? '↓' : '↑';
  const color = isDeclining ? colors.red : colors.green;
  const sign = diff > 0 ? '+' : '';
  const tooltipText = isDeclining
    ? `Grade ${grade} Celebrate rate has declined from ${baseline}% to ${current}% (${sign}${diff} points)`
    : `Grade ${grade} Celebrate rate has improved from ${baseline}% to ${current}% (+${Math.abs(diff)} points)`;

  return (
    <Tooltip text={tooltipText}>
      <span style={{
        fontSize: 20,
        fontWeight: 700,
        color,
        lineHeight: 1,
        cursor: 'help',
      }}>
        {arrow}
      </span>
    </Tooltip>
  );
}
