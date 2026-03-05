// pages/DisasterMap.jsx
import { useState, useEffect, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Circle,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { disasterAPI, shelterAPI, volunteerAPI, mlAPI } from "../utils/api";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const SEVERITY_COLORS = {
  High: "#ff2d2d",
  Medium: "#ffc800",
  Low: "#00b4ff",
};
const DISASTER_ICONS = {
  Landslide: "🏔️",
  Flood: "🌊",
  Earthquake: "🌍",
  Fire: "🔥",
  Storm: "⛈️",
};
const TYPES = ["All", "Landslide", "Flood", "Earthquake", "Fire", "Storm"];

// Custom icons
const shelterIcon = L.divIcon({
  html: `<div style="background:#00e676;border:2px solid #00a855;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 0 12px rgba(0,230,118,0.5)">🏥</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  className: "",
});

const volunteerIcon = L.divIcon({
  html: `<div style="background:#ffc800;border:2px solid #cc9900;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:13px;box-shadow:0 0 12px rgba(255,200,0,0.5)">🙋</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  className: "",
});

const userIcon = L.divIcon({
  html: `<div style="background:#00b4ff;border:2px solid #0066cc;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:11px;box-shadow:0 0 12px rgba(0,180,255,0.6)">📍</div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  className: "",
});

function LocationFinder({ onLocationFound }) {
  const map = useMap();
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition((pos) => {
      const { latitude: lat, longitude: lng } = pos.coords;
      onLocationFound([lat, lng]);
      map.flyTo([lat, lng], 10, { duration: 1.5 });
    });
  }, []);
  return null;
}

export default function DisasterMap() {
  const [disasters, setDisasters] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [showShelters, setShowShelters] = useState(true);
  const [showVolunteers, setShowVolunteers] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [activeTab, setActiveTab] = useState("map");

  // ML Predict state
  const [predictForm, setPredictForm] = useState({
    disaster_type: "Flood",
    latitude: "20.59",
    longitude: "78.96",
    rainfall_mm: "150",
    elevation_m: "300",
    season: "Monsoon",
    past_incidents: "2",
  });
  const [prediction, setPrediction] = useState(null);
  const [predicting, setPredicting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [dRes, sRes, vRes] = await Promise.all([
          disasterAPI.getAll(),
          shelterAPI.getAll(),
          volunteerAPI.getAll(),
        ]);
        setDisasters(dRes.data);
        setShelters(sRes.data);
        setVolunteers(vRes.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered =
    filter === "All" ? disasters : disasters.filter((d) => d.type === filter);

  const handlePredict = async () => {
    setPredicting(true);
    try {
      const res = await mlAPI.predictRisk({
        ...predictForm,
        latitude: parseFloat(predictForm.latitude),
        longitude: parseFloat(predictForm.longitude),
        rainfall_mm: parseFloat(predictForm.rainfall_mm),
        elevation_m: parseFloat(predictForm.elevation_m),
        past_incidents: parseInt(predictForm.past_incidents),
      });
      setPrediction(res.prediction);
    } catch (e) {
      console.error(e);
    } finally {
      setPredicting(false);
    }
  };

  const predictionColor = prediction
    ? { High: "#ff2d2d", Medium: "#ffc800", Low: "#00e676" }[
        prediction.risk_level
      ]
    : "#7ba3c8";

  return (
    <div
      style={{
        display: "flex",
        height: "calc(100vh - 60px)",
        overflow: "hidden",
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          width: "340px",
          flexShrink: 0,
          background: "#0d1b2e",
          borderRight: "1px solid #1a3355",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid #1a3355" }}>
          {["map", "predict"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: "0.75rem",
                background:
                  activeTab === tab ? "rgba(0,180,255,0.1)" : "transparent",
                border: "none",
                borderBottom:
                  activeTab === tab
                    ? "2px solid #00b4ff"
                    : "2px solid transparent",
                color: activeTab === tab ? "#00b4ff" : "#7ba3c8",
                fontFamily: "Rajdhani, sans-serif",
                fontWeight: 700,
                fontSize: "0.85rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {tab === "map" ? "🗺️ Map Controls" : "🤖 Risk Predictor"}
            </button>
          ))}
        </div>

        {activeTab === "map" ? (
          <div style={{ flex: 1, overflow: "auto", padding: "1rem" }}>
            {/* Filter by type */}
            <div style={{ marginBottom: "1rem" }}>
              <div className="form-label">Filter by Disaster Type</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilter(t)}
                    style={{
                      padding: "0.3rem 0.7rem",
                      fontSize: "0.75rem",
                      fontFamily: "Rajdhani, sans-serif",
                      fontWeight: 700,
                      borderRadius: "3px",
                      border: "1px solid",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      background:
                        filter === t ? "rgba(0,180,255,0.2)" : "transparent",
                      borderColor: filter === t ? "#00b4ff" : "#1a3355",
                      color: filter === t ? "#00b4ff" : "#7ba3c8",
                    }}
                  >
                    {t === "All" ? "🌐" : DISASTER_ICONS[t]} {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Layer toggles */}
            <div style={{ marginBottom: "1rem" }}>
              <div className="form-label">Map Layers</div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.4rem",
                }}
              >
                {[
                  {
                    key: "showShelters",
                    label: "🏥 Safe Shelters",
                    color: "#00e676",
                    state: showShelters,
                    setter: setShowShelters,
                  },
                  {
                    key: "showVolunteers",
                    label: "🙋 Volunteers",
                    color: "#ffc800",
                    state: showVolunteers,
                    setter: setShowVolunteers,
                  },
                ].map((layer) => (
                  <label
                    key={layer.key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.6rem",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      onClick={() => layer.setter(!layer.state)}
                      style={{
                        width: "36px",
                        height: "20px",
                        background: layer.state ? layer.color : "#1a3355",
                        borderRadius: "10px",
                        position: "relative",
                        transition: "background 0.2s",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          top: "2px",
                          left: layer.state ? "18px" : "2px",
                          width: "16px",
                          height: "16px",
                          background: "white",
                          borderRadius: "50%",
                          transition: "left 0.2s",
                        }}
                      />
                    </div>
                    <span style={{ fontSize: "0.85rem", color: "#e8f4ff" }}>
                      {layer.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div style={{ marginBottom: "1rem" }}>
              <div className="form-label">Risk Level Legend</div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.4rem",
                }}
              >
                {[
                  { color: "#ff2d2d", label: "High Risk Zone", opacity: 0.3 },
                  { color: "#ffc800", label: "Medium Risk Zone", opacity: 0.3 },
                  { color: "#00b4ff", label: "Low Risk Warning", opacity: 0.3 },
                  {
                    color: "#00e676",
                    label: "Safe / Shelter Zone",
                    opacity: 0.3,
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.6rem",
                    }}
                  >
                    <div
                      style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        background: `${item.color}40`,
                        border: `2px solid ${item.color}`,
                      }}
                    />
                    <span style={{ fontSize: "0.8rem", color: "#7ba3c8" }}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Active disasters list */}
            <div>
              <div className="form-label">
                Active Disasters ({filtered.length})
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                  maxHeight: "300px",
                  overflow: "auto",
                }}
              >
                {loading ? (
                  <div className="spinner" />
                ) : (
                  filtered.map((d, i) => (
                    <div
                      key={d.id || i}
                      style={{
                        padding: "0.6rem 0.75rem",
                        background: "#0f2340",
                        border: `1px solid ${SEVERITY_COLORS[d.severity] || "#1a3355"}30`,
                        borderLeft: `3px solid ${SEVERITY_COLORS[d.severity] || "#1a3355"}`,
                        borderRadius: "4px",
                        fontSize: "0.8rem",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "0.2rem",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 700,
                            fontFamily: "Rajdhani, sans-serif",
                          }}
                        >
                          {DISASTER_ICONS[d.type]} {d.type}
                        </span>
                        <span
                          className={`badge badge-${d.severity?.toLowerCase()}`}
                        >
                          {d.severity}
                        </span>
                      </div>
                      <div
                        style={{
                          color: "#7ba3c8",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {d.location_name ||
                          `${parseFloat(d.lat).toFixed(3)}, ${parseFloat(d.lng).toFixed(3)}`}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          /* AI Risk Predictor */
          <div style={{ flex: 1, overflow: "auto", padding: "1rem" }}>
            <div style={{ marginBottom: "1rem" }}>
              <div
                style={{
                  fontFamily: "Rajdhani, sans-serif",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  marginBottom: "0.25rem",
                }}
              >
                🤖 AI-Powered Risk Assessment
              </div>
              <div style={{ fontSize: "0.75rem", color: "#7ba3c8" }}>
                RandomForest ML model trained on historical disaster data
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Disaster Type</label>
              <select
                className="form-select"
                value={predictForm.disaster_type}
                onChange={(e) =>
                  setPredictForm((p) => ({
                    ...p,
                    disaster_type: e.target.value,
                  }))
                }
              >
                {["Flood", "Landslide", "Earthquake", "Fire", "Storm"].map(
                  (t) => (
                    <option key={t}>{t}</option>
                  ),
                )}
              </select>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.5rem",
              }}
            >
              <div className="form-group">
                <label className="form-label">Latitude</label>
                <input
                  className="form-input"
                  type="number"
                  value={predictForm.latitude}
                  onChange={(e) =>
                    setPredictForm((p) => ({ ...p, latitude: e.target.value }))
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Longitude</label>
                <input
                  className="form-input"
                  type="number"
                  value={predictForm.longitude}
                  onChange={(e) =>
                    setPredictForm((p) => ({ ...p, longitude: e.target.value }))
                  }
                />
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.5rem",
              }}
            >
              <div className="form-group">
                <label className="form-label">Rainfall (mm)</label>
                <input
                  className="form-input"
                  type="number"
                  value={predictForm.rainfall_mm}
                  onChange={(e) =>
                    setPredictForm((p) => ({
                      ...p,
                      rainfall_mm: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Elevation (m)</label>
                <input
                  className="form-input"
                  type="number"
                  value={predictForm.elevation_m}
                  onChange={(e) =>
                    setPredictForm((p) => ({
                      ...p,
                      elevation_m: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.5rem",
              }}
            >
              <div className="form-group">
                <label className="form-label">Season</label>
                <select
                  className="form-select"
                  value={predictForm.season}
                  onChange={(e) =>
                    setPredictForm((p) => ({ ...p, season: e.target.value }))
                  }
                >
                  {["Spring", "Summer", "Monsoon", "Autumn", "Winter"].map(
                    (s) => (
                      <option key={s}>{s}</option>
                    ),
                  )}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Past Incidents (5yr)</label>
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  max="10"
                  value={predictForm.past_incidents}
                  onChange={(e) =>
                    setPredictForm((p) => ({
                      ...p,
                      past_incidents: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <button
              className="btn btn-primary"
              style={{
                width: "100%",
                justifyContent: "center",
                marginBottom: "1rem",
              }}
              onClick={handlePredict}
              disabled={predicting}
            >
              {predicting ? "⏳ Analyzing..." : "🤖 Predict Risk"}
            </button>

            {prediction && (
              <div
                style={{
                  padding: "1rem",
                  background: `${predictionColor}08`,
                  border: `1px solid ${predictionColor}30`,
                  borderRadius: "8px",
                  animation: "fadeIn 0.3s ease",
                }}
              >
                <div style={{ textAlign: "center", marginBottom: "0.75rem" }}>
                  <div
                    style={{
                      fontSize: "2rem",
                      fontWeight: 900,
                      fontFamily: "Rajdhani, sans-serif",
                      color: predictionColor,
                      letterSpacing: "0.1em",
                    }}
                  >
                    {prediction.risk_level?.toUpperCase()} RISK
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#7ba3c8" }}>
                    Confidence: {prediction.confidence?.toFixed(1)}% | Model:{" "}
                    {prediction.model}
                  </div>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "0.5rem",
                  }}
                >
                  {Object.entries(prediction.probabilities || {}).map(
                    ([level, prob]) => (
                      <div key={level} style={{ textAlign: "center" }}>
                        <div
                          style={{
                            fontSize: "1rem",
                            fontWeight: 700,
                            color: {
                              High: "#ff2d2d",
                              Medium: "#ffc800",
                              Low: "#00e676",
                            }[level],
                          }}
                        >
                          {prob}%
                        </div>
                        <div style={{ fontSize: "0.65rem", color: "#7ba3c8" }}>
                          {level}
                        </div>
                        <div
                          style={{
                            height: "4px",
                            background: `${{ High: "#ff2d2d", Medium: "#ffc800", Low: "#00e676" }[level]}40`,
                            borderRadius: "2px",
                            marginTop: "0.2rem",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${prob}%`,
                              background: {
                                High: "#ff2d2d",
                                Medium: "#ffc800",
                                Low: "#00e676",
                              }[level],
                              borderRadius: "2px",
                              transition: "width 0.8s ease",
                            }}
                          />
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: "relative" }}>
        {loading && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 500,
              background: "rgba(6,13,26,0.8)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "1rem",
            }}
          >
            <div
              className="spinner"
              style={{ width: "48px", height: "48px", borderWidth: "4px" }}
            />
            <div
              style={{
                fontFamily: "Rajdhani, sans-serif",
                color: "#00b4ff",
                letterSpacing: "0.1em",
              }}
            >
              LOADING MAP DATA...
            </div>
          </div>
        )}

        <MapContainer
          center={[22.5, 80.5]}
          zoom={5}
          style={{ height: "100%", width: "100%" }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationFinder onLocationFound={setUserLocation} />

          {/* User location */}
          {userLocation && (
            <Marker position={userLocation} icon={userIcon}>
              <Popup>
                <div
                  style={{ fontFamily: "Inter, sans-serif", minWidth: "160px" }}
                >
                  <strong style={{ color: "#00b4ff" }}>📍 Your Location</strong>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "#7ba3c8",
                      marginTop: "0.25rem",
                    }}
                  >
                    {userLocation[0].toFixed(4)}, {userLocation[1].toFixed(4)}
                  </div>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Disaster Zones */}
          {filtered.map((disaster, i) => {
            if (!disaster.lat || !disaster.lng) return null;
            const color = SEVERITY_COLORS[disaster.severity] || "#ffc800";
            return (
              <Circle
                key={disaster.id || i}
                center={[parseFloat(disaster.lat), parseFloat(disaster.lng)]}
                radius={parseInt(disaster.radius) || 5000}
                pathOptions={{
                  color: color,
                  fillColor: color,
                  fillOpacity: 0.15,
                  weight: 2,
                  dashArray: disaster.severity === "Low" ? "8,4" : undefined,
                }}
              >
                <Popup>
                  <div
                    style={{
                      fontFamily: "Inter, sans-serif",
                      minWidth: "220px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <span style={{ fontSize: "1.2rem" }}>
                        {DISASTER_ICONS[disaster.type] || "⚠️"}
                      </span>
                      <strong style={{ color: color, fontSize: "1rem" }}>
                        {disaster.type}
                      </strong>
                      <span
                        style={{
                          fontSize: "0.7rem",
                          padding: "0.15rem 0.4rem",
                          background: `${color}20`,
                          border: `1px solid ${color}40`,
                          borderRadius: "3px",
                          color: color,
                          fontWeight: 700,
                        }}
                      >
                        {disaster.severity}
                      </span>
                    </div>
                    {disaster.location_name && (
                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: "#7ba3c8",
                          marginBottom: "0.4rem",
                        }}
                      >
                        📍 {disaster.location_name}
                      </div>
                    )}
                    <p
                      style={{
                        fontSize: "0.8rem",
                        color: "#e8f4ff",
                        lineHeight: 1.5,
                        marginBottom: "0.4rem",
                      }}
                    >
                      {disaster.description}
                    </p>
                    <div style={{ fontSize: "0.7rem", color: "#3d6080" }}>
                      🕐 {new Date(disaster.timestamp).toLocaleString("en-IN")}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "#3d6080" }}>
                      📏 Radius: {(parseInt(disaster.radius) / 1000).toFixed(1)}{" "}
                      km
                    </div>
                  </div>
                </Popup>
              </Circle>
            );
          })}

          {/* Shelters */}
          {showShelters &&
            shelters.map((shelter, i) => (
              <Marker
                key={shelter.id || i}
                position={[parseFloat(shelter.lat), parseFloat(shelter.lng)]}
                icon={shelterIcon}
              >
                <Popup>
                  <div
                    style={{
                      fontFamily: "Inter, sans-serif",
                      minWidth: "200px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <span>🏥</span>
                      <strong style={{ color: "#00e676", fontSize: "0.95rem" }}>
                        {shelter.name}
                      </strong>
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#7ba3c8" }}>
                      <div>
                        📊 Capacity: {shelter.current_occupancy || 0}/
                        {shelter.capacity}
                      </div>
                      <div>👤 {shelter.contact_person}</div>
                      <div>📞 {shelter.contact}</div>
                      <div style={{ marginTop: "0.3rem" }}>
                        🎒 {shelter.supplies?.join(", ") || "Basic supplies"}
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

          {/* Volunteers */}
          {showVolunteers &&
            volunteers.map((vol, i) => (
              <Marker
                key={vol.id || i}
                position={[parseFloat(vol.lat), parseFloat(vol.lng)]}
                icon={volunteerIcon}
              >
                <Popup>
                  <div
                    style={{
                      fontFamily: "Inter, sans-serif",
                      minWidth: "180px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        marginBottom: "0.4rem",
                      }}
                    >
                      <span>🙋</span>
                      <strong style={{ color: "#ffc800", fontSize: "0.95rem" }}>
                        {vol.name}
                      </strong>
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#7ba3c8" }}>
                      <div
                        style={{
                          color: vol.availability ? "#00e676" : "#ff2d2d",
                          fontWeight: 700,
                        }}
                      >
                        {vol.availability ? "✅ Available" : "⏸️ Unavailable"}
                      </div>
                      <div>
                        ⭐ {vol.rating} ({vol.missions_completed} missions)
                      </div>
                      <div>📞 {vol.contact}</div>
                      <div>🎒 {vol.supplies?.join(", ")}</div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
        </MapContainer>

        {/* Map stats overlay */}
        <div
          style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            background: "rgba(6,13,26,0.9)",
            border: "1px solid #1a3355",
            borderRadius: "8px",
            padding: "0.75rem",
            zIndex: 400,
            minWidth: "140px",
          }}
        >
          <div
            style={{
              fontSize: "0.65rem",
              color: "#7ba3c8",
              fontFamily: "Rajdhani, sans-serif",
              letterSpacing: "0.1em",
              marginBottom: "0.5rem",
              textTransform: "uppercase",
            }}
          >
            Map Status
          </div>
          {[
            { label: "Disasters", value: filtered.length, color: "#ff2d2d" },
            { label: "Shelters", value: shelters.length, color: "#00e676" },
            { label: "Volunteers", value: volunteers.length, color: "#ffc800" },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.25rem",
              }}
            >
              <span style={{ fontSize: "0.75rem", color: "#7ba3c8" }}>
                {stat.label}
              </span>
              <span
                style={{
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: "0.8rem",
                  color: stat.color,
                  fontWeight: 700,
                }}
              >
                {stat.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
