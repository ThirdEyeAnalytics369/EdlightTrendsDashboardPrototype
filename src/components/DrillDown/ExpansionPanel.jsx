export default function ExpansionPanel({ open, children }) {
  return (
    <div className={`expansion-panel ${open ? 'open' : ''}`}>
      <div className="expansion-content">
        {children}
      </div>
    </div>
  );
}
