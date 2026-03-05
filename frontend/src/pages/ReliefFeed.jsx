// pages/ReliefFeed.jsx
import { useState, useEffect } from 'react';
import { reliefAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const SUPPLY_TYPES = ['Food', 'Medicine', 'Shelter', 'Water', 'Clothing', 'Other'];
const SUPPLY_COLORS = {
  Food: '#ffc800', Medicine: '#ff2d2d', Shelter: '#00b4ff',
  Water: '#00e5ff', Clothing: '#cc66ff', Other: '#7ba3c8'
};

function timeAgo(ts) {
  const diff = (Date.now() - new Date(ts)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function ReliefFeed() {
  const { user, userRole } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ volunteer_name: '', description: '', location_name: '', supply_type: 'Food', lat: '', lng: '' });
  const [submitting, setSubmitting] = useState(false);
  const [filterType, setFilterType] = useState('All');
  const [likes, setLikes] = useState({});

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(pos => {
      setForm(f => ({ ...f, lat: pos.coords.latitude.toString(), lng: pos.coords.longitude.toString() }));
    });
    if (user?.displayName) setForm(f => ({ ...f, volunteer_name: user.displayName }));
    const load = async () => {
      try {
        const res = await reliefAPI.getPosts();
        setPosts(res.data || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [user]);

  const handleSubmit = async () => {
    if (!form.volunteer_name || !form.description) return;
    setSubmitting(true);
    try {
      const res = await reliefAPI.createPost({ ...form, volunteer_id: user?.uid });
      setPosts(p => [res.data, ...p]);
      setShowForm(false);
      setForm(f => ({ ...f, description: '', location_name: '' }));
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  const toggleLike = (id) => {
    setLikes(l => ({ ...l, [id]: !l[id] }));
  };

  const filtered = filterType === 'All' ? posts : posts.filter(p => p.supply_type === filterType);

  return (
    <div style={{ padding: '1.5rem', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="section-title" style={{ fontSize: '1.8rem' }}>📢 Relief Feed</h1>
          <p style={{ color: '#7ba3c8', fontSize: '0.9rem' }}>Community relief updates from volunteers on the ground</p>
        </div>
        {(userRole === 'volunteer' || userRole === 'admin') && (
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕ Cancel' : '+ Post Update'}
          </button>
        )}
      </div>

      {/* Post form */}
      {showForm && (
        <div className="card card-glow-blue" style={{ marginBottom: '1.5rem', animation: 'fadeIn 0.3s ease' }}>
          <h3 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, marginBottom: '1rem', color: '#00b4ff' }}>Post Relief Update</h3>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Your Name</label>
              <input className="form-input" value={form.volunteer_name} onChange={e => setForm(f => ({ ...f, volunteer_name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Supply Type</label>
              <select className="form-select" value={form.supply_type} onChange={e => setForm(f => ({ ...f, supply_type: e.target.value }))}>
                {SUPPLY_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Location</label>
            <input className="form-input" placeholder="e.g. Sector 4, Shimla" value={form.location_name} onChange={e => setForm(f => ({ ...f, location_name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Update Description *</label>
            <textarea className="form-textarea" placeholder="Describe what relief is available, what's needed, or route information..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ minHeight: '100px' }} />
          </div>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting || !form.description}>
            {submitting ? '⏳ Posting...' : '📢 Post Update'}
          </button>
        </div>
      )}

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        {['All', ...SUPPLY_TYPES].map(type => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            style={{
              padding: '0.3rem 0.75rem',
              fontSize: '0.78rem',
              fontFamily: 'Rajdhani, sans-serif',
              fontWeight: 700, letterSpacing: '0.06em',
              borderRadius: '20px',
              border: '1px solid',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: filterType === type ? `${SUPPLY_COLORS[type] || '#00b4ff'}15` : 'transparent',
              borderColor: filterType === type ? (SUPPLY_COLORS[type] || '#00b4ff') : '#1a3355',
              color: filterType === type ? (SUPPLY_COLORS[type] || '#00b4ff') : '#7ba3c8'
            }}
          >
            {type}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div className="spinner" style={{ width: '56px', height: '56px', borderWidth: '4px' }} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map((post, i) => {
            const typeColor = SUPPLY_COLORS[post.supply_type] || '#7ba3c8';
            const isLiked = likes[post.id];
            return (
              <div key={post.id || i} className="card" style={{
                animation: `fadeIn 0.3s ease ${i * 0.08}s both`,
                borderColor: `${typeColor}20`
              }}>
                {/* Post header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      background: `linear-gradient(135deg, ${typeColor}, #0066cc)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.9rem', fontWeight: 700, color: 'white',
                      fontFamily: 'Rajdhani, sans-serif'
                    }}>
                      {post.volunteer_name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '0.95rem' }}>
                        {post.volunteer_name}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#7ba3c8' }}>
                        {post.location_name && <span>📍 {post.location_name} · </span>}
                        {timeAgo(post.timestamp)}
                      </div>
                    </div>
                  </div>
                  <span style={{
                    padding: '0.2rem 0.6rem',
                    background: `${typeColor}15`,
                    border: `1px solid ${typeColor}30`,
                    borderRadius: '20px',
                    fontSize: '0.72rem',
                    color: typeColor,
                    fontFamily: 'Rajdhani, sans-serif',
                    fontWeight: 700
                  }}>
                    {post.supply_type}
                  </span>
                </div>

                {/* Post content */}
                <p style={{ fontSize: '0.88rem', color: '#e8f4ff', lineHeight: 1.6, marginBottom: '0.75rem' }}>
                  {post.description}
                </p>

                {/* Post footer */}
                <div className="divider" />
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingTop: '0.4rem' }}>
                  <button
                    onClick={() => toggleLike(post.id)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '0.35rem',
                      fontSize: '0.8rem',
                      color: isLiked ? '#ff6680' : '#7ba3c8',
                      transition: 'color 0.2s'
                    }}
                  >
                    {isLiked ? '❤️' : '🤍'} {(post.likes || 0) + (isLiked ? 1 : 0)}
                  </button>
                  <span style={{ fontSize: '0.75rem', color: '#3d6080' }}>
                    💬 Share this update
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#7ba3c8' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📢</div>
          <div>No relief posts yet. Be the first to share an update!</div>
        </div>
      )}
    </div>
  );
}