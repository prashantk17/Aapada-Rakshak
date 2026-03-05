// components/AlertPopup.jsx
import { useState, useEffect } from 'react';

export default function AlertPopup({ alerts, onDismiss }) {
  const [visible, setVisible] = useState(true);
  const [current, setCurrent] = useState(0);

  if (!alerts?.length || !visible) return null;

  const alert = alerts[current];
  const severityColor = {
    High: '#ff2d2d', Medium: '#ffc800', Low: '#00b4ff'
  }[alert.severity] || '#ffc800';

  return (
    <div style={{
      position: 'fixed',
      top: '70px', right: '1rem',
      zIndex: 1200,
      width: '340px',
      animation: 'fadeIn 0.3s ease'
    }}>
      <div style={{
        background: '#0f2340',
        border: `1px solid ${severityColor}40`,
        borderLeft: `4px solid ${severityColor}`,
        borderRadius: '8px',
        padding: '1rem',
        boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 20px ${severityColor}20`
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              background: `${severityColor}20`,
              border: `1px solid ${severityColor}40`,
              borderRadius: '4px',
              padding: '0.2rem 0.5rem',
              fontSize: '0.7rem',
              fontWeight: 700,
              color: severityColor,
              fontFamily: 'Rajdhani, sans-serif',
              letterSpacing: '0.1em',
              textTransform: 'uppercase'
            }}>
              ⚠️ {alert.severity} ALERT
            </div>
          </div>
          <button
            onClick={() => { setVisible(false); onDismiss?.(); }}
            style={{
              background: 'none', border: 'none',
              color: '#7ba3c8', cursor: 'pointer',
              fontSize: '1rem', lineHeight: 1
            }}
          >✕</button>
        </div>

        <div style={{
          fontFamily: 'Rajdhani, sans-serif',
          fontSize: '1rem',
          fontWeight: 700,
          color: '#e8f4ff',
          marginBottom: '0.4rem'
        }}>
          {alert.type} — {alert.location_name || 'Your Area'}
        </div>

        <p style={{ fontSize: '0.8rem', color: '#7ba3c8', marginBottom: '0.75rem', lineHeight: 1.5 }}>
          {alert.description}
        </p>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => window.location.href = '/map'}
            className="btn btn-primary btn-sm"
            style={{ flex: 1, justifyContent: 'center' }}
          >
            View Map
          </button>
          <button
            onClick={() => window.location.href = '/shelters'}
            className="btn btn-success btn-sm"
            style={{ flex: 1, justifyContent: 'center' }}
          >
            Find Shelter
          </button>
        </div>

        {alerts.length > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.3rem', marginTop: '0.75rem' }}>
            {alerts.map((_, i) => (
              <div
                key={i}
                onClick={() => setCurrent(i)}
                style={{
                  width: '6px', height: '6px',
                  borderRadius: '50%',
                  background: i === current ? severityColor : '#1a3355',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}