import { colors, fonts } from '../../theme';
import TimeFilter from '../Controls/TimeFilter';
import ExportMenu from '../Controls/ExportMenu';
import PriorYearToggle from '../YearOverYear/PriorYearToggle';

export default function Header({
  schoolName,
  dateRange,
  timeRange,
  onTimeRangeChange,
  onExportCSV,
  onExportStudentCSV,
  onPrint,
  hasDrillData,
  showPriorYear,
  onPriorYearToggle,
}) {
  const showExports = !!(onExportCSV || onExportStudentCSV || onPrint);
  const showPriorYearToggle = typeof onPriorYearToggle === 'function';

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
        {schoolName || 'Westfield Unified School District'}
      </h1>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}>
        {onTimeRangeChange && (
          <TimeFilter selected={timeRange} onChange={onTimeRangeChange} />
        )}
        {dateRange && (
          <span style={{
            fontFamily: fonts.body,
            fontSize: 13,
            color: colors.gray,
            whiteSpace: 'nowrap',
          }}>
            {dateRange}
          </span>
        )}
        {showPriorYearToggle && (
          <PriorYearToggle
            checked={showPriorYear}
            onChange={onPriorYearToggle}
          />
        )}
        {showExports && (
          <ExportMenu
            onExportCSV={onExportCSV}
            onExportStudentCSV={onExportStudentCSV}
            onPrint={onPrint}
            hasDrillData={hasDrillData}
          />
        )}
      </div>
    </div>
  );
}
