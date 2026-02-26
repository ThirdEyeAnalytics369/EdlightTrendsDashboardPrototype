import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import { colors, fonts } from '../../theme';

export default function MisconceptionChart({ misconceptions }) {
  const [showAll, setShowAll] = useState(false);

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

  return (
    <div>
      <h4 style={{
        fontFamily: fonts.heading,
        fontWeight: 700,
        fontSize: 13,
        color: colors.navy,
        marginBottom: 12,
      }}>
        Mistake Patterns
      </h4>

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

      {/* Percentage labels to the right of bars */}
      <div style={{ marginTop: -4 }}>
        {displayed.map((m, i) => (
          <div key={i} style={{
            fontFamily: fonts.body,
            fontSize: 11,
            color: colors.gray,
            textAlign: 'right',
            paddingRight: 4,
            lineHeight: '36px',
            display: 'none', // Using Recharts built-in labels instead
          }}>
            {m.percent}% ({m.count})
          </div>
        ))}
      </div>

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
    </div>
  );
}
