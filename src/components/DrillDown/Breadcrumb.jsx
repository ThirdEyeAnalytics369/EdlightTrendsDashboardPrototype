import { colors, fonts } from '../../theme';

export default function Breadcrumb({ items, onNavigate }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.gray,
      marginBottom: 12,
      flexWrap: 'wrap',
    }}>
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {i > 0 && <span style={{ color: '#BDBDBD' }}>›</span>}
            {isLast ? (
              <span style={{ color: colors.navy, fontWeight: 500 }}>{item.label}</span>
            ) : (
              <span
                onClick={() => onNavigate(i)}
                style={{
                  color: colors.purple,
                  cursor: 'pointer',
                  textDecoration: 'none',
                }}
                onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline'; }}
                onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none'; }}
              >
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}
