import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, fonts, sizing } from '../../theme';

function getBorderColor(celebratePct) {
  if (celebratePct >= 75) return colors.green;
  if (celebratePct >= 50) return colors.yellow;
  return colors.red;
}

function getTrendArrow(trend) {
  switch (trend) {
    case 'improving':
    case 'strong':
      return { symbol: '\u2191', color: colors.green, label: trend };
    case 'declining':
      return { symbol: '\u2193', color: colors.red, label: trend };
    case 'stable':
      return { symbol: '\u2192', color: colors.gray, label: trend };
    case 'mixed':
      return { symbol: '\u2195', color: colors.yellow, label: trend };
    default:
      return { symbol: '\u2014', color: colors.gray, label: 'unknown' };
  }
}

export default function SchoolCard({ school }) {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();

  const borderColor = getBorderColor(school.overallCelebratePercent);
  const trend = getTrendArrow(school.trend);

  return (
    <div
      onClick={() => navigate(`/school/${school.slug}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: colors.white,
        borderRadius: sizing.cardBorderRadius,
        boxShadow: hovered
          ? '0 4px 12px rgba(0,0,0,0.18)'
          : colors.cardShadow,
        borderLeft: `4px solid ${borderColor}`,
        padding: 0,
        cursor: 'pointer',
        transition: 'box-shadow 200ms ease, transform 200ms ease',
        transform: hovered ? 'translateY(-2px)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* PRIMARY SIGNAL ZONE — ~62% of card */}
      <div style={{
        padding: '16px 20px 12px',
        flex: '0 0 auto',
      }}>
        {/* School name + trend */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}>
          <h3 style={{
            fontFamily: fonts.heading,
            fontWeight: 700,
            fontSize: 16,
            color: colors.navy,
            margin: 0,
          }}>
            {school.name}
          </h3>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontFamily: fonts.body,
            fontSize: 12,
            fontWeight: 600,
            color: trend.color,
            backgroundColor: `${trend.color}14`,
            padding: '3px 8px',
            borderRadius: 12,
            textTransform: 'capitalize',
          }}>
            <span style={{ fontSize: 14 }}>{trend.symbol}</span>
            {trend.label}
          </span>
        </div>

        {/* Celebrate % — prominent for accessibility (Change 8) */}
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 6,
          marginBottom: 4,
        }}>
          <span style={{
            fontFamily: fonts.heading,
            fontWeight: 700,
            fontSize: 28,
            color: borderColor,
            lineHeight: 1,
          }}>
            {school.overallCelebratePercent}%
          </span>
          <span style={{
            fontFamily: fonts.body,
            fontSize: 12,
            color: colors.gray,
          }}>
            Celebrate
          </span>
        </div>

        {/* Progress bar with percentage to the right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{
            flex: 1,
            height: 14,
            backgroundColor: '#EEEEEE',
            borderRadius: 7,
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${school.overallCelebratePercent}%`,
              backgroundColor: borderColor,
              borderRadius: 7,
              transition: 'width 500ms ease',
              minWidth: 4,
            }} />
          </div>
          <span style={{
            fontFamily: fonts.heading,
            fontSize: 14,
            fontWeight: 700,
            color: borderColor,
            minWidth: 42,
          }}>
            {school.overallCelebratePercent}%
          </span>
        </div>
      </div>

      {/* DETAIL ZONE — ~38% of card */}
      <div style={{
        padding: '0 20px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}>
        {/* Metrics row */}
        <div style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
        }}>
          <Metric
            value={school.redCellCount}
            label="Red Cells"
            alert={school.redCellCount > 0}
          />
          <Metric
            value={school.decliningGrades}
            label="Declining Grades"
            alert={school.decliningGrades > 0}
          />
          <Metric
            value={school.flaggedTeachers}
            label="Flagged Teachers"
            alert={school.flaggedTeachers > 0}
          />
        </div>

        {/* Top concern — given more room (Change 9) */}
        <div style={{
          fontFamily: fonts.body,
          fontSize: 12,
          color: colors.gray,
          lineHeight: 1.5,
          borderTop: `1px solid ${colors.border}`,
          paddingTop: 12,
        }}>
          <span style={{ fontWeight: 600, color: colors.navy }}>Top concern: </span>
          {school.topConcern}
        </div>

        {/* Footer stats */}
        <div style={{
          display: 'flex',
          gap: 16,
          fontFamily: fonts.body,
          fontSize: 11,
          color: 'rgba(77,77,77,0.7)',
        }}>
          <span>{school.totalStudents} students</span>
          <span>{school.totalTeachers} teachers</span>
        </div>
      </div>
    </div>
  );
}

function Metric({ value, label, alert }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'baseline',
      gap: 4,
    }}>
      <span style={{
        fontFamily: fonts.heading,
        fontWeight: 700,
        fontSize: 18,
        color: alert ? colors.red : colors.navy,
      }}>
        {value}
      </span>
      <span style={{
        fontFamily: fonts.body,
        fontSize: 11,
        color: colors.gray,
      }}>
        {label}
      </span>
    </div>
  );
}
