import { useState } from 'react';
import { fonts } from '../../theme';

export default function Tooltip({ text, children }) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPos({ x: rect.left + rect.width / 2, y: rect.top });
    setShow(true);
  };

  return (
    <span
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setShow(false)}
      style={{ display: 'contents' }}
    >
      {children}
      {show && text && (
        <span style={{
          position: 'fixed',
          left: pos.x,
          top: pos.y - 8,
          transform: 'translate(-50%, -100%)',
          backgroundColor: 'rgba(0,0,0,0.85)',
          color: '#fff',
          fontFamily: fonts.body,
          fontSize: 12,
          padding: '6px 10px',
          borderRadius: 4,
          whiteSpace: 'nowrap',
          zIndex: 9999,
          pointerEvents: 'none',
          maxWidth: 320,
          display: 'block',
        }}>
          {text}
        </span>
      )}
    </span>
  );
}
