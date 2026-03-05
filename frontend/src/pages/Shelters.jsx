// pages/Shelters.jsx
import { useState, useEffect } from 'react';
import { shelterAPI } from '../utils/api';

const SUPPLY_ICONS = {
  Food: '🍱', Water: '💧', Medicine: '💊', 'Medical Aid': '🏥',
  Blankets: '🛏️', Masks: '😷', 'First Aid': '🩹', Generator: '⚡',
  Shelter: '🏕️'
};

export default function Shelters() {
  const [shelters, setShelters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [userLoc, setUserLoc] = useState(null);
  const [sortBy, setSortBy] = useState('name');

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(pos => {
      setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    });
    const load = async () => {
      try {
        const res = await shelterAPI.getAll();
        setShelters(res.data || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const haversine = (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const filtered = shelters
    .filter(s => s.name?.toLowerCase().includes(search.toLowerCase()) || s.type?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'distance' && userLoc) {
        return haversine(userLoc.lat, userLoc.lng, a.lat, a.lng) - haversine(userLoc.lat, userLoc.lng, b.lat, b.lng);
      }
      if (sortBy === 'capacity') return (b.capacity - b.current_occupancy) - (a.capacity - a.current_occupancy);
      return a.name?.localeCompare(b.name);
    });

  const getOccupancyColor = (current, capacity) => {
    const pct = current / capacity;
    if (pct > 0.8) return '#ff2d2d';
    if (pct > 0.5) return '#ffc800';
    return '#00e676';
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="section-title" style={{ fontSize: '1.8rem' }}>🏥 Safe Shelters & Evacuation Centers</h1>
        <p style={{ color: '#7ba3c8', fontSize: '0.9rem' }}>
          {loading ? 'Loading...' : `${filtered.length} shelters available across India`}
        </p>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input
          className="form-input"
          style={{ flex: 1, minWidth: '200px' }}
          placeholder="🔍 Search shelters..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="form-select" style={{ width: '180px' }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="name">Sort: Name</option>
          <option value="distance">Sort: Distance</option>
          <option value="capacity">Sort: Availability</option>
        </select>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div className="spinner" style={{ width: '56px', height: '56px', borderWidth: '4px' }} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
          {filtered.map((shelter, i) => {
            const occupancyPct = Math.round(((shelter.current_occupancy || 0) / shelter.capacity) * 100);
            const occupancyColor = getOccupancyColor(shelter.current_occupancy || 0, shelter.capacity);
            const available = shelter.capacity - (shelter.current_occupancy || 0);
            const distance = userLoc
              ? haversine(userLoc.lat, userLoc.lng, parseFloat(shelter.lat), parseFloat(shelter.lng)).toFixed(0)
              : null;

            return (
              <div key={shelter.id || i} className="card" style={{
                animation: `fadeIn 0.3s ease ${i * 0.08}s both`,
                borderColor: 'rgba(0,230,118,0.2)',
                background: 'linear-gradient(135deg, #0f2340, rgba(0,230,118,0.03))'
              }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '8px',
                      background: 'rgba(0,230,118,0.1)',
                      border: '1px solid rgba(0,230,118,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.2rem', flexShrink: 0
                    }}>🏥</div>
                    <div>
                      <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#e8f4ff' }}>
                        {shelter.name}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#00e676', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        {shelter.type}
                      </div>
                    </div>
                  </div>
                  {distance && (
                    <div style={{
                      padding: '0.2rem 0.5rem',
                      background: 'rgba(0,180,255,0.1)',
                      border: '1px solid rgba(0,180,255,0.3)',
                      borderRadius: '4px',
                      fontSize: '0.7rem', color: '#00b4ff', fontWeight: 700
                    }}>
                      {parseInt(distance) < 1000 ? `${distance} km` : `${(distance/1).toFixed(0)} km`}
                    </div>
                  )}
                </div>

                {/* Capacity bar */}
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#7ba3c8' }}>Occupancy</span>
                    <span style={{ fontSize: '0.75rem', color: occupancyColor, fontWeight: 700 }}>
                      {shelter.current_occupancy || 0}/{shelter.capacity} ({occupancyPct}%)
                    </span>
                  </div>
                  <div style={{ height: '6px', background: '#1a3355', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${occupancyPct}%`,
                      background: occupancyColor,
                      borderRadius: '3px',
                      transition: 'width 0.6s ease'
                    }} />
                  </div>
                  <div style={{ fontSize: '0.7rem', color: occupancyColor, marginTop: '0.2rem', fontWeight: 600 }}>
                    {available > 0 ? `✅ ${available} spots available` : '⛔ At full capacity'}
                  </div>
                </div>

                <div className="divider" />

                {/* Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.8rem', color: '#7ba3c8' }}>
                    👤 <span style={{ color: '#e8f4ff' }}>{shelter.contact_person}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#7ba3c8' }}>
                    📞 <a href={`tel:${shelter.contact}`} style={{ color: '#00b4ff', textDecoration: 'none' }}>{shelter.contact}</a>
                  </div>
                </div>

                {/* Supplies */}
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#7ba3c8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Available Supplies
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                    {(shelter.supplies || []).map(s => (
                      <span key={s} style={{
                        padding: '0.2rem 0.5rem',
                        background: 'rgba(0,230,118,0.08)',
                        border: '1px solid rgba(0,230,118,0.2)',
                        borderRadius: '3px',
                        fontSize: '0.72rem',
                        color: '#00e676'
                      }}>
                        {SUPPLY_ICONS[s] || '📦'} {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: '0.75rem' }}>
                  <button
                    className="btn btn-success btn-sm"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => window.open(`https://maps.google.com?q=${shelter.lat},${shelter.lng}`, '_blank')}
                  >
                    🗺️ Get Directions
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#7ba3c8' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏥</div>
          <div>No shelters found matching your search.</div>
        </div>
      )}
    </div>
  );
}
