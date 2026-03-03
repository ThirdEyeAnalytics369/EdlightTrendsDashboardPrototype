import { useState, useMemo, useCallback } from 'react';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import MainContent from './components/Layout/MainContent';
import HeatMap from './components/HeatMap/HeatMap';
import ExpansionPanel from './components/DrillDown/ExpansionPanel';
import Breadcrumb from './components/DrillDown/Breadcrumb';
import TeacherCards from './components/DrillDown/TeacherCards';
import StudentList from './components/DrillDown/StudentList';
import MisconceptionChart from './components/MistakePatterns/MisconceptionChart';
import { aggregateByGradeStandard, getStandardDescription, getDateRangeLabel, filterByTimeRange, computeGradeTrends } from './data/dataUtils';
import { generateInsights } from './data/insightEngine';
import InsightPanel from './components/Insights/InsightPanel';
import { generateHeatMapCSV, generateStudentCSV, downloadCSV, printView } from './lib/exportUtils';
import { colors, fonts, sizing } from './theme';
import rawData from './data/data.json';

/**
 * Drill-down state:
 *   null — showing just the heat map (Level 0)
 *   { grade, standard } — showing teacher cards (Level 1)
 *   { grade, standard, teacher } — showing student list (Level 2)
 */

export default function App() {
  const [drillState, setDrillState] = useState(null);
  const [timeRange, setTimeRange] = useState(null); // null = "All"

  // Collapse drill-down when time filter changes
  const handleTimeRangeChange = useCallback((newRange) => {
    setTimeRange(newRange);
    setDrillState(null);
  }, []);

  // Filter data by time range
  const filteredData = useMemo(() => filterByTimeRange(rawData, timeRange), [timeRange]);

  // Date range label
  const dateRange = useMemo(() => getDateRangeLabel(filteredData), [filteredData]);

  const gradeStandardData = useMemo(() => aggregateByGradeStandard(filteredData), [filteredData]);

  // Compute trends and insights
  const gradeTrends = useMemo(() => computeGradeTrends(filteredData), [filteredData]);
  const insights = useMemo(() => generateInsights(gradeStandardData, gradeTrends), [gradeStandardData, gradeTrends]);

  // Active cell for heat map highlighting
  const activeCell = drillState ? { grade: drillState.grade, standard: drillState.standard } : null;

  // Handle heat map cell click
  const handleCellClick = useCallback((grade, standard) => {
    setDrillState(prev => {
      // If clicking the same cell, collapse
      if (prev && prev.grade === grade && prev.standard === standard) {
        return null;
      }
      return { grade, standard };
    });
  }, []);

  // Handle teacher click
  const handleTeacherClick = useCallback((teacherName) => {
    setDrillState(prev => {
      if (!prev) return null;
      // If clicking the same teacher, collapse student list
      if (prev.teacher === teacherName) {
        return { grade: prev.grade, standard: prev.standard };
      }
      return { ...prev, teacher: teacherName };
    });
  }, []);

  // Breadcrumb navigation
  const handleBreadcrumbNavigate = useCallback((index) => {
    if (index === 0) {
      setDrillState(null); // Back to all grades
    } else if (index === 1) {
      setDrillState(prev => prev ? { grade: prev.grade, standard: prev.standard } : null);
    }
    // index 2 = current teacher, clicking current does nothing
  }, []);

  // Build breadcrumb items
  const breadcrumbItems = useMemo(() => {
    const items = [{ label: 'All Grades' }];
    if (drillState) {
      items.push({ label: `Grade ${drillState.grade} › ${drillState.standard}` });
      if (drillState.teacher) {
        items.push({ label: drillState.teacher });
      }
    }
    return items;
  }, [drillState]);

  // Get current drill-down data
  const drillData = useMemo(() => {
    if (!drillState) return null;
    const { grade, standard, teacher } = drillState;
    const cellData = gradeStandardData[grade]?.[standard];
    if (!cellData) return null;

    const result = { ...cellData };

    if (teacher) {
      result.activeTeacher = cellData.teachers.find(t => t.teacherName === teacher);
    }

    return result;
  }, [drillState, gradeStandardData]);

  // Export handlers
  const handleExportCSV = useCallback(() => {
    const csv = generateHeatMapCSV(gradeStandardData);
    downloadCSV(csv, 'edlight-heatmap-summary.csv');
  }, [gradeStandardData]);

  const handleExportStudentCSV = useCallback(() => {
    if (!drillData || !drillState) return;
    const csv = generateStudentCSV(drillData, drillState);
    if (csv) downloadCSV(csv, `edlight-students-${drillState.standard}.csv`);
  }, [drillData, drillState]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header
          dateRange={dateRange}
          timeRange={timeRange}
          onTimeRangeChange={handleTimeRangeChange}
          onExportCSV={handleExportCSV}
          onExportStudentCSV={handleExportStudentCSV}
          onPrint={printView}
          hasDrillData={!!drillData}
        />

        <MainContent>
          {/* Auto-surfacing insights */}
          <InsightPanel insights={insights} />

          {/* Heat Map */}
          <HeatMap
            data={filteredData}
            activeCell={activeCell}
            onCellClick={handleCellClick}
          />

          {/* Drill-down expansion */}
          <ExpansionPanel open={!!drillState}>
            {drillState && drillData && (
              <div style={{
                backgroundColor: colors.white,
                borderRadius: sizing.cardBorderRadius,
                boxShadow: colors.cardShadow,
                padding: sizing.cardPadding,
                marginTop: 12,
              }}>
                {/* Breadcrumb */}
                <Breadcrumb items={breadcrumbItems} onNavigate={handleBreadcrumbNavigate} />

                {/* Header */}
                <h3 style={{
                  fontFamily: fonts.heading,
                  fontWeight: 700,
                  fontSize: 15,
                  color: colors.navy,
                  marginBottom: 16,
                }}>
                  Grade {drillState.grade} — {drillState.standard}: {getStandardDescription(drillState.standard)}
                </h3>

                {/* Level 1: Teacher cards + Misconception chart (60/40 layout) */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '3fr 2fr',
                  gap: 20,
                  alignItems: 'start',
                }}>
                  <div>
                    <TeacherCards
                      teachers={drillData.teachers}
                      activeTeacher={drillState.teacher}
                      onTeacherClick={handleTeacherClick}
                    />

                    {/* Level 2: Student list (below teacher cards) */}
                    <ExpansionPanel open={!!drillState.teacher && !!drillData.activeTeacher}>
                      {drillData.activeTeacher && (
                        <StudentList students={drillData.activeTeacher.students} />
                      )}
                    </ExpansionPanel>
                  </div>

                  <MisconceptionChart misconceptions={drillData.misconceptions} teachers={drillData.teachers} />
                </div>
              </div>
            )}
          </ExpansionPanel>
        </MainContent>
      </div>
    </div>
  );
}
