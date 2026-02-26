import { colors } from '../../theme';

export default function MainContent({ children }) {
  return (
    <div style={{
      flex: 1,
      backgroundColor: colors.background,
      padding: 24,
      overflowY: 'auto',
      minHeight: 0,
    }}>
      {children}
    </div>
  );
}
