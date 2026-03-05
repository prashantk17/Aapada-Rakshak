// pages/Login.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { signIn, signUp, demoLogin } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'citizen' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await signIn(form.email, form.password);
      } else {
        await signUp(form.email, form.password, form.name, form.role);
      }
      navigate('/');
    } catch (e) {
      setError(e.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (role) => {
    demoLogin(role);
    navigate('/');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: '#060d1a'
    }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '64px', height: '64px',
            background: 'linear-gradient(135deg, #cc0000, #ff2d2d)',
            borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.8rem', margin: '0 auto 1rem',
            boxShadow: '0 0 24px rgba(255,45,45,0.4)'
          }}>🛡️</div>
          <h1 style={{
            fontFamily: 'Rajdhani, sans-serif',
            fontSize: '2rem', fontWeight: 700,
            letterSpacing: '0.1em',
            background: 'linear-gradient(135deg, #e8f4ff, #00b4ff)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>AAPADA RAKSHAK</h1>
          <p style={{ color: '#7ba3c8', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Real-time Disaster Management Platform
          </p>
        </div>

        {/* Mode toggle */}
        <div style={{ display: 'flex', background: '#0d1b2e', borderRadius: '6px', padding: '3px', marginBottom: '1.5rem', border: '1px solid #1a3355' }}>
          {['login', 'signup'].map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); }}
              style={{
                flex: 1, padding: '0.5rem',
                background: mode === m ? 'rgba(0,180,255,0.15)' : 'transparent',
                border: mode === m ? '1px solid rgba(0,180,255,0.3)' : '1px solid transparent',
                borderRadius: '4px',
                color: mode === m ? '#00b4ff' : '#7ba3c8',
                fontFamily: 'Rajdhani, sans-serif',
                fontWeight: 700, fontSize: '0.85rem',
                letterSpacing: '0.08em', textTransform: 'uppercase',
                cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              {m === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="card card-glow-blue" style={{ marginBottom: '1rem' }}>
          {mode === 'signup' && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" placeholder="Your name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-input" type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="••••••••" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
          </div>

          {mode === 'signup' && (
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-select" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                <option value="citizen">Citizen</option>
                <option value="volunteer">Volunteer</option>
                <option value="admin">Admin (requires approval)</option>
              </select>
            </div>
          )}

          {error && (
            <div style={{
              padding: '0.6rem 0.75rem',
              background: 'rgba(255,45,45,0.08)',
              border: '1px solid rgba(255,45,45,0.3)',
              borderRadius: '4px',
              fontSize: '0.8rem', color: '#ff6666',
              marginBottom: '1rem'
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={handleSubmit}
            disabled={loading || !form.email || !form.password}
          >
            {loading ? '⏳ Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </div>

        {/* Demo Login */}
        <div style={{
          padding: '1rem',
          background: '#0d1b2e',
          border: '1px solid #1a3355',
          borderRadius: '8px'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#7ba3c8', textAlign: 'center', marginBottom: '0.75rem', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            — Quick Demo Access —
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
            {[
              { role: 'citizen', label: 'Citizen', icon: '👤', color: '#00b4ff' },
              { role: 'volunteer', label: 'Volunteer', icon: '🙋', color: '#00e676' },
              { role: 'admin', label: 'Admin', icon: '⚙️', color: '#ff2d2d' },
            ].map(demo => (
              <button
                key={demo.role}
                onClick={() => handleDemoLogin(demo.role)}
                style={{
                  padding: '0.5rem',
                  background: `${demo.color}08`,
                  border: `1px solid ${demo.color}30`,
                  borderRadius: '6px',
                  color: demo.color,
                  cursor: 'pointer',
                  fontFamily: 'Rajdhani, sans-serif',
                  fontWeight: 700, fontSize: '0.8rem',
                  transition: 'all 0.2s',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem'
                }}
                onMouseEnter={e => e.currentTarget.style.background = `${demo.color}15`}
                onMouseLeave={e => e.currentTarget.style.background = `${demo.color}08`}
              >
                <span style={{ fontSize: '1.1rem' }}>{demo.icon}</span>
                <span>{demo.label}</span>
              </button>
            ))}
          </div>
          <p style={{ fontSize: '0.7rem', color: '#3d6080', textAlign: 'center', marginTop: '0.5rem' }}>
            No Firebase setup required for demo mode
          </p>
        </div>
      </div>
    </div>
  );
}