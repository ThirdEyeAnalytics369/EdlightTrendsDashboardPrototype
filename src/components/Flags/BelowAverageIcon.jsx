import Tooltip from '../common/Tooltip';

export default function BelowAverageIcon({ belowAverageBy }) {
  return (
    <Tooltip text={`Below grade average by ${belowAverageBy} points`}>
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 18,
        height: 18,
        fontSize: 12,
        color: '#E65100',
        cursor: 'help',
      }}>
        ⚠
      </span>
    </Tooltip>
  );
}
