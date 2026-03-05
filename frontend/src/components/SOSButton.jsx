// components/SOSButton.jsx
import { useState } from 'react';
import { sosAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function SOSButton() {
  const { user } = useAuth();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSOS = async () => {
    if (!showConfirm) { setShowConfirm(true); return; }

    setSending(true);
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
          await sosAPI.send({
            user_id: user?.uid || 'anonymous',
            user_name: user?.displayName || 'Unknown',
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            message: 'Emergency help needed!'
          });
          setSent(true);
          // Vibrate if supported
          if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 400]);
          setTimeout(() => { setSent(false); setShowConfirm(false); }, 5000);
        }, async () => {
          await sosAPI.send({
            user_id: user?.uid || 'anonymous',
            user_name: user?.displayName || 'Unknown',
            lat: 0, lng: 0,
            message: 'Emergency help needed! (Location unavailable)'
          });
          setSent(true);
          setTimeout(() => { setSent(false); setShowConfirm(false); }, 5000);
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 1100 }}>
      {showConfirm && !sent && (
        <div style={{
          position: 'absolute',
          bottom: '100%', right: 0,
          marginBottom: '0.75rem',
          background: '#0f2340',
          border: '1px solid rgba(255,45,45,0.4)',
          borderRadius: '8px',
          padding: '1rem',
          width: '220px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
        }}>
          <p style={{ fontSize: '0.85rem', color: '#e8f4ff', marginBottom: '0.75rem', fontWeight: 600 }}>
            ⚠️ Send Emergency SOS?
          </p>
          <p style={{ fontSize: '0.75rem', color: '#7ba3c8', marginBottom: '1rem' }}>
            Your location will be shared with emergency responders.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleSOS}
              className="btn btn-danger btn-sm"
              style={{ flex: 1, justifyContent: 'center' }}
              disabled={sending}
            >
              {sending ? '...' : 'CONFIRM'}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="btn btn-outline btn-sm"
              style={{ flex: 1, justifyContent: 'center' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <button
        onClick={handleSOS}
        style={{
          width: '64px', height: '64px',
          borderRadius: '50%',
          background: sent
            ? 'linear-gradient(135deg, #00a855, #00e676)'
            : 'linear-gradient(135deg, #aa0000, #ff2d2d)',
          border: `3px solid ${sent ? '#00e676' : '#ff2d2d'}`,
          color: 'white',
          fontSize: sent ? '1.4rem' : '0.7rem',
          fontWeight: 900,
          fontFamily: 'Rajdhani, sans-serif',
          letterSpacing: '0.05em',
          cursor: 'pointer',
          boxShadow: sent
            ? '0 0 30px rgba(0,230,118,0.6)'
            : '0 0 30px rgba(255,45,45,0.6)',
          animation: sent ? 'none' : 'pulse-red 1.5s infinite',
          transition: 'all 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 1
        }}
        title="Emergency SOS"
      >
        {sent ? '✓' : (
          <>
            <span style={{ fontSize: '1.1rem' }}>🆘</span>
            <span style={{ fontSize: '0.6rem' }}>SOS</span>
          </>
        )}
      </button>
      {sent && (
        <div style={{
          position: 'absolute', bottom: '100%', right: 0,
          marginBottom: '0.5rem',
          background: 'rgba(0,230,118,0.1)',
          border: '1px solid rgba(0,230,118,0.4)',
          borderRadius: '6px',
          padding: '0.5rem 0.75rem',
          fontSize: '0.75rem',
          color: '#00e676',
          whiteSpace: 'nowrap',
          fontWeight: 600
        }}>
          ✅ SOS Sent! Help is coming.
        </div>
      )}
    </div>
  );
}