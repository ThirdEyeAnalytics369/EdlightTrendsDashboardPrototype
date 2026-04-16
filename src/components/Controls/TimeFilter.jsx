import { useState } from 'react';
import { colors, fonts } from '../../theme';

const TIME_RANGES = [
  { label: 'Last 7 Days', days: 7 },
  { label: 'Last 14 Days', days: 14 },
  { label: 'Last 30 Days', days: 30 },
  { label: 'Last 3 Months', days: 90 },
  { label: 'Last 6 Months', days: 180 },
  { label: 'Full Year', days: 365 },
  { label: 'All Time', days: null },
];

export default function TimeFilter({ selected, onChange }) {
  const [showCustom, setShowCustom] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Determine if a preset pill is selected
  const isCustomActive = typeof selected === 'object' && selected !== null && selected.start && selected.end;

  const handlePresetClick = (days) => {
    setShowCustom(false);
    setStartDate('');
    setEndDate('');
    onChange(days);
  };

  const handleCustomClick = () => {
    setShowCustom(true);
    // If we already have a custom range, keep it; otherwise clear
    if (!isCustomActive) {
      setStartDate('');
      setEndDate('');
    }
  };

  const handleStartChange = (e) => {
    const newStart = e.target.value;
    setStartDate(newStart);
    if (newStart && endDate && newStart <= endDate) {
      onChange({ start: newStart, end: endDate });
    }
  };

  const handleEndChange = (e) => {
    const newEnd = e.target.value;
    setEndDate(newEnd);
    if (startDate && newEnd && startDate <= newEnd) {
      onChange({ start: startDate, end: newEnd });
    }
  };

  const pillStyle = (isActive) => ({
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: isActive ? 600 : 500,
    padding: '5px 10px',
    borderRadius: 16,
    border: isActive ? 'none' : `1px solid ${colors.border}`,
    backgroundColor: isActive ? colors.purple : 'transparent',
    color: isActive ? colors.white : colors.gray,
    cursor: 'pointer',
    transition: 'all 150ms',
    lineHeight: 1.2,
  });

  const dateInputStyle = {
    fontFamily: fonts.body,
    fontSize: 11,
    padding: '4px 8px',
    borderRadius: 12,
    border: `1px solid ${colors.border}`,
    color: colors.gray,
    outline: 'none',
    lineHeight: 1.2,
  };

  return (
    <div data-print-hide style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        {TIME_RANGES.map(({ label, days }) => {
          const isSelected = !isCustomActive && !showCustom && selected === days;
          return (
            <button
              key={label}
              onClick={() => handlePresetClick(days)}
              style={pillStyle(isSelected)}
            >
              {label}
            </button>
          );
        })}
        <button
          onClick={handleCustomClick}
          style={pillStyle(isCustomActive || showCustom)}
        >
          Custom
        </button>
      </div>

      {/* Custom date inputs */}
      {(showCustom || isCustomActive) && (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input
            type="date"
            value={startDate || (isCustomActive ? selected.start : '')}
            onChange={handleStartChange}
            min="2025-09-02"
            max="2026-03-20"
            style={dateInputStyle}
          />
          <span style={{
            fontFamily: fonts.body,
            fontSize: 11,
            color: colors.gray,
          }}>
            to
          </span>
          <input
            type="date"
            value={endDate || (isCustomActive ? selected.end : '')}
            onChange={handleEndChange}
            min="2025-09-02"
            max="2026-03-20"
            style={dateInputStyle}
          />
        </div>
      )}
    </div>
  );
}
