import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFilter } from '../../context/FilterContext';
import { colors, fonts } from '../../theme';
import districtSummary from '../../data/districtSummary.json';

const TIME_RANGE_LABELS = {
  null: 'All Time',
  'last-4-weeks': 'Last 4 Weeks',
  'last-8-weeks': 'Last 8 Weeks',
  'last-12-weeks': 'Last 12 Weeks',
};

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { timeRange } = useFilter();
  const [legendOpen, setLegendOpen] = useState(true);

  const isDistrictActive = location.pathname === '/';
  const activeSchoolSlug = location.pathname.startsWith('/school/')
    ? location.pathname.split('/school/')[1]
    : null;

  // Context summary text
  const contextSummary = useMemo(() => {
    const timeLabel = TIME_RANGE_LABELS[timeRange] || TIME_RANGE_LABELS[null];
    if (isDistrictActive) {
      return `Viewing: All Schools, ${timeLabel}`;
    }
    if (activeSchoolSlug) {
      const school = districtSummary.schools.find(s => s.slug === activeSchoolSlug);
      const schoolName = school ? school.name : activeSchoolSlug;
      return `Viewing: ${schoolName}, ${timeLabel}`;
    }
    return null;
  }, [isDistrictActive, activeSchoolSlug, timeRange]);

  return (
    <div data-print-hide style={{
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
        <span
          onClick={() => navigate('/')}
          style={{
            fontFamily: fonts.heading,
            fontWeight: 700,
            fontSize: 22,
            color: colors.white,
            letterSpacing: '-0.5px',
            cursor: 'pointer',
          }}
        >
          EdLight
        </span>
      </div>

      {/* District name */}
      <div style={{
        padding: '0 20px 16px',
        fontFamily: fonts.body,
        fontSize: 12,
        color: 'rgba(255,255,255,0.5)',
        letterSpacing: '0.3px',
      }}>
        {districtSummary.districtName}
      </div>

      {/* Navigation */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <NavItem
          label="District Overview"
          active={isDistrictActive}
          onClick={() => navigate('/')}
        />

        {/* Section label */}
        <div style={{
          padding: '14px 20px 6px',
          fontFamily: fonts.body,
          fontSize: 10,
          fontWeight: 600,
          color: 'rgba(255,255,255,0.35)',
          textTransform: 'uppercase',
          letterSpacing: '0.8px',
        }}>
          Schools
        </div>

        {districtSummary.schools.map(school => (
          <NavItem
            key={school.slug}
            label={school.name}
            active={activeSchoolSlug === school.slug}
            onClick={() => navigate(`/school/${school.slug}`)}
          />
        ))}
      </nav>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Context summary */}
      {contextSummary && (
        <div style={{
          padding: '8px 20px',
          fontFamily: fonts.body,
          fontSize: 10,
          color: 'rgba(255,255,255,0.35)',
          lineHeight: 1.4,
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          {contextSummary}
        </div>
      )}

      {/* Color Legend — collapsible */}
      <div style={{
        padding: '12px 20px',
        borderTop: '1px solid rgba(255,255,255,0.1)',
      }}>
        <div
          onClick={() => setLegendOpen(prev => !prev)}
          style={{
            fontFamily: fonts.body,
            fontSize: 10,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.4)',
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            marginBottom: legendOpen ? 10 : 0,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            userSelect: 'none',
          }}
        >
          <span>Mastery Legend</span>
          <span style={{
            fontSize: 9,
            transition: 'transform 200ms',
            transform: legendOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            display: 'inline-block',
          }}>
            ▼
          </span>
        </div>
        {legendOpen && (
          <>
            <LegendItem color={colors.green} label="On Track" threshold="75%+" />
            <LegendItem color={colors.yellow} label="Approaching" threshold="50-74%" />
            <LegendItem color={colors.red} label="Needs Attention" threshold="< 50%" />
            <LegendItem color={colors.grayCell} label="Insufficient Data" threshold="n < 10" />
          </>
        )}
      </div>
    </div>
  );
}

function NavItem({ label, active, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '10px 20px',
        fontFamily: fonts.body,
        fontSize: 13,
        fontWeight: active ? 500 : 400,
        color: active ? colors.white : 'rgba(255,255,255,0.6)',
        backgroundColor: active ? 'rgba(255,255,255,0.12)' : 'transparent',
        borderLeft: active ? `3px solid ${colors.pink}` : '3px solid transparent',
        cursor: 'pointer',
        transition: 'background-color 150ms',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
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
