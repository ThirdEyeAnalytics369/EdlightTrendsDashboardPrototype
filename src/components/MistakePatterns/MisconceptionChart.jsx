import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import { colors, fonts } from '../../theme';
import TeacherMisconceptionBreakdown from './TeacherMisconceptionBreakdown';

export default function MisconceptionChart({ misconceptions, teachers }) {
  const [showAll, setShowAll] = useState(false);
  const [view, setView] = useState('aggregated'); // 'aggregated' | 'byTeacher'

  if (!misconceptions || misconceptions.length === 0) {
    return (
      <div style={{
        fontFamily: fonts.body,
        fontSize: 13,
        color: '#BDBDBD',
        padding: 16,
        textAlign: 'center',
      }}>
        No misconception data available
      </div>
    );
  }

  const displayed = showAll ? misconceptions : misconceptions.slice(0, 3);
  const hasMore = misconceptions.length > 3;

  // Prepare data for Recharts horizontal bar chart
  const chartData = displayed.map(m => ({
    name: m.abbreviation,
    fullName: m.type,
    percent: m.percent,
    count: m.count,
  }));

  const hasTeachers = teachers && teachers.length > 0 && teachers.some(t => t.misconceptions?.length > 0);

  return (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
      }}>
        <h4 style={{
          fontFamily: fonts.heading,
          fontWeight: 700,
          fontSize: 13,
          color: colors.navy,
          margin: 0,
        }}>
          Mistake Patterns
        </h4>

        {hasTeachers && (
          <div style={{
            display: 'flex',
            gap: 2,
            backgroundColor: '#F0F0F0',
            borderRadius: 4,
            padding: 2,
          }}>
            {['aggregated', 'byTeacher'].map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  fontFamily: fonts.body,
                  fontSize: 11,
                  fontWeight: view === v ? 600 : 400,
                  color: view === v ? colors.white : colors.gray,
                  backgroundColor: view === v ? colors.purple : 'transparent',
                  borderRadius: 3,
                  padding: '3px 8px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 150ms',
                }}
              >
                {v === 'aggregated' ? 'Aggregated' : 'By Teacher'}
              </button>
            ))}
          </div>
        )}
      </div>

      {view === 'aggregated' ? (
        <>
          <ResponsiveContainer width="100%" height={displayed.length * 36 + 8}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 0, right: 60, bottom: 0, left: 10 }}
            >
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis
                type="category"
                dataKey="name"
                width={100}
                tick={{
                  fontFamily: "'Archivo', sans-serif",
                  fontSize: 11,
                  fill: colors.gray,
                }}
              />
              <RechartsTooltip
                formatter={(value, name, props) => [
                  `${props.payload.percent}% (${props.payload.count} students)`,
                  props.payload.fullName,
                ]}
                contentStyle={{
                  fontFamily: "'Archivo', sans-serif",
                  fontSize: 12,
                  borderRadius: 4,
                  border: `1px solid ${colors.border}`,
                }}
              />
              <Bar dataKey="percent" radius={[0, 4, 4, 0]} barSize={20}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={colors.purple}
                    fillOpacity={1 - index * 0.15}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {hasMore && (
            <button
              onClick={() => setShowAll(!showAll)}
              style={{
                fontFamily: fonts.body,
                fontSize: 12,
                color: colors.purple,
                padding: '4px 0',
                marginTop: 4,
                cursor: 'pointer',
                border: 'none',
                background: 'none',
              }}
            >
              {showAll ? 'Show less' : `Show all (${misconceptions.length})`}
            </button>
          )}
        </>
      ) : (
        <TeacherMisconceptionBreakdown teachers={teachers} />
      )}
    </div>
  );
}
