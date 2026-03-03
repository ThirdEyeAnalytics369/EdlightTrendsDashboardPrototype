import { colors, fonts } from '../../theme';

const TIME_RANGES = [
  { label: '7D', days: 7 },
  { label: '14D', days: 14 },
  { label: '30D', days: 30 },
  { label: '3M', days: 90 },
  { label: '6M', days: 180 },
  { label: '1Y', days: 365 },
  { label: 'All', days: null },
];

export default function TimeFilter({ selected, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {TIME_RANGES.map(({ label, days }) => {
        const isSelected = selected === days;
        return (
          <button
            key={label}
            onClick={() => onChange(days)}
            style={{
              fontFamily: fonts.body,
              fontSize: 12,
              fontWeight: isSelected ? 600 : 500,
              padding: '5px 12px',
              borderRadius: 16,
              border: isSelected ? 'none' : `1px solid ${colors.border}`,
              backgroundColor: isSelected ? colors.purple : 'transparent',
              color: isSelected ? colors.white : colors.gray,
              cursor: 'pointer',
              transition: 'all 150ms',
              lineHeight: 1.2,
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
