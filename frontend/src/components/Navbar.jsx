// components/Navbar.jsx
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, userRole, logout } = useAuth();
  console.log("ROLE:", userRole);
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/map', label: 'Disaster Map', icon: '🗺️' },
    { path: '/shelters', label: 'Shelters', icon: '🏥' },
    { path: '/volunteers', label: 'Volunteers', icon: '🙋' },
    { path: '/relief-feed', label: 'Relief Feed', icon: '📢' },
    ...(user ? [{ path: '/dashboard', label: 'My Panel', icon: '👤' }] : []),
    ...(userRole === 'admin' ? [{ path: '/admin', label: 'Admin', icon: '⚙️' }] : []),
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const roleColors = { admin: '#ff2d2d', volunteer: '#00e676', citizen: '#00b4ff' };

  return (
    <nav style={{
      background: 'rgba(6, 13, 26, 0.95)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid #1a3355',
      position: 'fixed',
      top: 0, left: 0, right: 0,
      zIndex: 1000,
      height: '60px',
      display: 'flex',
      alignItems: 'center',
      padding: '0 1.5rem',
      gap: '1.5rem'
    }}>
      {/* Logo */}
      <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <div style={{
          width: '32px', height: '32px',
          background: 'linear-gradient(135deg, #cc0000, #ff2d2d)',
          borderRadius: '6px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1rem', boxShadow: '0 0 12px rgba(255,45,45,0.4)'
        }}>🛡️</div>
        <div>
          <div style={{
            fontFamily: 'Rajdhani, sans-serif',
            fontWeight: 700,
            fontSize: '1.1rem',
            letterSpacing: '0.08em',
            color: '#e8f4ff',
            lineHeight: 1.1
          }}>AAPADA RAKSHAK</div>
          <div style={{ fontSize: '0.6rem', color: '#7ba3c8', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Disaster Management
          </div>
        </div>
      </Link>

      {/* Nav links */}
      <div style={{ display: 'flex', gap: '0.25rem', flex: 1, overflowX: 'auto' }}>
        {navLinks.map(link => (
          <Link
            key={link.path}
            to={link.path}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.4rem 0.8rem',
              borderRadius: '4px',
              textDecoration: 'none',
              fontSize: '0.8rem',
              fontFamily: 'Rajdhani, sans-serif',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              background: location.pathname === link.path ? 'rgba(0, 180, 255, 0.15)' : 'transparent',
              color: location.pathname === link.path ? '#00b4ff' : '#7ba3c8',
              borderBottom: location.pathname === link.path ? '2px solid #00b4ff' : '2px solid transparent',
              transition: 'all 0.2s'
            }}
          >
            <span>{link.icon}</span>
            <span>{link.label}</span>
          </Link>
        ))}
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Live indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: '#00e676',
            boxShadow: '0 0 6px rgba(0,230,118,0.6)',
            animation: 'pulse-green 2s infinite'
          }} />
          <span style={{ fontSize: '0.7rem', color: '#00e676', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, letterSpacing: '0.08em' }}>LIVE</span>
        </div>

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.3rem 0.75rem',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '4px',
              border: '1px solid #1a3355'
            }}>
              <div style={{
                width: '22px', height: '22px', borderRadius: '50%',
                background: `linear-gradient(135deg, ${roleColors[userRole]}, #0066cc)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.65rem', fontWeight: 700
              }}>
                {(user.displayName || user.email || '?')[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#e8f4ff', fontWeight: 600, lineHeight: 1.2 }}>
                  {user.displayName || user.email?.split('@')[0] || 'User'}
                </div>
                <div style={{ fontSize: '0.6rem', color: roleColors[userRole], textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {userRole}
                </div>
              </div>
            </div>
            <button onClick={handleLogout} className="btn btn-outline btn-sm" style={{ fontSize: '0.75rem' }}>
              Logout
            </button>
          </div>
        ) : (
          <Link to="/login" className="btn btn-primary btn-sm">Login</Link>
        )}
      </div>
    </nav>
  );
}