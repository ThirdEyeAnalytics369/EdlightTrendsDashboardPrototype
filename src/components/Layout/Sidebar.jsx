import { colors, fonts } from '../../theme';

export default function Sidebar() {
  return (
    <div style={{
      width: 240,
      minHeight: '100vh',
      backgroundColor: colors.navy,
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 0',
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

      {/* Navigation */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <NavItem label="Dashboard" active={false} />
        <NavItem label="Trends" active={true} />
      </nav>
    </div>
  );
}

function NavItem({ label, active }) {
  return (
    <div style={{
      padding: '10px 20px',
      fontFamily: fonts.body,
      fontSize: 14,
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
