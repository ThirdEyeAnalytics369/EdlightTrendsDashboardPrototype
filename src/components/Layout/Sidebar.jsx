import { colors, fonts } from '../../theme';

export default function Sidebar() {
  return (
    <div style={{
      width: 240,
      height: '100vh',
      position: 'sticky',
      top: 0,
      backgroundColor: colors.navy,
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 0',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{
        padding: '0 20px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        marginBottom: 16,
      }}>
        <span style={{
          fontFamily: fonts.heading,
          fontWeight: 700,
          fontSize: 22,
          color: colors.white,
          letterSpacing: '-0.5px',
        }}>
          EdLight
        </span>
      </div>

      {/* School name */}
      <div style={{
        padding: '0 20px 16px',
        fontFamily: fonts.body,
        fontSize: 12,
        color: 'rgba(255,255,255,0.5)',
        letterSpacing: '0.3px',
      }}>
        Westfield Elementary
      </div>

      {/* Navigation */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <NavItem label="Dashboard" active={false} />
        <NavItem label="Trends" active={true} />
      </nav>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Color Legend */}
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid rgba(255,255,255,0.1)',
      }}>
        <div style={{
          fontFamily: fonts.body,
          fontSize: 10,
          fontWeight: 600,
          color: 'rgba(255,255,255,0.4)',
          textTransform: 'uppercase',
          letterSpacing: '0.8px',
          marginBottom: 10,
        }}>
          Mastery Legend
        </div>
        <LegendItem color={colors.green} label="On Track" threshold="75%+" />
        <LegendItem color={colors.yellow} label="Approaching" threshold="50–74%" />
        <LegendItem color={colors.red} label="Needs Attention" threshold="< 50%" />
        <LegendItem color={colors.grayCell} label="Insufficient Data" threshold="n < 10" />
      </div>
    </div>
  );
}

function NavItem({ label, active }) {
  return (
    <div style={{
      padding: '10px 20px',
      fontFamily: fonts.body,
      fontSize: 14,
      fontWeight: active ? 500 : 400,
      color: active ? colors.white : 'rgba(255,255,255,0.6)',
      backgroundColor: active ? 'rgba(255,255,255,0.12)' : 'transparent',
      borderLeft: active ? `3px solid ${colors.pink}` : '3px solid transparent',
      cursor: 'pointer',
      transition: 'background-color 150ms',
    }}>
      {label}
    </div>
  );
}

function LegendItem({ color, label, threshold }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 6,
    }}>
      <div style={{
        width: 14,
        height: 14,
        borderRadius: 3,
        backgroundColor: color,
        flexShrink: 0,
      }} />
      <span style={{
        fontFamily: fonts.body,
        fontSize: 12,
        color: 'rgba(255,255,255,0.7)',
        flex: 1,
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: fonts.body,
        fontSize: 11,
        color: 'rgba(255,255,255,0.4)',
      }}>
        {threshold}
      </span>
    </div>
  );
}
