import { useEffect, useState } from 'react';

/**
 * Toast notification component.
 * Props:
 *   message  - string to display
 *   type     - 'success' | 'error'
 *   onClose  - callback when toast disappears
 *   duration - ms before auto-dismiss (default 3000)
 */
function Toast({ message, type = 'error', onClose, duration = 3000 }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!visible || !message) return null;

  const bgColor = type === 'success' ? '#4caf50' : '#f44336';

  return (
    <div
      style={{
        position: 'fixed',
        top: '1.5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: bgColor,
        color: '#fff',
        padding: '0.75rem 1.5rem',
        borderRadius: 6,
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        zIndex: 9999,
        fontSize: '0.95rem',
        maxWidth: 420,
        textAlign: 'center',
        animation: 'fadeInDown 0.3s ease',
      }}
    >
      {message}
      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default Toast;
