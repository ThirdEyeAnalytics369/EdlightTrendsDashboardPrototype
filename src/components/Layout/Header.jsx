import { colors, fonts } from '../../theme';
import TimeFilter from '../Controls/TimeFilter';
import ExportMenu from '../Controls/ExportMenu';

export default function Header({ dateRange, timeRange, onTimeRangeChange, onExportCSV, onExportStudentCSV, onPrint, hasDrillData }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 24px',
      backgroundColor: colors.white,
      borderBottom: `1px solid ${colors.border}`,
      gap: 16,
      flexWrap: 'wrap',
    }}>
      <h1 style={{
        fontFamily: fonts.heading,
        fontWeight: 700,
        fontSize: 20,
        color: colors.navy,
        margin: 0,
      }}>
        Westfield Elementary School
      </h1>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}>
        <TimeFilter selected={timeRange} onChange={onTimeRangeChange} />
        <span style={{
          fontFamily: fonts.body,
          fontSize: 13,
          color: colors.gray,
          whiteSpace: 'nowrap',
        }}>
          {dateRange}
        </span>
        <ExportMenu
          onExportCSV={onExportCSV}
          onExportStudentCSV={onExportStudentCSV}
          onPrint={onPrint}
          hasDrillData={hasDrillData}
        />
      </div>
    </div>
  );
}
