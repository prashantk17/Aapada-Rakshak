// pages/Home.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { disasterAPI, analyticsAPI } from '../utils/api';

const DISASTER_ICONS = {
  Landslide: '🏔️', Flood: '🌊', Earthquake: '🌍', Fire: '🔥', Storm: '⛈️'
};

const SEVERITY_COLOR = {
  High: '#ff2d2d', Medium: '#ffc800', Low: '#00b4ff'
};

export default function Home() {
  const [disasters, setDisasters] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const [dRes, aRes] = await Promise.all([
          disasterAPI.getAll(),
          analyticsAPI.get()
        ]);
        setDisasters(dRes.data?.slice(0, 4) || []);
        setAnalytics(aRes.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const stats = [
    { label: 'Active Disasters', value: analytics?.total_disasters || 6, icon: '⚠️', color: '#ff2d2d' },
    { label: 'Volunteers', value: analytics?.total_volunteers || 4, icon: '🙋', color: '#00e676' },
    { label: 'Shelters Active', value: analytics?.total_shelters || 5, icon: '🏥', color: '#00b4ff' },
    { label: 'SOS Today', value: analytics?.sos_alerts_today || 3, icon: '🆘', color: '#ffc800' },
  ];

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>

      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0d1b2e 0%, #0f2340 50%, #0d1b2e 100%)',
        border: '1px solid #1a3355',
        borderRadius: '12px',
        padding: '2.5rem',
        marginBottom: '1.5rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background pattern */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle at 70% 50%, rgba(0,60,120,0.2) 0%, transparent 60%)',
          pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              background: 'rgba(255,45,45,0.1)',
              border: '1px solid rgba(255,45,45,0.3)',
              borderRadius: '4px', padding: '0.3rem 0.75rem',
              marginBottom: '1rem'
            }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff2d2d', animation: 'pulse-red 1.5s infinite' }} />
              <span style={{ fontSize: '0.75rem', color: '#ff2d2d', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: '0.1em' }}>
                SYSTEM ACTIVE — REAL-TIME MONITORING
              </span>
            </div>

            <h1 style={{
              fontFamily: 'Rajdhani, sans-serif',
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              fontWeight: 700,
              letterSpacing: '0.06em',
              lineHeight: 1.1,
              marginBottom: '0.75rem',
              background: 'linear-gradient(135deg, #e8f4ff, #00b4ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              AAPADA RAKSHAK
            </h1>
            <p style={{ color: '#7ba3c8', fontSize: '1rem', maxWidth: '500px', lineHeight: 1.6 }}>
              Real-time disaster alert and coordination platform for India. Stay informed, stay safe.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
              <Link to="/map" className="btn btn-primary">🗺️ View Live Map</Link>
              <Link to="/shelters" className="btn btn-success">🏥 Find Shelters</Link>
              <Link to="/volunteers" className="btn btn-outline">🙋 Be a Volunteer</Link>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '2rem',
              fontWeight: 500,
              color: '#00b4ff',
              letterSpacing: '0.05em'
            }}>
              {time.toLocaleTimeString('en-IN', { hour12: false })}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#7ba3c8', marginTop: '0.25rem' }}>
              {time.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <div style={{
              marginTop: '0.75rem',
              padding: '0.5rem 1rem',
              background: 'rgba(0,230,118,0.1)',
              border: '1px solid rgba(0,230,118,0.3)',
              borderRadius: '4px',
              fontSize: '0.8rem', color: '#00e676',
              fontFamily: 'Rajdhani, sans-serif',
              fontWeight: 600
            }}>
              🟢 All Systems Operational
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        {stats.map((stat, i) => (
          <div key={i} className="card" style={{
            display: 'flex', alignItems: 'center', gap: '1rem',
            borderColor: `${stat.color}30`,
            background: `linear-gradient(135deg, #0f2340, rgba(${stat.color === '#ff2d2d' ? '255,45,45' : stat.color === '#00e676' ? '0,230,118' : stat.color === '#00b4ff' ? '0,180,255' : '255,200,0'}, 0.05) 100%)`
          }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '8px',
              background: `${stat.color}15`,
              border: `1px solid ${stat.color}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.4rem', flexShrink: 0
            }}>{stat.icon}</div>
            <div>
              <div style={{
                fontFamily: 'Rajdhani, sans-serif',
                fontSize: '1.8rem',
                fontWeight: 700,
                color: stat.color,
                lineHeight: 1
              }}>{loading ? '...' : stat.value}</div>
              <div style={{ fontSize: '0.75rem', color: '#7ba3c8', marginTop: '0.2rem' }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

        {/* Active Disasters */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 className="section-title" style={{ margin: 0 }}>Active Alerts</h2>
            <Link to="/map" style={{ fontSize: '0.75rem', color: '#00b4ff', textDecoration: 'none' }}>View All →</Link>
          </div>
          {loading ? (
            <div className="spinner" style={{ margin: '2rem auto' }} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {disasters.map((d, i) => (
                <div key={d.id || i} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.75rem',
                  background: '#0d1b2e',
                  border: `1px solid ${SEVERITY_COLOR[d.severity] || '#1a3355'}30`,
                  borderRadius: '6px',
                  animation: `fadeIn 0.3s ease ${i * 0.1}s both`
                }}>
                  <div style={{ fontSize: '1.5rem' }}>{DISASTER_ICONS[d.type] || '⚠️'}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                      <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '0.95rem' }}>{d.type}</span>
                      <span className={`badge badge-${d.severity?.toLowerCase()}`}>{d.severity}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#7ba3c8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {d.location_name || `${d.lat?.toFixed(2)}, ${d.lng?.toFixed(2)}`}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#3d6080', flexShrink: 0 }}>
                    {new Date(d.timestamp).toLocaleDateString('en-IN')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="section-title">Quick Actions</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {[
              { icon: '🗺️', label: 'Live Map', desc: 'View all active disasters', path: '/map', color: '#00b4ff' },
              { icon: '🏥', label: 'Find Shelter', desc: 'Nearest safe locations', path: '/shelters', color: '#00e676' },
              { icon: '🙋', label: 'Volunteer', desc: 'Register & help others', path: '/volunteers', color: '#ffc800' },
              { icon: '📢', label: 'Relief Feed', desc: 'Community updates', path: '/relief-feed', color: '#cc66ff' },
              { icon: '🤖', label: 'Risk Check', desc: 'AI prediction tool', path: '/map?tab=predict', color: '#ff7d00' },
              { icon: '📊', label: 'History', desc: 'Past disaster records', path: '/admin?tab=history', color: '#7ba3c8' },
            ].map((action, i) => (
              <Link
                key={i}
                to={action.path}
                style={{
                  display: 'block',
                  padding: '1rem',
                  background: '#0f2340',
                  border: `1px solid ${action.color}20`,
                  borderRadius: '8px',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  animation: `fadeIn 0.3s ease ${i * 0.1}s both`
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = `${action.color}50`;
                  e.currentTarget.style.background = `${action.color}08`;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = `${action.color}20`;
                  e.currentTarget.style.background = '#0f2340';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>{action.icon}</div>
                <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: action.color, marginBottom: '0.2rem' }}>
                  {action.label}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#7ba3c8' }}>{action.desc}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div style={{
        marginTop: '1.5rem',
        padding: '1rem 1.5rem',
        background: 'rgba(0, 180, 255, 0.05)',
        border: '1px solid rgba(0, 180, 255, 0.2)',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        flexWrap: 'wrap'
      }}>
        <div style={{ fontSize: '1.5rem' }}>ℹ️</div>
        <div>
          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, marginBottom: '0.2rem' }}>
            How Aapada Rakshak Works
          </div>
          <div style={{ fontSize: '0.8rem', color: '#7ba3c8' }}>
            Our system uses real-time data, ML-based risk prediction, and community coordination to provide comprehensive disaster management. Alerts are issued based on geolocation proximity. Register as a volunteer to help your community.
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginLeft: 'auto' }}>
          <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', background: 'rgba(255,45,45,0.1)', border: '1px solid rgba(255,45,45,0.3)', borderRadius: '3px', color: '#ff2d2d' }}>🔴 High Risk</span>
          <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', background: 'rgba(255,200,0,0.1)', border: '1px solid rgba(255,200,0,0.3)', borderRadius: '3px', color: '#ffc800' }}>🟡 Medium</span>
          <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', background: 'rgba(0,180,255,0.1)', border: '1px solid rgba(0,180,255,0.3)', borderRadius: '3px', color: '#00b4ff' }}>🔵 Low Risk</span>
          <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.3)', borderRadius: '3px', color: '#00e676' }}>🟢 Safe Zone</span>
        </div>
      </div>
    </div>
  );
}