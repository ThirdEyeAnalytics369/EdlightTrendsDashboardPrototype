import InsightCard from './InsightCard';
import { fonts, colors } from '../../theme';

export default function InsightPanel({ insights }) {
  if (!insights || insights.length === 0) return null;

  return (
    <div style={{ marginBottom: 16 }}>
      <h3 style={{
        fontFamily: fonts.heading,
        fontWeight: 700,
        fontSize: 13,
        color: colors.navy,
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      }}>
        Key Insights
      </h3>
      <div style={{
        display: 'flex',
        gap: 12,
        flexWrap: 'wrap',
      }}>
        {insights.map((insight, i) => (
          <InsightCard key={i} insight={insight} />
        ))}
      </div>
    </div>
  );
}
