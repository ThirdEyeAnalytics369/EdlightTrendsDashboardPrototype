import { fonts, colors } from '../../theme';

/**
 * Toggle switch to enable/disable prior year comparison overlay.
 * Renders a small toggle (36px wide, 20px tall) with label.
 */
export default function PriorYearToggle({ checked, onChange }) {
  return (
    <label style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      cursor: 'pointer',
      userSelect: 'none',
    }}>
      {/* Toggle track */}
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 36,
          height: 20,
          borderRadius: 10,
          backgroundColor: checked ? colors.purple : '#BDBDBD',
          position: 'relative',
          transition: 'background-color 200ms',
          flexShrink: 0,
        }}
      >
        {/* Toggle knob */}
        <div style={{
          width: 16,
          height: 16,
          borderRadius: '50%',
          backgroundColor: colors.white,
          position: 'absolute',
          top: 2,
          left: checked ? 18 : 2,
          transition: 'left 200ms',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }} />
      </div>

      {/* Label text */}
      <span style={{
        fontFamily: fonts.body,
        fontSize: 11,
        color: colors.gray,
        whiteSpace: 'nowrap',
      }}>
        Compare to Prior Year
      </span>
    </label>
  );
}
