import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { colors, fonts } from '../../theme';

// Teacher colors: purple at varying opacities
const TEACHER_COLORS = [
  'rgba(116, 119, 184, 1.0)',
  'rgba(240, 91, 148, 0.85)',
  'rgba(51, 56, 92, 0.75)',
];

export default function TeacherMisconceptionBreakdown({ teachers }) {
  if (!teachers || teachers.length === 0) return null;

  // Get the union of all misconception types across teachers, sorted by total count
  const typeTotals = {};
  for (const teacher of teachers) {
    for (const m of (teacher.misconceptions || [])) {
      typeTotals[m.abbreviation] = (typeTotals[m.abbreviation] || 0) + m.count;
    }
  }

  const sortedTypes = Object.entries(typeTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5) // Top 5 misconceptions
    .map(([abbr]) => abbr);

  // Build chart data: one row per misconception type, one bar per teacher
  const chartData = sortedTypes.map(abbr => {
    const row = { name: abbr };
    for (const teacher of teachers) {
      const m = (teacher.misconceptions || []).find(mc => mc.abbreviation === abbr);
      row[teacher.teacherName] = m ? m.percent : 0;
    }
    return row;
  });

  return (
    <div>
      <ResponsiveContainer width="100%" height={sortedTypes.length * 48 + 40}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 0, right: 20, bottom: 0, left: 10 }}
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
            contentStyle={{
              fontFamily: "'Archivo', sans-serif",
              fontSize: 12,
              borderRadius: 4,
              border: `1px solid ${colors.border}`,
            }}
            formatter={(value, name) => [`${value}%`, name]}
          />
          <Legend
            wrapperStyle={{
              fontFamily: "'Archivo', sans-serif",
              fontSize: 11,
            }}
          />
          {teachers.map((teacher, i) => (
            <Bar
              key={teacher.teacherName}
              dataKey={teacher.teacherName}
              fill={TEACHER_COLORS[i % TEACHER_COLORS.length]}
              radius={[0, 4, 4, 0]}
              barSize={14}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
