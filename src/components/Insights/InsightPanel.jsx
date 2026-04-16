import { useState } from 'react';
import InsightCard from './InsightCard';
import { fonts, colors } from '../../theme';

export default function InsightPanel({ insights, onInsightClick }) {
  const [expanded, setExpanded] = useState(false);

  if (!insights || insights.length === 0) return null;

  const visibleInsights = expanded ? insights : insights.slice(0, 3);
  const hiddenCount = insights.length - 3;

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ marginBottom: 12 }}>
        <h3 style={{
          fontFamily: fonts.heading,
          fontWeight: 700,
          fontSize: 16,
          color: '#33385C',
          margin: '0 0 2px 0',
          lineHeight: 1.2,
        }}>
          Focus This Week
        </h3>
        <p style={{
          fontFamily: fonts.body,
          fontSize: 11,
          color: '#4D4D4D',
          margin: 0,
          lineHeight: 1.4,
        }}>
          Auto-detected priorities based on recent data
        </p>
      </div>
      <div style={{
        display: 'flex',
        gap: 12,
        flexWrap: 'wrap',
      }}>
        {visibleInsights.map((insight, i) => (
          <InsightCard key={i} insight={insight} onClick={onInsightClick} />
        ))}
      </div>
      {hiddenCount > 0 && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          style={{
            background: 'none',
            border: 'none',
            fontFamily: fonts.body,
            fontSize: 12,
            color: colors.purple,
            cursor: 'pointer',
            padding: '8px 0 0 0',
            fontWeight: 500,
          }}
        >
          +{hiddenCount} more insight{hiddenCount > 1 ? 's' : ''}
        </button>
      )}
      {expanded && hiddenCount > 0 && (
        <button
          onClick={() => setExpanded(false)}
          style={{
            background: 'none',
            border: 'none',
            fontFamily: fonts.body,
            fontSize: 12,
            color: colors.purple,
            cursor: 'pointer',
            padding: '8px 0 0 0',
            fontWeight: 500,
          }}
        >
          Show less
        </button>
      )}
    </div>
  );
}
