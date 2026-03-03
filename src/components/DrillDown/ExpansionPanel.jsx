export default function ExpansionPanel({ open, children }) {
  return (
    <div className={`expansion-panel ${open ? 'open' : ''}`}>
      <div
        className="expansion-content"
        style={{
          opacity: open ? 1 : 0,
          transition: 'opacity 200ms ease-in-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}
