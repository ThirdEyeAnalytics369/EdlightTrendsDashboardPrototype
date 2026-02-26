import { colors, fonts } from '../../theme';

export default function Header() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 24px',
      backgroundColor: colors.white,
      borderBottom: `1px solid ${colors.border}`,
    }}>
      <h1 style={{
        fontFamily: fonts.heading,
        fontWeight: 700,
        fontSize: 20,
        color: colors.navy,
        margin: 0,
      }}>
        Westfield Elementary School
      </h1>
      <span style={{
        fontFamily: fonts.body,
        fontSize: 14,
        color: colors.gray,
      }}>
        Sep 8 – Nov 28, 2025
      </span>
    </div>
  );
}
