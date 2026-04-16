import { useMemo } from 'react';
import { calculateCelebratePercent, parseMisconceptions, getAbbreviation, DOMAIN_NAMES } from '../../data/dataUtils';
import { colors, fonts, sizing } from '../../theme';
import Tooltip from '../common/Tooltip';

// ── Color helpers ────────────────────────────────────────────────────────────

function celebrateColor(pct) {
  if (pct >= 75) return colors.green;
  if (pct >= 50) return colors.yellow;
  return colors.red;
}

function interveneColor(pct) {
  if (pct > 20) return colors.red;
  if (pct > 10) return colors.yellow;
  return colors.gray;
}

// ── Panel wrapper ────────────────────────────────────────────────────────────

function Panel({ title, children }) {
  return (
    <div style={{
      backgroundColor: colors.white,
      borderRadius: sizing.cardBorderRadius,
      boxShadow: colors.cardShadow,
      padding: sizing.cardPadding,
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0,
    }}>
      <h4 style={{
        fontFamily: fonts.heading,
        fontWeight: 700,
        fontSize: 13,
        color: colors.navy,
        margin: '0 0 12px 0',
      }}>
        {title}
      </h4>
      {children}
    </div>
  );
}

// ── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ value, label, valueColor }) {
  return (
    <div style={{
      flex: '1 1 0',
      minWidth: 90,
      textAlign: 'center',
      padding: '10px 6px',
      backgroundColor: '#FAFAFA',
      borderRadius: 6,
    }}>
      <div style={{
        fontFamily: fonts.heading,
        fontWeight: 700,
        fontSize: 22,
        color: valueColor || colors.navy,
        lineHeight: 1.1,
        marginBottom: 4,
      }}>
        {value}
      </div>
      <div style={{
        fontFamily: fonts.body,
        fontSize: 11,
        color: colors.gray,
        lineHeight: 1.3,
      }}>
        {label}
      </div>
    </div>
  );
}

// ── Warning icon (orange flag) ───────────────────────────────────────────────

function WarningIcon() {
  return (
    <span
      title="Below school average"
      style={{
        display: 'inline-block',
        width: 14,
        height: 14,
        lineHeight: '14px',
        textAlign: 'center',
        fontSize: 11,
        color: '#F57C00',
      }}
    >
      {'\u26A0'}
    </span>
  );
}

// ── Panel 1: School-Wide Metrics ─────────────────────────────────────────────

function SchoolWideMetrics({ data }) {
  const metrics = useMemo(() => {
    const total = data.length;
    const naCount = data.filter(r => r['Mastery'] === '4. N/A').length;
    const interveneCount = data.filter(r => r['Mastery'] === '3. Intervene').length;
    const denominator = total - naCount;

    const uniqueStudents = new Set(data.map(r => r['sis_id'])).size;

    const stats = calculateCelebratePercent(data);
    const celebratePct = stats.percent;

    const supportCount = data.filter(r => r['Mastery'] === '2. Support').length;
    const intervenePct = denominator > 0 ? Math.round((interveneCount / denominator) * 100) : 0;
    const supportPct = denominator > 0 ? Math.round((supportCount / denominator) * 100) : 0;
    const naRate = total > 0 ? Math.round((naCount / total) * 100) : 0;

    const uniqueTeachers = new Set(data.map(r => r['Teacher'])).size;

    return { uniqueStudents, uniqueTeachers, celebratePct, supportPct, intervenePct, naRate, total };
  }, [data]);

  return (
    <Panel title="School-Wide Metrics">
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <StatCard
          value={metrics.total.toLocaleString()}
          label="Total Assessments"
        />
        <StatCard
          value={metrics.uniqueStudents}
          label="Students"
        />
        <StatCard
          value={metrics.celebratePct != null ? `${metrics.celebratePct}%` : 'n<10'}
          label="Celebrate %"
        />
        <StatCard
          value={`${metrics.supportPct}%`}
          label="Support %"
        />
        <StatCard
          value={`${metrics.intervenePct}%`}
          label="Intervene %"
        />
        <StatCard
          value={`${metrics.naRate}%`}
          label="N/A Rate"
        />
      </div>
    </Panel>
  );
}

// ── Panel 2: Teachers ─────────────────────────────────────────────────

function TeacherRanking({ data }) {
  const { teachers, schoolAvg } = useMemo(() => {
    // Group rows by teacher
    const byTeacher = {};
    for (const row of data) {
      const t = row['Teacher'];
      if (!byTeacher[t]) byTeacher[t] = { rows: [], grade: row['Grade'] };
      byTeacher[t].rows.push(row);
      // Keep the most common grade (use first seen for simplicity)
    }

    const teacherList = [];
    for (const [name, { rows, grade }] of Object.entries(byTeacher)) {
      const stats = calculateCelebratePercent(rows);
      if (!stats.hasEnoughData) continue;
      teacherList.push({
        name,
        grade,
        celebratePct: stats.percent,
        celebrateCount: stats.celebrateCount,
        total: stats.total,
      });
    }

    // School average from qualified teachers
    const avg = teacherList.length > 0
      ? Math.round(teacherList.reduce((s, t) => s + t.celebratePct, 0) / teacherList.length)
      : 0;

    // Flag below-average
    for (const t of teacherList) {
      t.belowAverage = t.celebratePct < avg;
    }

    // Sort by Celebrate % descending
    teacherList.sort((a, b) => b.celebratePct - a.celebratePct);

    return { teachers: teacherList, schoolAvg: avg };
  }, [data]);

  if (teachers.length === 0) {
    return (
      <Panel title="Teachers">
        <div style={{ fontFamily: fonts.body, fontSize: 12, color: colors.gray }}>
          Not enough data to rank teachers (n &lt; 10 per teacher).
        </div>
      </Panel>
    );
  }

  return (
    <Panel title="Teachers">
      <div style={{ overflowY: 'auto', maxHeight: 260 }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontFamily: fonts.body,
          fontSize: 12,
        }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
              {['#', 'Teacher', 'Grade', 'Celebrate %', ''].map((h, i) => (
                <th
                  key={i}
                  style={{
                    fontFamily: fonts.heading,
                    fontWeight: 600,
                    fontSize: 11,
                    color: colors.gray,
                    textAlign: i === 3 ? 'right' : 'left',
                    padding: '4px 6px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {teachers.map((t, i) => (
              <Tooltip
                key={t.name}
                text={`${t.name} | Grade ${t.grade} | Celebrate: ${t.celebratePct}% (${t.celebrateCount} of ${t.total} students)`}
              >
                <tr
                  style={{
                    borderBottom: `1px solid ${colors.border}`,
                    cursor: 'default',
                  }}
                >
                  <td style={{ padding: '3px 6px', color: colors.gray, fontSize: 11 }}>
                    {i + 1}
                  </td>
                  <td style={{
                    padding: '3px 6px',
                    color: colors.navy,
                    fontWeight: 500,
                    maxWidth: 140,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {t.name}
                  </td>
                  <td style={{ padding: '3px 6px', color: colors.gray, fontSize: 11 }}>
                    {t.grade}
                  </td>
                  <td style={{
                    padding: '3px 6px',
                    textAlign: 'right',
                    fontWeight: 600,
                    color: celebrateColor(t.celebratePct),
                  }}>
                    {t.celebratePct}%
                  </td>
                  <td style={{ padding: '3px 6px', width: 20, textAlign: 'center' }}>
                    {t.belowAverage && <WarningIcon />}
                  </td>
                </tr>
              </Tooltip>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{
        fontFamily: fonts.body,
        fontSize: 11,
        color: colors.gray,
        marginTop: 8,
        borderTop: `1px solid ${colors.border}`,
        paddingTop: 6,
      }}>
        School average: <strong style={{ color: colors.navy }}>{schoolAvg}%</strong>
        {' '}&mdash; {'\u26A0'} = below school average
      </div>
    </Panel>
  );
}

// ── Panel 3: Domain Summary (CSS bars) ───────────────────────────────────────

function DomainSummary({ data }) {
  const domains = useMemo(() => {
    // Group by Domain field
    const byDomain = {};
    for (const row of data) {
      const d = row['Domain'];
      if (!d) continue;
      if (!byDomain[d]) byDomain[d] = [];
      byDomain[d].push(row);
    }

    const result = [];
    for (const [code, rows] of Object.entries(byDomain)) {
      const stats = calculateCelebratePercent(rows);
      result.push({
        code,
        fullName: DOMAIN_NAMES[code] || code,
        celebratePct: stats.percent,
        celebrateCount: stats.celebrateCount,
        hasEnoughData: stats.hasEnoughData,
        total: stats.total,
      });
    }

    // Sort by Celebrate % descending; insufficient data goes to end
    result.sort((a, b) => {
      if (a.hasEnoughData && !b.hasEnoughData) return -1;
      if (!a.hasEnoughData && b.hasEnoughData) return 1;
      return (b.celebratePct || 0) - (a.celebratePct || 0);
    });

    return result;
  }, [data]);

  if (domains.length === 0) {
    return (
      <Panel title="Domain Summary">
        <div style={{ fontFamily: fonts.body, fontSize: 12, color: colors.gray }}>
          No domain data available.
        </div>
      </Panel>
    );
  }

  const maxPct = Math.max(...domains.filter(d => d.hasEnoughData).map(d => d.celebratePct), 1);

  return (
    <Panel title="Domain Summary">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {domains.map(d => (
          <Tooltip
            key={d.code}
            text={d.hasEnoughData
              ? `${d.fullName} (${d.code}) | ${d.celebratePct}% Celebrate (${d.celebrateCount} of ${d.total} students)`
              : `${d.fullName} (${d.code}) | Insufficient data (n < 10)`
            }
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'default' }}>
              {/* Domain label */}
              <div style={{
                width: 36,
                flexShrink: 0,
                fontFamily: fonts.heading,
                fontWeight: 600,
                fontSize: 12,
                color: colors.navy,
                textAlign: 'right',
              }}>
                {d.code}
              </div>

              {/* Bar track */}
              <div style={{
                flex: 1,
                height: 18,
                backgroundColor: '#F0F0F0',
                borderRadius: 4,
                overflow: 'hidden',
                position: 'relative',
              }}>
                {d.hasEnoughData ? (
                  <div style={{
                    height: '100%',
                    width: `${(d.celebratePct / maxPct) * 100}%`,
                    minWidth: d.celebratePct > 0 ? 4 : 0,
                    backgroundColor: celebrateColor(d.celebratePct),
                    borderRadius: 4,
                    transition: 'width 400ms ease',
                  }} />
                ) : (
                  <div style={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: 8,
                    fontFamily: fonts.body,
                    fontSize: 10,
                    color: colors.gray,
                    fontStyle: 'italic',
                  }}>
                    n&lt;10
                  </div>
                )}
              </div>

              {/* Percentage text */}
              <div style={{
                width: 38,
                flexShrink: 0,
                fontFamily: fonts.body,
                fontWeight: 600,
                fontSize: 12,
                color: d.hasEnoughData ? celebrateColor(d.celebratePct) : colors.gray,
                textAlign: 'right',
              }}>
                {d.hasEnoughData ? `${d.celebratePct}%` : '--'}
              </div>
            </div>
          </Tooltip>
        ))}
      </div>
      <div style={{
        fontFamily: fonts.body,
        fontSize: 10,
        color: 'rgba(77,77,77,0.6)',
        marginTop: 10,
      }}>
        Celebrate % by math domain (N/A excluded)
      </div>
    </Panel>
  );
}

// ── Panel 4: Top Learning Gaps School-Wide ───────────────────────────────────

function TopLearningGaps({ data }) {
  const misconceptions = useMemo(() => {
    const counts = {};
    let total = 0;

    for (const row of data) {
      // Only count misconceptions from Support and Intervene
      if (row['Mastery'] !== '2. Support' && row['Mastery'] !== '3. Intervene') continue;
      const types = parseMisconceptions(row['Misconceptions']);
      for (const type of types) {
        counts[type] = (counts[type] || 0) + 1;
        total++;
      }
    }

    return Object.entries(counts)
      .map(([type, count]) => ({
        type,
        abbreviation: getAbbreviation(type),
        count,
        percent: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [data]);

  if (misconceptions.length === 0) {
    return (
      <Panel title="Top Learning Gaps School-Wide">
        <div style={{ fontFamily: fonts.body, fontSize: 12, color: colors.gray }}>
          No misconception data available.
        </div>
      </Panel>
    );
  }

  const maxCount = misconceptions[0].count;

  return (
    <Panel title="Top Learning Gaps School-Wide">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {misconceptions.map((m, i) => (
          <div key={m.type} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Abbreviation label */}
            <div style={{
              width: 90,
              flexShrink: 0,
              fontFamily: fonts.body,
              fontSize: 11,
              color: colors.gray,
              textAlign: 'right',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {m.abbreviation}
            </div>

            {/* Bar */}
            <div style={{
              flex: 1,
              height: 18,
              backgroundColor: '#F0F0F0',
              borderRadius: 4,
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${(m.count / maxCount) * 100}%`,
                minWidth: 4,
                backgroundColor: colors.purple,
                opacity: 1 - i * 0.15,
                borderRadius: 4,
                transition: 'width 400ms ease',
              }} />
            </div>

            {/* Count + percent */}
            <div style={{
              width: 60,
              flexShrink: 0,
              fontFamily: fonts.body,
              fontSize: 11,
              color: colors.gray,
              textAlign: 'right',
              whiteSpace: 'nowrap',
            }}>
              {m.count} ({m.percent}%)
            </div>
          </div>
        ))}
      </div>
      <div style={{
        fontFamily: fonts.body,
        fontSize: 10,
        color: 'rgba(77,77,77,0.6)',
        marginTop: 10,
      }}>
        From Support &amp; Intervene students only
      </div>
    </Panel>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
// Accepts a `section` prop:
//   "metrics" — renders just the school-wide metrics bar (above heat map)
//   "details" — renders domain summary + teacher list side by side (below heat map)
//   undefined — renders everything (backward compat)

export default function SchoolSummary({ filteredData, section }) {
  if (!filteredData || filteredData.length === 0) return null;

  if (section === 'metrics') {
    return (
      <div style={{ marginBottom: 16 }}>
        <SchoolWideMetrics data={filteredData} />
      </div>
    );
  }

  if (section === 'details') {
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 16,
        marginTop: 16,
        marginBottom: 16,
      }}>
        <DomainSummary data={filteredData} />
        <TeacherRanking data={filteredData} />
      </div>
    );
  }

  // Default: everything
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16, marginBottom: 16 }}>
      <SchoolWideMetrics data={filteredData} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <DomainSummary data={filteredData} />
        <TeacherRanking data={filteredData} />
      </div>
    </div>
  );
}
