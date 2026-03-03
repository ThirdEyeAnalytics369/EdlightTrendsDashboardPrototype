import { colors, fonts } from '../../theme';
import Badge from '../common/Badge';
import Tag from '../common/Tag';
import { parseMisconceptions } from '../../data/dataUtils';

export default function StudentList({ students }) {
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
            <th style={thStyle}>Student Name</th>
            <th style={{ ...thStyle, textAlign: 'center' }}>Mastery</th>
            <th style={thStyle}>Misconceptions</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student, i) => {
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
