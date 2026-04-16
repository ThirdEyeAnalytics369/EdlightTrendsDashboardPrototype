import { useState, useMemo, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFilter } from '../context/FilterContext';
import Header from '../components/Layout/Header';
import MainContent from '../components/Layout/MainContent';
import HeatMap from '../components/HeatMap/HeatMap';
import ExpansionPanel from '../components/DrillDown/ExpansionPanel';
import Breadcrumb from '../components/DrillDown/Breadcrumb';
import TeacherCards from '../components/DrillDown/TeacherCards';
import StudentList from '../components/DrillDown/StudentList';
import MisconceptionChart from '../components/MistakePatterns/MisconceptionChart';
import SchoolSummary from '../components/SchoolSummary/SchoolSummary';
import InsightPanel from '../components/Insights/InsightPanel';
import { aggregateByGradeStandard, getStandardDescription, getDateRangeLabel, filterByTimeRange, computeGradeTrends } from '../data/dataUtils';
import { generateInsights } from '../data/insightEngine';
import { generateHeatMapCSV, generateStudentCSV, downloadCSV, printView } from '../lib/exportUtils';
import { colors, fonts, sizing } from '../theme';
import priorYearData from '../data/priorYear.json';

const SCHOOL_DATA_MAP = {
  'westfield-elementary': () => import('../data/data_westfield.json'),
  'lincoln-heights': () => import('../data/data_lincoln.json'),
  'riverside-academy': () => import('../data/data_riverside.json'),
  'oak-park': () => import('../data/data_oakpark.json'),
};

const SCHOOL_NAME_MAP = {
  'westfield-elementary': 'Westfield Elementary School',
  'lincoln-heights': 'Lincoln Heights Elementary School',
  'riverside-academy': 'Riverside Academy',
  'oak-park': 'Oak Park Elementary School',
};

export default function SchoolView() {
  const { schoolSlug } = useParams();
  const navigate = useNavigate();
  const { timeRange, setTimeRange } = useFilter();

  const [rawData, setRawData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [drillState, setDrillState] = useState(null);
  const [showPriorYear, setShowPriorYear] = useState(false);

  const schoolName = SCHOOL_NAME_MAP[schoolSlug] || schoolSlug;

  // Build prior year lookup for current school: { [grade]: { [standardCode]: percent } }
  const priorYearLookup = useMemo(() => {
    const lookup = {};
    for (const record of priorYearData) {
      if (record.schoolSlug !== schoolSlug) continue;
      if (!lookup[record.grade]) lookup[record.grade] = {};
      lookup[record.grade][record.standardCode] = record.priorYearCelebratePercent;
    }
    return lookup;
  }, [schoolSlug]);

  // Collapse drill-down when time filter changes
  const handleTimeRangeChange = useCallback((newRange) => {
    setTimeRange(newRange);
    setDrillState(null);
  }, [setTimeRange]);

  // Load school data when slug changes
  useEffect(() => {
    setLoading(true);
    setError(null);
    setDrillState(null);

    const loader = SCHOOL_DATA_MAP[schoolSlug];
    if (!loader) {
      setError(`Unknown school: ${schoolSlug}`);
      setLoading(false);
      return;
    }

    loader()
      .then(mod => {
        setRawData(mod.default);
        setLoading(false);
      })
      .catch(err => {
        setError(`Failed to load data: ${err.message}`);
        setLoading(false);
      });
  }, [schoolSlug]);

  // Collapse drill-down when time filter changes
  useEffect(() => {
    setDrillState(null);
  }, [timeRange]);

  // Filter data by time range
  const filteredData = useMemo(
    () => (rawData ? filterByTimeRange(rawData, timeRange) : []),
    [rawData, timeRange]
  );

  // Date range label
  const dateRange = useMemo(() => getDateRangeLabel(filteredData), [filteredData]);

  const gradeStandardData = useMemo(() => aggregateByGradeStandard(filteredData), [filteredData]);

  // Compute trends and insights
  const gradeTrends = useMemo(() => computeGradeTrends(filteredData), [filteredData]);
  const insights = useMemo(
    () => generateInsights(gradeStandardData, gradeTrends),
    [gradeStandardData, gradeTrends]
  );

  // Active cell for heat map highlighting
  const activeCell = drillState
    ? { grade: drillState.grade, standard: drillState.standard }
    : null;

  // Handle insight card click — drill into the relevant cell
  const handleInsightClick = useCallback((drillTarget) => {
    if (drillTarget && drillTarget.grade != null && drillTarget.standard) {
      setDrillState({ grade: drillTarget.grade, standard: drillTarget.standard });
    }
  }, []);

  // Handle heat map cell click
  const handleCellClick = useCallback((grade, standard) => {
    setDrillState(prev => {
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
      if (prev.teacher === teacherName) {
        return { grade: prev.grade, standard: prev.standard };
      }
      return { ...prev, teacher: teacherName };
    });
  }, []);

  // Breadcrumb navigation
  const handleBreadcrumbNavigate = useCallback((index) => {
    if (index === 0) {
      navigate('/');
    } else if (index === 1) {
      setDrillState(null);
    } else if (index === 2) {
      setDrillState(prev => prev ? { grade: prev.grade, standard: prev.standard } : null);
    }
    // index 3 = current teacher, clicking current does nothing
  }, [navigate]);

  // Build breadcrumb items
  const breadcrumbItems = useMemo(() => {
    const items = [
      { label: 'District' },
      { label: 'All Grades' },
    ];
    if (drillState) {
      items.push({ label: `Grade ${drillState.grade} \u203A ${drillState.standard}` });
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
    downloadCSV(csv, `edlight-heatmap-${schoolSlug}.csv`);
  }, [gradeStandardData, schoolSlug]);

  const handleExportStudentCSV = useCallback(() => {
    if (!drillData || !drillState) return;
    const csv = generateStudentCSV(drillData, drillState);
    if (csv) downloadCSV(csv, `edlight-students-${drillState.standard}.csv`);
  }, [drillData, drillState]);

  // Loading state
  if (loading) {
    return (
      <>
        <Header schoolName={schoolName} />
        <MainContent>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 400,
          }}>
            <div style={{
              textAlign: 'center',
              backgroundColor: colors.white,
              borderRadius: sizing.cardBorderRadius,
              boxShadow: colors.cardShadow,
              padding: '48px 56px',
            }}>
              <div style={{
                width: 48,
                height: 48,
                border: `4px solid ${colors.border}`,
                borderTopColor: '#7477B8',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 20px',
              }} />
              <div style={{
                fontFamily: fonts.heading,
                fontWeight: 700,
                fontSize: 16,
                color: colors.navy,
                marginBottom: 6,
              }}>
                Loading {schoolName}...
              </div>
              <div style={{
                fontFamily: fonts.body,
                fontSize: 13,
                color: colors.gray,
              }}>
                Preparing dashboard data
              </div>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        </MainContent>
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <>
        <Header schoolName={schoolName} />
        <MainContent>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 300,
            fontFamily: fonts.body,
            fontSize: 15,
            color: colors.red,
          }}>
            {error}
          </div>
        </MainContent>
      </>
    );
  }

  return (
    <>
      <Header
        schoolName={schoolName}
        dateRange={dateRange}
        timeRange={timeRange}
        onTimeRangeChange={handleTimeRangeChange}
        onExportCSV={handleExportCSV}
        onExportStudentCSV={handleExportStudentCSV}
        onPrint={printView}
        hasDrillData={!!drillData}
        showPriorYear={showPriorYear}
        onPriorYearToggle={setShowPriorYear}
      />

      <MainContent>
        {/* Auto-surfacing insights */}
        <InsightPanel insights={insights} onInsightClick={handleInsightClick} />

        {/* School-wide metrics bar — above the heat map */}
        <SchoolSummary filteredData={filteredData} section="metrics" />

        {/* Heat Map */}
        <HeatMap
          data={filteredData}
          activeCell={activeCell}
          onCellClick={handleCellClick}
          priorYearLookup={priorYearLookup}
          showPriorYear={showPriorYear}
        />

        {/* Domain summary + Teacher list — below the heat map */}
        <SchoolSummary filteredData={filteredData} section="details" />

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
                Grade {drillState.grade} &mdash; {drillState.standard}: {getStandardDescription(drillState.standard)}
              </h3>

              {/* Level 1: Teacher cards */}
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
          )}
        </ExpansionPanel>
      </MainContent>
    </>
  );
}
