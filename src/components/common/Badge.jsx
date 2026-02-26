import { colors, fonts } from '../../theme';

const MASTERY_STYLES = {
  '1. Celebrate': { bg: colors.green, text: '#fff', label: 'Celebrate' },
  '2. Support': { bg: colors.yellow, text: colors.navy, label: 'Support' },
  '3. Intervene': { bg: colors.red, text: '#fff', label: 'Intervene' },
  '4. N/A': { bg: colors.grayCell, text: colors.gray, label: 'N/A' },
};

export default function Badge({ mastery }) {
  const style = MASTERY_STYLES[mastery] || MASTERY_STYLES['4. N/A'];

  return (
    <span style={{
      display: 'inline-block',
      fontFamily: fonts.body,
      fontSize: 11,
      fontWeight: 500,
      padding: '2px 8px',
      borderRadius: 10,
      backgroundColor: style.bg,
      color: style.text,
      whiteSpace: 'nowrap',
    }}>
      {style.label}
    </span>
  );
}
