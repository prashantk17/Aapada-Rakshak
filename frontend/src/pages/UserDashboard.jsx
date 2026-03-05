// pages/UserDashboard.jsx — Citizen Panel
// Full-featured dashboard for citizens: alerts, nearby shelters, nearby volunteers,
// help request, safety checklist, disaster awareness, profile management

import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { disasterAPI, shelterAPI, volunteerAPI, sosAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function timeAgo(ts) {
  const diff = (Date.now() - new Date(ts)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const DISASTER_ICONS = { Landslide: '🏔️', Flood: '🌊', Earthquake: '🌍', Fire: '🔥', Storm: '⛈️' };
const SEVERITY_COLOR = { High: '#ff2d2d', Medium: '#ffc800', Low: '#00b4ff' };

const SAFETY_TIPS = {
  Landslide: ['Move away from slopes immediately', 'Avoid river channels', 'Listen for unusual sounds', 'Go to high ground', 'Do not cross flooded areas'],
  Flood: ['Move to higher ground', 'Avoid walking in moving water', 'Disconnect electrical appliances', 'Do not drive through floods', 'Keep emergency kit ready'],
  Earthquake: ['Drop, Cover, Hold On', 'Stay away from windows', 'If outside, avoid buildings', 'Do not use elevators', 'Check for gas leaks after'],
  Fire: ['Crawl low under smoke', 'Close doors to slow fire spread', 'Never use elevators', 'Meet at designated assembly point', 'Call 101 immediately'],
  Storm: ['Stay indoors', 'Stay away from windows', 'Unplug electrical appliances', 'Avoid flooded roads', 'Keep emergency supplies ready'],
};

const CHECKLIST_ITEMS = [
  { id: 'water', label: 'Store 3-day water supply (1 gallon/person/day)', icon: '💧' },
  { id: 'food', label: 'Non-perishable food supply for 3 days', icon: '🍱' },
  { id: 'flashlight', label: 'Flashlight with extra batteries', icon: '🔦' },
  { id: 'firstaid', label: 'First aid kit and medications', icon: '🩹' },
  { id: 'documents', label: 'Important documents in waterproof bag', icon: '📄' },
  { id: 'radio', label: 'Battery-powered emergency radio', icon: '📻' },
  { id: 'phone', label: 'Phone charger and power bank', icon: '🔋' },
  { id: 'cash', label: 'Emergency cash (ATMs may be down)', icon: '💵' },
  { id: 'clothes', label: 'Extra clothes and sturdy shoes', icon: '👕' },
  { id: 'whistle', label: 'Whistle to signal for help', icon: '🎵' },
];

const EMERGENCY_NUMBERS = [
  { name: 'National Emergency', number: '112', icon: '🚨', color: '#ff2d2d' },
  { name: 'Police', number: '100', icon: '👮', color: '#00b4ff' },
  { name: 'Fire Brigade', number: '101', icon: '🚒', color: '#ff7d00' },
  { name: 'Ambulance', number: '108', icon: '🚑', color: '#00e676' },
  { name: 'Disaster Helpline', number: '1078', icon: '🛡️', color: '#ffc800' },
  { name: 'Women Helpline', number: '1091', icon: '👩', color: '#cc66ff' },
];

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, color, sublabel }) {
  return (
    <div style={{
      background: '#0f2340',
      border: `1px solid ${color}25`,
      borderRadius: '10px',
      padding: '1rem 1.2rem',
      display: 'flex', alignItems: 'center', gap: '1rem'
    }}>
      <div style={{
        width: '48px', height: '48px', borderRadius: '10px', flexShrink: 0,
        background: `${color}15`, border: `1px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem'
      }}>{icon}</div>
      <div>
        <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1.7rem', fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '0.78rem', color: '#7ba3c8', marginTop: '0.15rem' }}>{label}</div>
        {sublabel && <div style={{ fontSize: '0.68rem', color: '#3d6080', marginTop: '0.1rem' }}>{sublabel}</div>}
      </div>
    </div>
  );
}

function SectionTitle({ children, icon }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.6rem',
      marginBottom: '1rem',
      borderLeft: '3px solid #00b4ff', paddingLeft: '0.75rem'
    }}>
      {icon && <span style={{ fontSize: '1.1rem' }}>{icon}</span>}
      <h2 style={{
        fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
        fontSize: '1.1rem', letterSpacing: '0.1em', textTransform: 'uppercase',
        color: '#e8f4ff', margin: 0
      }}>{children}</h2>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function UserDashboard() {
  const { user, userRole } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [location, setLocation] = useState(null);
  const [locationName, setLocationName] = useState('Detecting...');
  const [disasters, setDisasters] = useState([]);
  const [nearbyShelters, setNearbyShelters] = useState([]);
  const [nearbyVolunteers, setNearbyVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checklist, setChecklist] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ar_checklist') || '{}'); } catch { return {}; }
  });
  const [helpForm, setHelpForm] = useState({ type: 'Medical', description: '', urgency: 'High' });
  const [helpSent, setHelpSent] = useState(false);
  const [sendingHelp, setSendingHelp] = useState(false);
  const [activeTip, setActiveTip] = useState(null);
  const [profile, setProfile] = useState({
    bloodGroup: '', medicalConditions: '', emergencyContact: '', emergencyName: '', address: ''
  });
  const [profileSaved, setProfileSaved] = useState(false);

  // Nearby disaster for active tips
  const nearestDisaster = disasters.find(d => d.severity === 'High') || disasters[0];

  useEffect(() => {
    // Load saved profile
    try {
      const saved = JSON.parse(localStorage.getItem('ar_profile') || '{}');
      if (Object.keys(saved).length) setProfile(saved);
    } catch {}

    // Get user location
    navigator.geolocation?.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setLocation({ lat, lng });
        // Reverse geocode using OpenStreetMap Nominatim (free)
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || '';
          const state = data.address?.state || '';
          setLocationName(`${city}${city && state ? ', ' : ''}${state}` || 'Location detected');
        } catch {
          setLocationName(`${lat.toFixed(3)}, ${lng.toFixed(3)}`);
        }
        loadNearbyData(lat, lng);
      },
      () => {
        setLocationName('Location unavailable');
        loadAllData();
      }
    );
  }, []);

  const loadNearbyData = async (lat, lng) => {
    try {
      const [dRes, sRes, vRes] = await Promise.all([
        disasterAPI.getAll(),
        shelterAPI.getAll({ lat, lng, radius: 200000 }),
        volunteerAPI.getAll({ lat, lng, available: true }),
      ]);

      const allDisasters = dRes.data || [];
      setDisasters(allDisasters);

      const sheltersWithDist = (sRes.data || []).map(s => ({
        ...s, distance: haversine(lat, lng, parseFloat(s.lat), parseFloat(s.lng))
      })).sort((a, b) => a.distance - b.distance);
      setNearbyShelters(sheltersWithDist.slice(0, 5));

      const volsWithDist = (vRes.data || []).filter(v => v.availability).map(v => ({
        ...v, distance: haversine(lat, lng, parseFloat(v.lat), parseFloat(v.lng))
      })).sort((a, b) => a.distance - b.distance);
      setNearbyVolunteers(volsWithDist.slice(0, 4));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadAllData = async () => {
    try {
      const [dRes, sRes, vRes] = await Promise.all([
        disasterAPI.getAll(),
        shelterAPI.getAll(),
        volunteerAPI.getAll({ available: true }),
      ]);
      setDisasters(dRes.data || []);
      setNearbyShelters((sRes.data || []).slice(0, 5));
      setNearbyVolunteers((vRes.data || []).filter(v => v.availability).slice(0, 4));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const toggleChecklist = (id) => {
    const updated = { ...checklist, [id]: !checklist[id] };
    setChecklist(updated);
    try { localStorage.setItem('ar_checklist', JSON.stringify(updated)); } catch {}
  };

  const saveProfile = () => {
    try { localStorage.setItem('ar_profile', JSON.stringify(profile)); } catch {}
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  const sendHelpRequest = async () => {
    setSendingHelp(true);
    try {
      await sosAPI.send({
        user_id: user?.uid || 'anonymous',
        user_name: user?.displayName || 'Citizen',
        lat: location?.lat || 0,
        lng: location?.lng || 0,
        message: `[${helpForm.urgency} URGENCY - ${helpForm.type}] ${helpForm.description}`
      });
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      setHelpSent(true);
      setTimeout(() => setHelpSent(false), 6000);
    } catch (e) { console.error(e); }
    finally { setSendingHelp(false); }
  };

  const checkedCount = Object.values(checklist).filter(Boolean).length;
  const highAlerts = disasters.filter(d => d.severity === 'High');

  // ── Tabs config ──
  const TABS = [
    { id: 'overview', label: 'Overview', icon: '🏠' },
    { id: 'alerts', label: `Alerts ${highAlerts.length > 0 ? `(${highAlerts.length})` : ''}`, icon: '🔔' },
    { id: 'shelters', label: 'Shelters', icon: '🏥' },
    { id: 'volunteers', label: 'Volunteers', icon: '🙋' },
    { id: 'help', label: 'Request Help', icon: '🆘' },
    { id: 'safety', label: 'Safety Tips', icon: '📋' },
    { id: 'checklist', label: 'Emergency Kit', icon: '🎒' },
    { id: 'profile', label: 'My Profile', icon: '👤' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 60px)', background: '#060d1a' }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: '220px', flexShrink: 0,
        background: '#08111f',
        borderRight: '1px solid #1a3355',
        padding: '1.25rem 0',
        position: 'sticky', top: '60px', height: 'calc(100vh - 60px)',
        overflowY: 'auto'
      }}>
        {/* User info */}
        <div style={{ padding: '0 1rem 1.25rem', borderBottom: '1px solid #1a3355', marginBottom: '0.5rem' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #0066cc, #00b4ff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.3rem', fontWeight: 700, color: 'white',
            fontFamily: 'Rajdhani, sans-serif', marginBottom: '0.6rem'
          }}>
            {(user?.displayName || user?.email || 'C')[0].toUpperCase()}
          </div>
          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: '#e8f4ff', marginBottom: '0.15rem' }}>
            {user?.displayName || user?.email?.split('@')[0] || 'Citizen'}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#00b4ff', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            👤 Citizen
          </div>
          <div style={{ fontSize: '0.72rem', color: '#7ba3c8', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: location ? '#00e676' : '#ffc800', display: 'inline-block' }} />
            {locationName}
          </div>
        </div>

        {/* Alert badge */}
        {highAlerts.length > 0 && (
          <div style={{
            margin: '0 0.75rem 0.75rem',
            padding: '0.5rem 0.75rem',
            background: 'rgba(255,45,45,0.1)',
            border: '1px solid rgba(255,45,45,0.3)',
            borderRadius: '6px',
            fontSize: '0.75rem', color: '#ff2d2d',
            fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
            animation: 'pulse-red 2s infinite'
          }}>
            ⚠️ {highAlerts.length} HIGH ALERT{highAlerts.length > 1 ? 'S' : ''} ACTIVE
          </div>
        )}

        {/* Nav links */}
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            width: '100%', textAlign: 'left',
            padding: '0.65rem 1rem',
            background: activeTab === tab.id ? 'rgba(0,180,255,0.1)' : 'transparent',
            border: 'none',
            borderRight: activeTab === tab.id ? '3px solid #00b4ff' : '3px solid transparent',
            color: activeTab === tab.id ? '#00b4ff' : '#7ba3c8',
            fontFamily: 'Rajdhani, sans-serif', fontWeight: 600,
            fontSize: '0.85rem', letterSpacing: '0.04em',
            cursor: 'pointer', transition: 'all 0.15s',
            display: 'flex', alignItems: 'center', gap: '0.55rem'
          }}>
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}

        {/* Emergency numbers quick access */}
        <div style={{ margin: '1rem 0.75rem 0', padding: '0.75rem', background: '#0d1b2e', border: '1px solid #1a3355', borderRadius: '6px' }}>
          <div style={{ fontSize: '0.65rem', color: '#7ba3c8', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Quick Dial</div>
          {EMERGENCY_NUMBERS.slice(0, 3).map(n => (
            <a key={n.number} href={`tel:${n.number}`} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '0.3rem 0', textDecoration: 'none',
              borderBottom: '1px solid #1a3355'
            }}>
              <span style={{ fontSize: '0.75rem', color: '#e8f4ff' }}>{n.icon} {n.name}</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem', color: n.color, fontWeight: 700 }}>{n.number}</span>
            </a>
          ))}
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>

        {/* ═══════════════════ OVERVIEW ═══════════════════ */}
        {activeTab === 'overview' && (
          <div className="fade-in">
            <div style={{ marginBottom: '1.5rem' }}>
              <h1 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1.8rem', fontWeight: 700, letterSpacing: '0.06em', marginBottom: '0.25rem' }}>
                Welcome back, {user?.displayName?.split(' ')[0] || 'Citizen'} 👋
              </h1>
              <p style={{ color: '#7ba3c8', fontSize: '0.88rem' }}>
                Here's your real-time safety overview for <strong style={{ color: '#00b4ff' }}>{locationName}</strong>
              </p>
            </div>

            {/* High alert banner */}
            {highAlerts.length > 0 && (
              <div style={{
                background: 'rgba(255,45,45,0.08)',
                border: '1px solid rgba(255,45,45,0.35)',
                borderLeft: '4px solid #ff2d2d',
                borderRadius: '8px',
                padding: '1rem 1.25rem',
                marginBottom: '1.5rem',
                animation: 'fadeIn 0.3s ease'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#ff2d2d', marginBottom: '0.3rem' }}>
                      ⚠️ {highAlerts.length} HIGH-SEVERITY ALERT{highAlerts.length > 1 ? 'S' : ''} IN YOUR REGION
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#ffaa88' }}>
                      {highAlerts.slice(0, 2).map(d => `${DISASTER_ICONS[d.type] || '⚠️'} ${d.type} near ${d.location_name || 'your area'}`).join(' · ')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-danger btn-sm" onClick={() => setActiveTab('alerts')}>View Alerts</button>
                    <button className="btn btn-success btn-sm" onClick={() => setActiveTab('shelters')}>Find Shelter</button>
                  </div>
                </div>
              </div>
            )}

            {/* Stats row */}
            <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
              <StatCard icon="⚠️" label="Active Disasters" value={loading ? '...' : disasters.length} color="#ff2d2d" sublabel={`${highAlerts.length} high severity`} />
              <StatCard icon="🏥" label="Nearby Shelters" value={loading ? '...' : nearbyShelters.length} color="#00e676" sublabel="within 200km" />
              <StatCard icon="🙋" label="Available Volunteers" value={loading ? '...' : nearbyVolunteers.length} color="#ffc800" sublabel="ready to help" />
              <StatCard icon="🎒" label="Kit Readiness" value={`${checkedCount}/${CHECKLIST_ITEMS.length}`} color="#00b4ff" sublabel={`${Math.round(checkedCount / CHECKLIST_ITEMS.length * 100)}% prepared`} />
            </div>

            {/* Main grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>

              {/* Nearest shelter */}
              <div style={{ background: '#0f2340', border: '1px solid rgba(0,230,118,0.2)', borderRadius: '10px', padding: '1.1rem' }}>
                <SectionTitle icon="🏥">Nearest Shelter</SectionTitle>
                {nearbyShelters[0] ? (
                  <div>
                    <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '1rem', marginBottom: '0.4rem' }}>
                      {nearbyShelters[0].name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#7ba3c8', marginBottom: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <div>📍 {nearbyShelters[0].distance?.toFixed(1)} km away</div>
                      <div>👤 {nearbyShelters[0].contact_person}</div>
                      <div>📞 {nearbyShelters[0].contact}</div>
                      <div style={{ color: nearbyShelters[0].current_occupancy < nearbyShelters[0].capacity ? '#00e676' : '#ff2d2d' }}>
                        🏠 {nearbyShelters[0].capacity - (nearbyShelters[0].current_occupancy || 0)} spots available
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-success btn-sm" onClick={() => window.open(`https://maps.google.com?q=${nearbyShelters[0].lat},${nearbyShelters[0].lng}`, '_blank')}>
                        🗺️ Directions
                      </button>
                      <button className="btn btn-outline btn-sm" onClick={() => setActiveTab('shelters')}>
                        See all
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ color: '#7ba3c8', fontSize: '0.85rem' }}>{loading ? 'Searching...' : 'No shelters found nearby'}</div>
                )}
              </div>

              {/* Nearest volunteer */}
              <div style={{ background: '#0f2340', border: '1px solid rgba(255,200,0,0.2)', borderRadius: '10px', padding: '1.1rem' }}>
                <SectionTitle icon="🙋">Nearest Volunteer</SectionTitle>
                {nearbyVolunteers[0] ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                        background: 'linear-gradient(135deg, #cc9900, #ffc800)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.1rem', fontWeight: 700, color: '#060d1a',
                        fontFamily: 'Rajdhani, sans-serif'
                      }}>
                        {nearbyVolunteers[0].name?.[0]}
                      </div>
                      <div>
                        <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700 }}>{nearbyVolunteers[0].name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#00e676' }}>✅ Available · ⭐ {nearbyVolunteers[0].rating}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#7ba3c8', marginBottom: '0.75rem' }}>
                      <div>📍 {nearbyVolunteers[0].distance?.toFixed(1)} km away</div>
                      <div>🎒 {nearbyVolunteers[0].supplies?.join(', ')}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <a href={`tel:${nearbyVolunteers[0].contact}`} className="btn btn-outline btn-sm">📞 Call</a>
                      <button className="btn btn-outline btn-sm" onClick={() => setActiveTab('volunteers')}>See all</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ color: '#7ba3c8', fontSize: '0.85rem' }}>{loading ? 'Searching...' : 'No volunteers nearby'}</div>
                )}
              </div>
            </div>

            {/* Current disaster type tips */}
            {nearestDisaster && (
              <div style={{ background: '#0f2340', border: `1px solid ${SEVERITY_COLOR[nearestDisaster.severity] || '#1a3355'}30`, borderRadius: '10px', padding: '1.1rem', marginBottom: '1.25rem' }}>
                <SectionTitle icon="📋">Safety Tips — {nearestDisaster.type} Alert</SectionTitle>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {(SAFETY_TIPS[nearestDisaster.type] || []).map((tip, i) => (
                    <div key={i} style={{
                      padding: '0.5rem 0.75rem',
                      background: `${SEVERITY_COLOR[nearestDisaster.severity] || '#00b4ff'}08`,
                      border: `1px solid ${SEVERITY_COLOR[nearestDisaster.severity] || '#00b4ff'}20`,
                      borderRadius: '6px',
                      fontSize: '0.8rem', color: '#e8f4ff'
                    }}>
                      ✅ {tip}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Emergency kit progress */}
            <div style={{ background: '#0f2340', border: '1px solid rgba(0,180,255,0.2)', borderRadius: '10px', padding: '1.1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <SectionTitle icon="🎒">Emergency Kit Readiness</SectionTitle>
                <button className="btn btn-outline btn-sm" onClick={() => setActiveTab('checklist')}>Full Checklist →</button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ height: '10px', background: '#1a3355', borderRadius: '5px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${(checkedCount / CHECKLIST_ITEMS.length) * 100}%`,
                      background: checkedCount >= 8 ? '#00e676' : checkedCount >= 5 ? '#ffc800' : '#ff2d2d',
                      borderRadius: '5px', transition: 'width 0.5s ease'
                    }} />
                  </div>
                </div>
                <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '1rem', color: checkedCount >= 8 ? '#00e676' : checkedCount >= 5 ? '#ffc800' : '#ff2d2d', minWidth: '80px', textAlign: 'right' }}>
                  {checkedCount}/{CHECKLIST_ITEMS.length} items
                </div>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#7ba3c8', marginTop: '0.4rem' }}>
                {checkedCount === 0 ? '⚠️ Start preparing your emergency kit!' : checkedCount < 5 ? '⚠️ Kit partially ready — add more items.' : checkedCount < 9 ? '🟡 Kit mostly ready.' : '✅ Emergency kit fully prepared!'}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════ ALERTS ═══════════════════ */}
        {activeTab === 'alerts' && (
          <div className="fade-in">
            <SectionTitle icon="🔔">Active Disaster Alerts</SectionTitle>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" /></div>
            ) : disasters.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#7ba3c8' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1.1rem' }}>No active disasters in your area</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[...disasters].sort((a, b) => {
                  const order = { High: 0, Medium: 1, Low: 2 };
                  return (order[a.severity] || 1) - (order[b.severity] || 1);
                }).map((d, i) => {
                  const color = SEVERITY_COLOR[d.severity] || '#ffc800';
                  return (
                    <div key={d.id || i} style={{
                      background: '#0f2340',
                      border: `1px solid ${color}30`,
                      borderLeft: `4px solid ${color}`,
                      borderRadius: '8px',
                      padding: '1.1rem',
                      animation: `fadeIn 0.3s ease ${i * 0.07}s both`
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.6rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span style={{ fontSize: '1.5rem' }}>{DISASTER_ICONS[d.type] || '⚠️'}</span>
                          <div>
                            <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '1.05rem' }}>{d.type} Alert</div>
                            <div style={{ fontSize: '0.75rem', color: '#7ba3c8' }}>
                              📍 {d.location_name || `${parseFloat(d.lat).toFixed(3)}, ${parseFloat(d.lng).toFixed(3)}`}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className={`badge badge-${d.severity?.toLowerCase()}`}>{d.severity}</span>
                          <span style={{ fontSize: '0.7rem', color: '#3d6080' }}>{timeAgo(d.timestamp)}</span>
                        </div>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: '#e8f4ff', lineHeight: 1.6, marginBottom: '0.75rem' }}>{d.description}</p>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button className="btn btn-outline btn-sm" onClick={() => window.open(`/map`, '_self')}>🗺️ View on Map</button>
                        <button className="btn btn-success btn-sm" onClick={() => setActiveTab('shelters')}>🏥 Find Shelter</button>
                        <button className="btn btn-outline btn-sm" onClick={() => { setActiveTip(d.type); setActiveTab('safety'); }}>📋 Safety Tips</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════ SHELTERS ═══════════════════ */}
        {activeTab === 'shelters' && (
          <div className="fade-in">
            <SectionTitle icon="🏥">Nearby Evacuation Shelters</SectionTitle>
            {location && (
              <div style={{ fontSize: '0.8rem', color: '#7ba3c8', marginBottom: '1rem' }}>
                📍 Showing shelters near <strong style={{ color: '#00b4ff' }}>{locationName}</strong>
              </div>
            )}
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" /></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {nearbyShelters.map((s, i) => {
                  const occ = Math.round(((s.current_occupancy || 0) / s.capacity) * 100);
                  const occColor = occ > 80 ? '#ff2d2d' : occ > 50 ? '#ffc800' : '#00e676';
                  return (
                    <div key={s.id || i} style={{
                      background: '#0f2340', border: '1px solid rgba(0,230,118,0.2)',
                      borderRadius: '10px', padding: '1.1rem',
                      animation: `fadeIn 0.3s ease ${i * 0.07}s both`,
                      display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'start'
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '1.3rem' }}>🏥</span>
                          <div>
                            <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700 }}>{s.name}</div>
                            <div style={{ fontSize: '0.7rem', color: '#00e676', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.type}</div>
                          </div>
                          {s.distance && (
                            <span style={{ marginLeft: 'auto', padding: '0.15rem 0.5rem', background: 'rgba(0,180,255,0.1)', border: '1px solid rgba(0,180,255,0.3)', borderRadius: '4px', fontSize: '0.72rem', color: '#00b4ff', fontWeight: 700 }}>
                              {s.distance.toFixed(1)} km
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem 1rem', fontSize: '0.8rem', color: '#7ba3c8', marginBottom: '0.6rem' }}>
                          <div>👤 {s.contact_person}</div>
                          <div>📞 <a href={`tel:${s.contact}`} style={{ color: '#00b4ff', textDecoration: 'none' }}>{s.contact}</a></div>
                          <div style={{ color: occColor }}>🏠 {s.capacity - (s.current_occupancy || 0)} spots free</div>
                          <div>📊 {occ}% full</div>
                        </div>
                        {/* Capacity bar */}
                        <div style={{ height: '5px', background: '#1a3355', borderRadius: '3px', overflow: 'hidden', marginBottom: '0.6rem' }}>
                          <div style={{ height: '100%', width: `${occ}%`, background: occColor, borderRadius: '3px', transition: 'width 0.6s' }} />
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                          {(s.supplies || []).map(sup => (
                            <span key={sup} style={{ padding: '0.15rem 0.45rem', background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.2)', borderRadius: '3px', fontSize: '0.7rem', color: '#00e676' }}>
                              {sup}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => window.open(`https://maps.google.com?q=${s.lat},${s.lng}`, '_blank')}
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        🗺️ Get Directions
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════ VOLUNTEERS ═══════════════════ */}
        {activeTab === 'volunteers' && (
          <div className="fade-in">
            <SectionTitle icon="🙋">Available Volunteers Near You</SectionTitle>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" /></div>
            ) : nearbyVolunteers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#7ba3c8' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🙋</div>
                <div>No volunteers currently available nearby.</div>
                <Link to="/volunteers" className="btn btn-outline" style={{ marginTop: '1rem', display: 'inline-flex' }}>Browse All Volunteers</Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {nearbyVolunteers.map((v, i) => (
                  <div key={v.id || i} style={{
                    background: '#0f2340', border: '1px solid rgba(255,200,0,0.15)',
                    borderRadius: '10px', padding: '1.1rem',
                    animation: `fadeIn 0.3s ease ${i * 0.08}s both`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <div style={{
                        width: '44px', height: '44px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, #cc9900, #ffc800)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.1rem', fontWeight: 700, color: '#060d1a',
                        fontFamily: 'Rajdhani, sans-serif', flexShrink: 0
                      }}>{v.name?.[0]}</div>
                      <div>
                        <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700 }}>{v.name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#00e676', fontWeight: 600 }}>✅ Available</div>
                      </div>
                      {v.distance && (
                        <span style={{ marginLeft: 'auto', padding: '0.15rem 0.5rem', background: 'rgba(255,200,0,0.1)', border: '1px solid rgba(255,200,0,0.3)', borderRadius: '4px', fontSize: '0.72rem', color: '#ffc800', fontWeight: 700 }}>
                          {v.distance.toFixed(1)} km
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#7ba3c8', marginBottom: '0.5rem' }}>
                      ⭐ {v.rating} · {v.missions_completed} missions completed
                    </div>
                    {v.skills?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.6rem' }}>
                        {v.skills.map(s => (
                          <span key={s} style={{ padding: '0.15rem 0.4rem', background: 'rgba(0,180,255,0.08)', border: '1px solid rgba(0,180,255,0.2)', borderRadius: '3px', fontSize: '0.7rem', color: '#00b4ff' }}>{s}</span>
                        ))}
                      </div>
                    )}
                    <div style={{ fontSize: '0.78rem', color: '#7ba3c8', marginBottom: '0.75rem' }}>
                      🎒 {v.supplies?.join(', ') || 'Supplies available'}
                    </div>
                    <a href={`tel:${v.contact}`} className="btn btn-outline btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                      📞 Contact {v.name?.split(' ')[0]}
                    </a>
                  </div>
                ))}
              </div>
            )}
            <div style={{ marginTop: '1.25rem' }}>
              <Link to="/volunteers" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                View All Volunteers & Register →
              </Link>
            </div>
          </div>
        )}

        {/* ═══════════════════ HELP REQUEST ═══════════════════ */}
        {activeTab === 'help' && (
          <div className="fade-in">
            <SectionTitle icon="🆘">Request Emergency Help</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

              {/* Help form */}
              <div style={{ background: '#0f2340', border: '1px solid rgba(255,45,45,0.2)', borderRadius: '10px', padding: '1.25rem' }}>
                <p style={{ fontSize: '0.85rem', color: '#7ba3c8', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                  Your request will be sent to nearby volunteers, emergency responders, and the system admin. Your location will be shared automatically.
                </p>

                {helpSent && (
                  <div style={{
                    padding: '0.75rem 1rem', background: 'rgba(0,230,118,0.1)',
                    border: '1px solid rgba(0,230,118,0.4)', borderRadius: '6px',
                    color: '#00e676', marginBottom: '1rem',
                    fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
                    animation: 'fadeIn 0.3s ease'
                  }}>
                    ✅ Help request sent! Emergency responders have been notified. Stay calm.
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Type of Help Needed</label>
                  <select className="form-select" value={helpForm.type} onChange={e => setHelpForm(f => ({ ...f, type: e.target.value }))}>
                    {['Medical Emergency', 'Evacuation Needed', 'Food & Water', 'Trapped/Stranded', 'Search & Rescue', 'Other'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Urgency Level</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {['Critical', 'High', 'Medium'].map(u => (
                      <button key={u} onClick={() => setHelpForm(f => ({ ...f, urgency: u }))} style={{
                        flex: 1, padding: '0.5rem',
                        background: helpForm.urgency === u ? (u === 'Critical' ? 'rgba(255,45,45,0.2)' : u === 'High' ? 'rgba(255,200,0,0.15)' : 'rgba(0,180,255,0.15)') : 'transparent',
                        border: `1px solid ${helpForm.urgency === u ? (u === 'Critical' ? '#ff2d2d' : u === 'High' ? '#ffc800' : '#00b4ff') : '#1a3355'}`,
                        borderRadius: '4px',
                        color: helpForm.urgency === u ? (u === 'Critical' ? '#ff2d2d' : u === 'High' ? '#ffc800' : '#00b4ff') : '#7ba3c8',
                        fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '0.82rem',
                        cursor: 'pointer', transition: 'all 0.2s'
                      }}>{u === 'Critical' ? '🔴' : u === 'High' ? '🟡' : '🔵'} {u}</button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Describe Your Situation</label>
                  <textarea className="form-textarea" style={{ minHeight: '100px' }}
                    placeholder="e.g. I am trapped on the 2nd floor. Flood water rising. 3 people with me including 1 child."
                    value={helpForm.description} onChange={e => setHelpForm(f => ({ ...f, description: e.target.value }))} />
                </div>

                <div style={{ padding: '0.75rem', background: 'rgba(0,180,255,0.05)', border: '1px solid rgba(0,180,255,0.2)', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.78rem', color: '#7ba3c8' }}>
                  📍 Your location: <strong style={{ color: '#00b4ff' }}>{location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)} — ${locationName}` : 'Not detected'}</strong>
                </div>

                <button
                  className="btn btn-danger"
                  style={{ width: '100%', justifyContent: 'center', fontSize: '1rem', padding: '0.75rem', letterSpacing: '0.08em' }}
                  onClick={sendHelpRequest}
                  disabled={sendingHelp || !helpForm.description}
                >
                  {sendingHelp ? '⏳ Sending alert...' : '🆘 SEND HELP REQUEST'}
                </button>
              </div>

              {/* Emergency numbers */}
              <div>
                <div style={{ background: '#0f2340', border: '1px solid #1a3355', borderRadius: '10px', padding: '1.25rem', marginBottom: '1rem' }}>
                  <h3 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '1rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#e8f4ff', marginBottom: '1rem' }}>
                    📞 Emergency Helplines
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {EMERGENCY_NUMBERS.map(n => (
                      <a key={n.number} href={`tel:${n.number}`} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '0.7rem 0.9rem',
                        background: `${n.color}08`,
                        border: `1px solid ${n.color}25`,
                        borderRadius: '6px', textDecoration: 'none',
                        transition: 'all 0.2s'
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = `${n.color}15`}
                        onMouseLeave={e => e.currentTarget.style.background = `${n.color}08`}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span style={{ fontSize: '1.2rem' }}>{n.icon}</span>
                          <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: '0.9rem', color: '#e8f4ff' }}>{n.name}</span>
                        </div>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1rem', fontWeight: 700, color: n.color }}>{n.number}</span>
                      </a>
                    ))}
                  </div>
                </div>

                <div style={{ background: 'rgba(255,45,45,0.05)', border: '1px solid rgba(255,45,45,0.2)', borderRadius: '8px', padding: '1rem', fontSize: '0.8rem', color: '#ffaa88', lineHeight: 1.7 }}>
                  <strong>⚠️ In Life-Threatening Emergency:</strong><br />
                  Call <strong>112</strong> immediately. Use the SOS button (bottom-right) to alert nearby responders with your GPS location. Do NOT wait — every second counts.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════ SAFETY TIPS ═══════════════════ */}
        {activeTab === 'safety' && (
          <div className="fade-in">
            <SectionTitle icon="📋">Disaster Safety Guidelines</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.1rem' }}>
              {Object.entries(SAFETY_TIPS).map(([type, tips]) => {
                const color = { Landslide: '#ff7d00', Flood: '#00b4ff', Earthquake: '#ffc800', Fire: '#ff2d2d', Storm: '#cc66ff' }[type];
                return (
                  <div key={type} style={{
                    background: '#0f2340',
                    border: `1px solid ${color}25`,
                    borderTop: `3px solid ${color}`,
                    borderRadius: '10px', padding: '1.1rem',
                    animation: 'fadeIn 0.3s ease'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.9rem' }}>
                      <span style={{ fontSize: '1.4rem' }}>{DISASTER_ICONS[type]}</span>
                      <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '1rem', color }}>
                        {type} Safety
                      </div>
                    </div>
                    <ol style={{ paddingLeft: '1.1rem', margin: 0 }}>
                      {tips.map((tip, i) => (
                        <li key={i} style={{ fontSize: '0.82rem', color: '#e8f4ff', marginBottom: '0.45rem', lineHeight: 1.5 }}>
                          {tip}
                        </li>
                      ))}
                    </ol>
                  </div>
                );
              })}
            </div>

            {/* Do's and Don'ts */}
            <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ background: '#0f2340', border: '1px solid rgba(0,230,118,0.2)', borderRadius: '10px', padding: '1.1rem' }}>
                <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: '#00e676', marginBottom: '0.75rem', fontSize: '1rem', letterSpacing: '0.08em' }}>
                  ✅ ALWAYS DO
                </div>
                {['Stay calm and help others stay calm', 'Keep emergency kit ready at all times', 'Know your nearest shelter location', 'Have an emergency family plan', 'Keep phone charged', 'Follow official evacuation orders', 'Check on elderly neighbors', 'Register with local disaster authority'].map((tip, i) => (
                  <div key={i} style={{ fontSize: '0.82rem', color: '#e8f4ff', marginBottom: '0.4rem', paddingLeft: '0.5rem', borderLeft: '2px solid rgba(0,230,118,0.3)' }}>
                    {tip}
                  </div>
                ))}
              </div>
              <div style={{ background: '#0f2340', border: '1px solid rgba(255,45,45,0.2)', borderRadius: '10px', padding: '1.1rem' }}>
                <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: '#ff2d2d', marginBottom: '0.75rem', fontSize: '1rem', letterSpacing: '0.08em' }}>
                  ❌ NEVER DO
                </div>
                {['Drive through flooded roads', 'Touch downed power lines', 'Go near landslide zones', 'Spread unverified information', 'Return home before all-clear', 'Use elevators during earthquakes', 'Ignore official warnings', 'Use candles near gas leaks'].map((tip, i) => (
                  <div key={i} style={{ fontSize: '0.82rem', color: '#e8f4ff', marginBottom: '0.4rem', paddingLeft: '0.5rem', borderLeft: '2px solid rgba(255,45,45,0.3)' }}>
                    {tip}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════ CHECKLIST ═══════════════════ */}
        {activeTab === 'checklist' && (
          <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <SectionTitle icon="🎒">Emergency Preparedness Checklist</SectionTitle>
              <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: checkedCount >= 8 ? '#00e676' : checkedCount >= 5 ? '#ffc800' : '#ff2d2d' }}>
                {checkedCount}/{CHECKLIST_ITEMS.length} Complete
              </div>
            </div>

            {/* Progress */}
            <div style={{ background: '#0f2340', border: '1px solid #1a3355', borderRadius: '10px', padding: '1.1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#7ba3c8', marginBottom: '0.6rem' }}>
                <span>Overall Preparedness</span>
                <span style={{ color: checkedCount >= 8 ? '#00e676' : checkedCount >= 5 ? '#ffc800' : '#ff2d2d', fontWeight: 700 }}>
                  {Math.round((checkedCount / CHECKLIST_ITEMS.length) * 100)}%
                </span>
              </div>
              <div style={{ height: '12px', background: '#1a3355', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${(checkedCount / CHECKLIST_ITEMS.length) * 100}%`,
                  background: checkedCount >= 8 ? 'linear-gradient(90deg, #00a855, #00e676)' : checkedCount >= 5 ? 'linear-gradient(90deg, #cc9900, #ffc800)' : 'linear-gradient(90deg, #cc0000, #ff2d2d)',
                  borderRadius: '6px', transition: 'width 0.5s ease'
                }} />
              </div>
              <div style={{ fontSize: '0.78rem', color: '#7ba3c8', marginTop: '0.5rem' }}>
                {checkedCount === 0 && '⚠️ You are not prepared for an emergency. Start checking off items!'}
                {checkedCount > 0 && checkedCount < 5 && '🟡 Basic preparations started. Keep going!'}
                {checkedCount >= 5 && checkedCount < 9 && '🟡 Good progress! A few more items and you will be ready.'}
                {checkedCount >= 9 && '✅ Excellent! You are well-prepared for emergencies.'}
              </div>
            </div>

            {/* Checklist items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {CHECKLIST_ITEMS.map((item, i) => (
                <div
                  key={item.id}
                  onClick={() => toggleChecklist(item.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.9rem',
                    padding: '0.9rem 1.1rem',
                    background: checklist[item.id] ? 'rgba(0,230,118,0.06)' : '#0f2340',
                    border: `1px solid ${checklist[item.id] ? 'rgba(0,230,118,0.3)' : '#1a3355'}`,
                    borderRadius: '8px', cursor: 'pointer',
                    transition: 'all 0.2s',
                    animation: `fadeIn 0.3s ease ${i * 0.04}s both`
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = checklist[item.id] ? 'rgba(0,230,118,0.5)' : 'rgba(0,180,255,0.3)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = checklist[item.id] ? 'rgba(0,230,118,0.3)' : '#1a3355'}
                >
                  {/* Checkbox */}
                  <div style={{
                    width: '22px', height: '22px', borderRadius: '4px', flexShrink: 0,
                    background: checklist[item.id] ? '#00e676' : 'transparent',
                    border: `2px solid ${checklist[item.id] ? '#00e676' : '#3d6080'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}>
                    {checklist[item.id] && <span style={{ fontSize: '0.75rem', color: '#060d1a', fontWeight: 700 }}>✓</span>}
                  </div>
                  <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                  <span style={{
                    fontSize: '0.88rem',
                    color: checklist[item.id] ? '#7ba3c8' : '#e8f4ff',
                    textDecoration: checklist[item.id] ? 'line-through' : 'none',
                    transition: 'all 0.2s',
                    flex: 1
                  }}>
                    {item.label}
                  </span>
                  {checklist[item.id] && <span style={{ fontSize: '0.7rem', color: '#00e676', fontWeight: 700, flexShrink: 0 }}>✅ Done</span>}
                </div>
              ))}
            </div>

            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(0,180,255,0.05)', border: '1px solid rgba(0,180,255,0.15)', borderRadius: '6px', fontSize: '0.78rem', color: '#7ba3c8' }}>
              💡 Your checklist is saved locally on this device. Experts recommend reviewing and refreshing your emergency kit every 6 months.
            </div>
          </div>
        )}

        {/* ═══════════════════ MY PROFILE ═══════════════════ */}
        {activeTab === 'profile' && (
          <div className="fade-in">
            <SectionTitle icon="👤">My Emergency Profile</SectionTitle>
            <p style={{ color: '#7ba3c8', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              This information helps emergency responders assist you better. Stored locally on your device.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <div style={{ background: '#0f2340', border: '1px solid #1a3355', borderRadius: '10px', padding: '1.25rem', marginBottom: '1rem' }}>
                  <h3 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '0.95rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7ba3c8', marginBottom: '1rem' }}>
                    🏥 Medical Information
                  </h3>
                  <div className="form-group">
                    <label className="form-label">Blood Group</label>
                    <select className="form-select" value={profile.bloodGroup} onChange={e => setProfile(p => ({ ...p, bloodGroup: e.target.value }))}>
                      <option value="">Select blood group</option>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg}>{bg}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Medical Conditions / Allergies</label>
                    <textarea className="form-textarea"
                      placeholder="e.g. Diabetes, Heart condition, Penicillin allergy..."
                      value={profile.medicalConditions}
                      onChange={e => setProfile(p => ({ ...p, medicalConditions: e.target.value }))} />
                  </div>
                </div>

                <div style={{ background: '#0f2340', border: '1px solid #1a3355', borderRadius: '10px', padding: '1.25rem' }}>
                  <h3 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '0.95rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7ba3c8', marginBottom: '1rem' }}>
                    📍 My Address
                  </h3>
                  <div className="form-group">
                    <label className="form-label">Home Address</label>
                    <textarea className="form-textarea"
                      placeholder="Your full address helps emergency services locate you faster"
                      value={profile.address}
                      onChange={e => setProfile(p => ({ ...p, address: e.target.value }))} />
                  </div>
                </div>
              </div>

              <div>
                <div style={{ background: '#0f2340', border: '1px solid #1a3355', borderRadius: '10px', padding: '1.25rem', marginBottom: '1rem' }}>
                  <h3 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '0.95rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7ba3c8', marginBottom: '1rem' }}>
                    📞 Emergency Contact
                  </h3>
                  <div className="form-group">
                    <label className="form-label">Contact Person Name</label>
                    <input className="form-input" placeholder="Family member / close friend" value={profile.emergencyName} onChange={e => setProfile(p => ({ ...p, emergencyName: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contact Phone Number</label>
                    <input className="form-input" placeholder="+91-XXXXXXXXXX" value={profile.emergencyContact} onChange={e => setProfile(p => ({ ...p, emergencyContact: e.target.value }))} />
                  </div>
                </div>

                {/* Account info */}
                <div style={{ background: '#0f2340', border: '1px solid #1a3355', borderRadius: '10px', padding: '1.25rem', marginBottom: '1rem' }}>
                  <h3 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '0.95rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7ba3c8', marginBottom: '1rem' }}>
                    🔐 Account
                  </h3>
                  <div style={{ fontSize: '0.82rem', color: '#7ba3c8', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div>📧 <span style={{ color: '#e8f4ff' }}>{user?.email || 'Not logged in'}</span></div>
                    <div>👤 Role: <span style={{ color: '#00b4ff', textTransform: 'capitalize' }}>{userRole}</span></div>
                    <div>🔖 User ID: <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: '#3d6080' }}>{user?.uid?.slice(0, 16) || 'demo-user'}...</span></div>
                  </div>
                  <div style={{ marginTop: '0.75rem' }}>
                    <Link to="/volunteers" className="btn btn-success btn-sm" style={{ display: 'inline-flex' }}>
                      🙋 Upgrade to Volunteer
                    </Link>
                  </div>
                </div>

                {profileSaved && (
                  <div style={{
                    padding: '0.6rem 0.9rem', background: 'rgba(0,230,118,0.1)',
                    border: '1px solid rgba(0,230,118,0.3)', borderRadius: '6px',
                    color: '#00e676', fontSize: '0.82rem', fontWeight: 600,
                    marginBottom: '0.75rem', animation: 'fadeIn 0.3s ease'
                  }}>
                    ✅ Profile saved successfully!
                  </div>
                )}

                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={saveProfile}>
                  💾 Save Profile
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}