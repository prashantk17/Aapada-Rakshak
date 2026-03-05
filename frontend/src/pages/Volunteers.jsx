// pages/Volunteers.jsx
import { useState, useEffect } from 'react';
import { volunteerAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const SKILL_ICONS = {
  'First Aid': '🩹', 'Search & Rescue': '🔍', Medical: '💊',
  'Food Distribution': '🍱', Rescue: '⛑️', Communication: '📡',
  Counseling: '🤝', Evacuation: '🚌', Logistics: '📦'
};

export default function Volunteers() {
  const { user, userRole } = useAuth();
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({
    name: '', contact: '', skills: [], supplies: [], lat: '', lng: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const SKILLS = ['First Aid', 'Search & Rescue', 'Medical', 'Food Distribution', 'Rescue', 'Communication', 'Counseling', 'Evacuation', 'Logistics'];

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(pos => {
      setForm(f => ({ ...f, lat: pos.coords.latitude.toString(), lng: pos.coords.longitude.toString() }));
    });
    const load = async () => {
      try {
        const res = await volunteerAPI.getAll();
        setVolunteers(res.data || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const filtered = filter === 'available'
    ? volunteers.filter(v => v.availability)
    : volunteers;

  const toggleSkill = (skill) => {
    setForm(f => ({
      ...f,
      skills: f.skills.includes(skill)
        ? f.skills.filter(s => s !== skill)
        : [...f.skills, skill]
    }));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.contact) return;
    setSubmitting(true);
    try {
      const res = await volunteerAPI.register({ ...form, user_id: user?.uid });
      setVolunteers(v => [res.data, ...v]);
      setSubmitted(true);
      setShowForm(false);
      setForm({ name: '', contact: '', skills: [], supplies: [], lat: '', lng: '' });
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="section-title" style={{ fontSize: '1.8rem' }}>🙋 Volunteer Network</h1>
          <p style={{ color: '#7ba3c8', fontSize: '0.9rem' }}>{volunteers.length} volunteers registered nationwide</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <select className="form-select" style={{ width: '160px' }} value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">All Volunteers</option>
            <option value="available">Available Only</option>
          </select>
          {submitted && (
            <div style={{ padding: '0.5rem 1rem', background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.3)', borderRadius: '4px', fontSize: '0.8rem', color: '#00e676' }}>
              ✅ Registered!
            </div>
          )}
          <button className="btn btn-success" onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕ Cancel' : '+ Register as Volunteer'}
          </button>
        </div>
      </div>

      {/* Register Form */}
      {showForm && (
        <div className="card card-glow-green" style={{ marginBottom: '1.5rem', animation: 'fadeIn 0.3s ease' }}>
          <h3 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '1.1rem', marginBottom: '1rem', color: '#00e676' }}>
            Register as Volunteer
          </h3>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-input" placeholder="Your name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Contact Number *</label>
              <input className="form-input" placeholder="+91-XXXXXXXXXX" value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Skills</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {SKILLS.map(skill => (
                <button
                  key={skill}
                  onClick={() => toggleSkill(skill)}
                  style={{
                    padding: '0.3rem 0.7rem',
                    fontSize: '0.78rem',
                    borderRadius: '3px',
                    border: '1px solid',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: form.skills.includes(skill) ? 'rgba(0,230,118,0.15)' : 'transparent',
                    borderColor: form.skills.includes(skill) ? '#00e676' : '#1a3355',
                    color: form.skills.includes(skill) ? '#00e676' : '#7ba3c8'
                  }}
                >
                  {SKILL_ICONS[skill] || '🔧'} {skill}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Available Supplies (comma separated)</label>
            <input className="form-input" placeholder="e.g. First Aid Kit, Food Packets, Rope"
              onChange={e => setForm(f => ({ ...f, supplies: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))} />
          </div>

          <button className="btn btn-success" onClick={handleSubmit} disabled={submitting || !form.name || !form.contact}>
            {submitting ? '⏳ Registering...' : '✅ Register as Volunteer'}
          </button>
        </div>
      )}

      {/* Volunteer Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div className="spinner" style={{ width: '56px', height: '56px', borderWidth: '4px' }} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {filtered.map((vol, i) => (
            <div key={vol.id || i} className="card" style={{
              animation: `fadeIn 0.3s ease ${i * 0.08}s both`,
              borderColor: vol.availability ? 'rgba(0,230,118,0.2)' : 'rgba(255,255,255,0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0,
                  background: `linear-gradient(135deg, #${Math.floor(Math.random() * 8 + 1)}${Math.floor(Math.random() * 8 + 1)}${Math.floor(Math.random() * 8 + 1)}880, #0066cc)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.2rem', fontWeight: 700, color: 'white',
                  fontFamily: 'Rajdhani, sans-serif'
                }}>
                  {vol.name?.[0]?.toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '1rem' }}>{vol.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                    <div style={{
                      width: '7px', height: '7px', borderRadius: '50%',
                      background: vol.availability ? '#00e676' : '#ff2d2d',
                      boxShadow: vol.availability ? '0 0 6px #00e676' : 'none'
                    }} />
                    <span style={{ fontSize: '0.75rem', color: vol.availability ? '#00e676' : '#ff2d2d', fontWeight: 600 }}>
                      {vol.availability ? 'Available' : 'Busy'}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#3d6080' }}>
                      ⭐ {vol.rating} · {vol.missions_completed} missions
                    </span>
                  </div>
                </div>
              </div>

              {/* Skills */}
              {vol.skills?.length > 0 && (
                <div style={{ marginBottom: '0.6rem' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                    {vol.skills.map(s => (
                      <span key={s} style={{
                        padding: '0.15rem 0.45rem',
                        background: 'rgba(0,180,255,0.08)',
                        border: '1px solid rgba(0,180,255,0.2)',
                        borderRadius: '3px',
                        fontSize: '0.7rem', color: '#00b4ff'
                      }}>
                        {SKILL_ICONS[s] || '🔧'} {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Supplies */}
              {vol.supplies?.length > 0 && (
                <div style={{ fontSize: '0.78rem', color: '#7ba3c8', marginBottom: '0.6rem' }}>
                  🎒 {vol.supplies.join(', ')}
                </div>
              )}

              <div className="divider" />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <a href={`tel:${vol.contact}`} style={{ fontSize: '0.8rem', color: '#00b4ff', textDecoration: 'none' }}>
                  📞 {vol.contact}
                </a>
                {vol.availability && (
                  <button className="btn btn-success btn-sm">
                    Contact
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Leaderboard */}
      <div style={{ marginTop: '2rem' }}>
        <h2 className="section-title">🏆 Volunteer Leaderboard</h2>
        <div className="card">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1a3355' }}>
                {['Rank', 'Volunteer', 'Missions', 'Rating', 'Status'].map(h => (
                  <th key={h} style={{
                    padding: '0.6rem 0.75rem', textAlign: 'left',
                    fontSize: '0.75rem', color: '#7ba3c8',
                    fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
                    letterSpacing: '0.08em', textTransform: 'uppercase'
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...volunteers]
                .sort((a, b) => (b.missions_completed || 0) - (a.missions_completed || 0))
                .slice(0, 5)
                .map((vol, i) => (
                  <tr key={vol.id} style={{ borderBottom: '1px solid #0d1b2e' }}>
                    <td style={{ padding: '0.6rem 0.75rem' }}>
                      <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 900, fontSize: '1rem', color: ['#ffd700', '#c0c0c0', '#cd7f32'][i] || '#7ba3c8' }}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                      </span>
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700 }}>{vol.name}</td>
                    <td style={{ padding: '0.6rem 0.75rem', color: '#00b4ff', fontWeight: 700 }}>{vol.missions_completed || 0}</td>
                    <td style={{ padding: '0.6rem 0.75rem', color: '#ffc800' }}>⭐ {vol.rating}</td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>
                      <span style={{ color: vol.availability ? '#00e676' : '#ff2d2d', fontSize: '0.8rem', fontWeight: 600 }}>
                        {vol.availability ? '✅ Active' : '⏸️ Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}