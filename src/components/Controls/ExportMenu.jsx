import { useState, useRef, useEffect } from 'react';
import { colors, fonts } from '../../theme';

export default function ExportMenu({ onExportCSV, onExportStudentCSV, onPrint, hasDrillData }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={menuRef} data-print-hide style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          fontFamily: fonts.body,
          fontSize: 13,
          fontWeight: 500,
          color: colors.purple,
          border: `1px solid ${colors.purple}`,
          borderRadius: 6,
          padding: '6px 14px',
          backgroundColor: open ? 'rgba(116, 119, 184, 0.08)' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          whiteSpace: 'nowrap',
          transition: 'background-color 150ms',
        }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(116, 119, 184, 0.08)'; }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.backgroundColor = 'transparent'; }}
      >
        Export
        <span style={{ fontSize: 10 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: 4,
          backgroundColor: colors.white,
          border: `1px solid ${colors.border}`,
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
          minWidth: 200,
          zIndex: 100,
          overflow: 'hidden',
        }}>
          <MenuItem
            label="Download Heat Map CSV"
            onClick={() => { onExportCSV(); setOpen(false); }}
          />
          {hasDrillData && (
            <MenuItem
              label="Download Student List CSV"
              onClick={() => { onExportStudentCSV(); setOpen(false); }}
            />
          )}
          <div style={{ borderTop: `1px solid ${colors.border}` }} />
          <MenuItem
            label="Print View"
            onClick={() => { onPrint(); setOpen(false); }}
          />
        </div>
      )}
    </div>
  );
}

function MenuItem({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        fontFamily: fonts.body,
        fontSize: 13,
        color: colors.navy,
        padding: '10px 16px',
        backgroundColor: 'transparent',
        transition: 'background-color 100ms',
      }}
      onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#F5F5F5'; }}
      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
    >
      {label}
    </button>
  );
}
