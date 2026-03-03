import { useState, useMemo } from 'react';
import { colors, fonts } from '../../theme';
import Badge from '../common/Badge';
import Tag from '../common/Tag';
import { parseMisconceptions } from '../../data/dataUtils';

const MASTERY_ORDER = { '3. Intervene': 0, '2. Support': 1, '1. Celebrate': 2, '4. N/A': 3 };

export default function StudentList({ students }) {
  const [sortKey, setSortKey] = useState('mastery'); // 'name' | 'mastery' | 'misconception'
  const [sortDir, setSortDir] = useState('asc');

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedStudents = useMemo(() => {
    const arr = [...students];
    const dir = sortDir === 'asc' ? 1 : -1;

    arr.sort((a, b) => {
      if (sortKey === 'name') {
        return dir * a.studentName.localeCompare(b.studentName);
      }
      if (sortKey === 'mastery') {
        const aOrder = MASTERY_ORDER[a.currentMastery] ?? 4;
        const bOrder = MASTERY_ORDER[b.currentMastery] ?? 4;
        return dir * (aOrder - bOrder);
      }
      if (sortKey === 'misconception') {
        const aMisc = parseMisconceptions(a.misconception);
        const bMisc = parseMisconceptions(b.misconception);
        const aFirst = aMisc.length > 0 ? aMisc[0] : '';
        const bFirst = bMisc.length > 0 ? bMisc[0] : '';
        // Empty misconceptions sort last
        if (!aFirst && bFirst) return dir;
        if (aFirst && !bFirst) return -dir;
        return dir * aFirst.localeCompare(bFirst);
      }
      return 0;
    });

    return arr;
  }, [students, sortKey, sortDir]);

  const arrow = (key) => {
    if (sortKey !== key) return ' ↕';
    return sortDir === 'asc' ? ' ↑' : ' ↓';
  };

  return (
    <div style={{
      marginTop: 12,
      border: `1px solid ${colors.border}`,
      borderRadius: 8,
      overflow: 'hidden',
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#FAFAFA' }}>
            <th
              style={{ ...thStyle, cursor: 'pointer', userSelect: 'none' }}
              onClick={() => handleSort('name')}
            >
              Student Name{arrow('name')}
            </th>
            <th
              style={{ ...thStyle, textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}
              onClick={() => handleSort('mastery')}
            >
              Mastery{arrow('mastery')}
            </th>
            <th
              style={{ ...thStyle, cursor: 'pointer', userSelect: 'none' }}
              onClick={() => handleSort('misconception')}
            >
              Misconceptions{arrow('misconception')}
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedStudents.map((student, i) => {
            const misconceptions = parseMisconceptions(student.misconception);
            return (
              <tr
                key={student.studentId}
                style={{
                  backgroundColor: i % 2 === 0 ? colors.white : '#FAFAFA',
                  borderTop: `1px solid ${colors.border}`,
                }}
              >
                <td style={tdStyle}>
                  <span style={{
                    fontFamily: fonts.body,
                    fontSize: 13,
                    color: colors.navy,
                  }}>
                    {student.studentName}
                  </span>
                </td>
                <td style={{ ...tdStyle, textAlign: 'center' }}>
                  <Badge mastery={student.currentMastery} />
                </td>
                <td style={tdStyle}>
                  {misconceptions.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                      {misconceptions.map((m, j) => (
                        <Tag key={j} misconception={m} />
                      ))}
                    </div>
                  ) : (
                    <span style={{
                      fontFamily: fonts.body,
                      fontSize: 12,
                      color: '#BDBDBD',
                    }}>
                      —
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* View Classroom Insights link */}
      <div style={{
        padding: '10px 16px',
        borderTop: `1px solid ${colors.border}`,
        backgroundColor: '#FAFAFA',
        textAlign: 'right',
      }}>
        <span
          style={{
            fontFamily: fonts.body,
            fontSize: 12,
            fontWeight: 500,
            color: colors.purple,
            cursor: 'pointer',
          }}
        >
          View Classroom Insights →
        </span>
      </div>
    </div>
  );
}

const thStyle = {
  fontFamily: "'Archivo', sans-serif",
  fontSize: 11,
  fontWeight: 600,
  color: '#4D4D4D',
  textAlign: 'left',
  padding: '8px 12px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const tdStyle = {
  padding: '8px 12px',
  verticalAlign: 'middle',
};
