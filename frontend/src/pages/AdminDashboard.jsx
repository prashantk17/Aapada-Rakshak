// pages/AdminDashboard.jsx
import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Circle, useMapEvents } from "react-leaflet";
import {
  disasterAPI,
  shelterAPI,
  analyticsAPI,
  historyAPI,
  usersAPI,
} from "../utils/api";
import { useAuth } from "../context/AuthContext";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { useNavigate } from "react-router-dom";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: "#7ba3c8",
        font: { family: "Rajdhani, sans-serif", size: 12 },
      },
    },
  },
  scales: {
    x: { ticks: { color: "#7ba3c8" }, grid: { color: "#1a3355" } },
    y: { ticks: { color: "#7ba3c8" }, grid: { color: "#1a3355" } },
  },
};

function MapClickHandler({ onMapClick }) {
  useMapEvents({ click: (e) => onMapClick(e.latlng) });
  return null;
}

const TABS = ["overview", "create-disaster", "shelters", "history"];

export default function AdminDashboard() {
  const { userRole } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [analytics, setAnalytics] = useState(null);
  const [disasters, setDisasters] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clickedLocation, setClickedLocation] = useState(null);
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");

  const [disasterForm, setDisasterForm] = useState({
    type: "Flood",
    severity: "Medium",
    description: "",
    location_name: "",
    lat: "",
    lng: "",
    radius: "5000",
  });
  const [shelterForm, setShelterForm] = useState({
    name: "",
    lat: "",
    lng: "",
    capacity: "",
    contact: "",
    contact_person: "",
    supplies: "",
    type: "Evacuation Center",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (userRole !== "admin") {
      // Allow viewing but show warning
    }
    const load = async () => {
      try {
        const [aRes, dRes, hRes, uRes] = await Promise.all([
          analyticsAPI.get(),
          disasterAPI.getAll(),
          historyAPI.get(),
          usersAPI.getAll(),
        ]);
        setAnalytics(aRes.data);
        setDisasters(dRes.data || []);
        setHistory(hRes.data || []);
        setUsers(uRes.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userRole]);

  const handleMapClick = (latlng) => {
    setClickedLocation(latlng);
    setDisasterForm((f) => ({
      ...f,
      lat: latlng.lat.toFixed(5),
      lng: latlng.lng.toFixed(5),
    }));
    setShelterForm((f) => ({
      ...f,
      lat: latlng.lat.toFixed(5),
      lng: latlng.lng.toFixed(5),
    }));
  };

  const handleCreateDisaster = async () => {
    if (!disasterForm.lat || !disasterForm.description) return;
    setSubmitting(true);
    try {
      const res = await disasterAPI.create(disasterForm);
      setDisasters((d) => [res.data, ...d]);
      setSuccess("Disaster alert created successfully!");
      setDisasterForm((f) => ({ ...f, description: "", location_name: "" }));
      setTimeout(() => setSuccess(""), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateShelter = async () => {
    if (!shelterForm.name || !shelterForm.lat) return;
    setSubmitting(true);
    try {
      const res = await shelterAPI.create({
        ...shelterForm,
        capacity: parseInt(shelterForm.capacity),
        supplies: shelterForm.supplies
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      });
      setSuccess("Shelter added successfully!");
      setShelterForm((f) => ({
        ...f,
        name: "",
        contact: "",
        contact_person: "",
      }));
      setTimeout(() => setSuccess(""), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDisaster = async (id) => {
    if (!window.confirm("Delete this disaster alert?")) return;
    try {
      await disasterAPI.delete(id);
      setDisasters((d) => d.filter((x) => x.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const monthlyChartData = {
    labels: analytics?.monthly_trend?.map((m) => m.month) || [],
    datasets: [
      {
        label: "Disasters",
        data: analytics?.monthly_trend?.map((m) => m.count) || [],
        backgroundColor: "rgba(0, 180, 255, 0.2)",
        borderColor: "#00b4ff",
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const typeChartData = {
    labels: Object.keys(analytics?.disasters_by_type || {}),
    datasets: [
      {
        data: Object.values(analytics?.disasters_by_type || {}),
        backgroundColor: [
          "#ff2d2d",
          "#00b4ff",
          "#ffc800",
          "#ff7d00",
          "#cc66ff",
        ],
        borderWidth: 0,
      },
    ],
  };

  const severityChartData = {
    labels: ["High", "Medium", "Low"],
    datasets: [
      {
        label: "Count",
        data: [
          analytics?.disasters_by_severity?.High || 0,
          analytics?.disasters_by_severity?.Medium || 0,
          analytics?.disasters_by_severity?.Low || 0,
        ],
        backgroundColor: [
          "rgba(255,45,45,0.7)",
          "rgba(255,200,0,0.7)",
          "rgba(0,180,255,0.7)",
        ],
        borderColor: ["#ff2d2d", "#ffc800", "#00b4ff"],
        borderWidth: 1,
      },
    ],
  };

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

  const statCards = [
    {
      label: "Total Disasters",
      value: analytics?.total_disasters || 0,
      icon: "⚠️",
      color: "#ff2d2d",
    },
    {
      label: "Affected Citizens",
      value: (analytics?.affected_citizens || 0).toLocaleString("en-IN"),
      icon: "👥",
      color: "#ff7d00",
    },
    {
      label: "Volunteers",
      value: analytics?.total_volunteers || 0,
      icon: "🙋",
      color: "#00e676",
    },
    {
      label: "Active Shelters",
      value: analytics?.total_shelters || 0,
      icon: "🏥",
      color: "#00b4ff",
    },
    {
      label: "Registered Users",
      value: analytics?.total_users || users.length || 0,
      icon: "🔐",
      color: "#cc66ff",
    },
    {
      label: "SOS Today",
      value: analytics?.sos_alerts_today || 0,
      icon: "🆘",
      color: "#ffc800",
    },
  ];

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
          width: "200px",
          flexShrink: 0,
          background: "#060d1a",
          borderRight: "1px solid #1a3355",
          padding: "1rem 0",
        }}
      >
        <div style={{ padding: "0 1rem", marginBottom: "1rem" }}>
          <div
            style={{
              fontSize: "0.65rem",
              color: "#7ba3c8",
              fontFamily: "Rajdhani, sans-serif",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: "0.5rem",
            }}
          >
            Admin Panel
          </div>
        </div>
        {[
          { id: "overview", label: "Overview", icon: "📊" },
          { id: "create-disaster", label: "Create Alert", icon: "⚠️" },
          { id: "shelters", label: "Add Shelter", icon: "🏥" },
          { id: "users", label: "Users", icon: "👥" },
          { id: "history", label: "History", icon: "📅" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              width: "100%",
              textAlign: "left",
              padding: "0.7rem 1rem",
              background:
                activeTab === tab.id ? "rgba(0,180,255,0.1)" : "transparent",
              border: "none",
              borderRight:
                activeTab === tab.id
                  ? "3px solid #00b4ff"
                  : "3px solid transparent",
              color: activeTab === tab.id ? "#00b4ff" : "#7ba3c8",
              fontFamily: "Rajdhani, sans-serif",
              fontWeight: 700,
              fontSize: "0.85rem",
              letterSpacing: "0.05em",
              cursor: "pointer",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
            }}
          >
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}

        {userRole !== "admin" && (
          <div
            style={{
              margin: "1rem",
              padding: "0.75rem",
              background: "rgba(255,200,0,0.05)",
              border: "1px solid rgba(255,200,0,0.2)",
              borderRadius: "4px",
              fontSize: "0.7rem",
              color: "#ffc800",
            }}
          >
            ⚠️ View-only. Admin login required for full access.
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto", padding: "1.5rem" }}>
        {success && (
          <div
            style={{
              padding: "0.75rem 1rem",
              background: "rgba(0,230,118,0.1)",
              border: "1px solid rgba(0,230,118,0.3)",
              borderRadius: "6px",
              color: "#00e676",
              marginBottom: "1rem",
              animation: "fadeIn 0.3s ease",
              fontFamily: "Rajdhani, sans-serif",
              fontWeight: 600,
            }}
          >
            ✅ {success}
          </div>
        )}

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div>
            <h2 className="section-title">Dashboard Overview</h2>

            {loading ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  padding: "4rem",
                }}
              >
                <div
                  className="spinner"
                  style={{ width: "56px", height: "56px", borderWidth: "4px" }}
                />
              </div>
            ) : (
              <>
                {/* Stats */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "1rem",
                    marginBottom: "1.5rem",
                  }}
                >
                  {statCards.map((stat, i) => (
                    <div
                      key={i}
                      className="card"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        borderColor: `${stat.color}20`,
                      }}
                    >
                      <div
                        style={{
                          width: "44px",
                          height: "44px",
                          borderRadius: "8px",
                          background: `${stat.color}15`,
                          border: `1px solid ${stat.color}30`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1.2rem",
                          flexShrink: 0,
                        }}
                      >
                        {stat.icon}
                      </div>
                      <div>
                        <div
                          style={{
                            fontFamily: "Rajdhani, sans-serif",
                            fontSize: "1.6rem",
                            fontWeight: 700,
                            color: stat.color,
                            lineHeight: 1,
                          }}
                        >
                          {stat.value}
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#7ba3c8" }}>
                          {stat.label}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Charts */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr 1fr",
                    gap: "1rem",
                    marginBottom: "1.5rem",
                  }}
                >
                  <div className="card">
                    <div
                      style={{
                        fontFamily: "Rajdhani, sans-serif",
                        fontWeight: 700,
                        marginBottom: "1rem",
                        color: "#7ba3c8",
                        fontSize: "0.85rem",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                      }}
                    >
                      Monthly Trend
                    </div>
                    <div style={{ height: "180px" }}>
                      <Line
                        data={monthlyChartData}
                        options={{
                          ...chartOptions,
                          plugins: {
                            ...chartOptions.plugins,
                            legend: { display: false },
                          },
                        }}
                      />
                    </div>
                  </div>
                  <div className="card">
                    <div
                      style={{
                        fontFamily: "Rajdhani, sans-serif",
                        fontWeight: 700,
                        marginBottom: "1rem",
                        color: "#7ba3c8",
                        fontSize: "0.85rem",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                      }}
                    >
                      By Type
                    </div>
                    <div style={{ height: "180px" }}>
                      <Doughnut
                        data={typeChartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: "bottom",
                              labels: {
                                color: "#7ba3c8",
                                font: { size: 10 },
                                padding: 8,
                              },
                            },
                          },
                        }}
                      />
                    </div>
                  </div>
                  <div className="card">
                    <div
                      style={{
                        fontFamily: "Rajdhani, sans-serif",
                        fontWeight: 700,
                        marginBottom: "1rem",
                        color: "#7ba3c8",
                        fontSize: "0.85rem",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                      }}
                    >
                      By Severity
                    </div>
                    <div style={{ height: "180px" }}>
                      <Bar
                        data={severityChartData}
                        options={{
                          ...chartOptions,
                          plugins: { legend: { display: false } },
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Active disasters table */}
                <div className="card">
                  <div
                    style={{
                      fontFamily: "Rajdhani, sans-serif",
                      fontWeight: 700,
                      marginBottom: "1rem",
                      fontSize: "0.9rem",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "#7ba3c8",
                    }}
                  >
                    Active Disaster Alerts
                  </div>
                  <div style={{ overflowX: "auto" }}>
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontSize: "0.82rem",
                      }}
                    >
                      <thead>
                        <tr style={{ borderBottom: "1px solid #1a3355" }}>
                          {[
                            "Type",
                            "Severity",
                            "Location",
                            "Radius",
                            "Date",
                            "Action",
                          ].map((h) => (
                            <th
                              key={h}
                              style={{
                                padding: "0.5rem 0.75rem",
                                textAlign: "left",
                                color: "#7ba3c8",
                                fontFamily: "Rajdhani, sans-serif",
                                fontWeight: 700,
                                letterSpacing: "0.08em",
                                fontSize: "0.72rem",
                                textTransform: "uppercase",
                              }}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {disasters.slice(0, 8).map((d) => (
                          <tr
                            key={d.id}
                            style={{ borderBottom: "1px solid #0d1b2e" }}
                          >
                            <td style={{ padding: "0.5rem 0.75rem" }}>
                              {DISASTER_ICONS[d.type]} {d.type}
                            </td>
                            <td style={{ padding: "0.5rem 0.75rem" }}>
                              <span
                                className={`badge badge-${d.severity?.toLowerCase()}`}
                              >
                                {d.severity}
                              </span>
                            </td>
                            <td
                              style={{
                                padding: "0.5rem 0.75rem",
                                color: "#7ba3c8",
                                maxWidth: "200px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {d.location_name ||
                                `${parseFloat(d.lat).toFixed(2)}, ${parseFloat(d.lng).toFixed(2)}`}
                            </td>
                            <td
                              style={{
                                padding: "0.5rem 0.75rem",
                                fontFamily: "JetBrains Mono, monospace",
                                color: "#7ba3c8",
                              }}
                            >
                              {(parseInt(d.radius) / 1000).toFixed(1)} km
                            </td>
                            <td
                              style={{
                                padding: "0.5rem 0.75rem",
                                color: "#3d6080",
                              }}
                            >
                              {new Date(d.timestamp || d.created_at).toLocaleDateString(
                                "en-IN",
                              )}
                            </td>
                            <td style={{ padding: "0.5rem 0.75rem" }}>
                              {userRole === "admin" && (
                                <button
                                  onClick={() => handleDeleteDisaster(d.id)}
                                  style={{
                                    background: "none",
                                    border: "1px solid rgba(255,45,45,0.3)",
                                    borderRadius: "3px",
                                    color: "#ff2d2d",
                                    cursor: "pointer",
                                    padding: "0.2rem 0.5rem",
                                    fontSize: "0.72rem",
                                  }}
                                >
                                  Delete
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* CREATE DISASTER TAB */}
        {activeTab === "create-disaster" && (
          <div>
            <h2 className="section-title">⚠️ Create Disaster Alert</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1.5rem",
              }}
            >
              <div>
                <div className="card" style={{ marginBottom: "1rem" }}>
                  <p
                    style={{
                      fontSize: "0.8rem",
                      color: "#7ba3c8",
                      marginBottom: "1rem",
                    }}
                  >
                    Click on the map to set coordinates, or enter them manually
                    below.
                  </p>
                  <div
                    style={{
                      height: "300px",
                      borderRadius: "6px",
                      overflow: "hidden",
                    }}
                  >
                    <MapContainer
                      center={[22.5, 80.5]}
                      zoom={4}
                      style={{ height: "100%", width: "100%" }}
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <MapClickHandler onMapClick={handleMapClick} />
                      {clickedLocation && (
                        <Circle
                          center={[clickedLocation.lat, clickedLocation.lng]}
                          radius={parseInt(disasterForm.radius) || 5000}
                          pathOptions={{
                            color:
                              {
                                High: "#ff2d2d",
                                Medium: "#ffc800",
                                Low: "#00b4ff",
                              }[disasterForm.severity] || "#ffc800",
                            fillOpacity: 0.2,
                            weight: 2,
                          }}
                        />
                      )}
                    </MapContainer>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Disaster Type</label>
                    <select
                      className="form-select"
                      value={disasterForm.type}
                      onChange={(e) =>
                        setDisasterForm((f) => ({ ...f, type: e.target.value }))
                      }
                    >
                      {[
                        "Flood",
                        "Landslide",
                        "Earthquake",
                        "Fire",
                        "Storm",
                      ].map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Severity</label>
                    <select
                      className="form-select"
                      value={disasterForm.severity}
                      onChange={(e) =>
                        setDisasterForm((f) => ({
                          ...f,
                          severity: e.target.value,
                        }))
                      }
                    >
                      {["High", "Medium", "Low"].map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Location Name</label>
                  <input
                    className="form-input"
                    placeholder="e.g. Shimla Hills, HP"
                    value={disasterForm.location_name}
                    onChange={(e) =>
                      setDisasterForm((f) => ({
                        ...f,
                        location_name: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Latitude *</label>
                    <input
                      className="form-input"
                      type="number"
                      step="any"
                      placeholder="Click map or enter"
                      value={disasterForm.lat}
                      onChange={(e) =>
                        setDisasterForm((f) => ({ ...f, lat: e.target.value }))
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Longitude *</label>
                    <input
                      className="form-input"
                      type="number"
                      step="any"
                      placeholder="Click map or enter"
                      value={disasterForm.lng}
                      onChange={(e) =>
                        setDisasterForm((f) => ({ ...f, lng: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Affected Radius (meters)</label>
                  <input
                    className="form-input"
                    type="number"
                    value={disasterForm.radius}
                    onChange={(e) =>
                      setDisasterForm((f) => ({ ...f, radius: e.target.value }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description *</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Describe the disaster situation..."
                    value={disasterForm.description}
                    onChange={(e) =>
                      setDisasterForm((f) => ({
                        ...f,
                        description: e.target.value,
                      }))
                    }
                  />
                </div>
                <button
                  className="btn btn-danger"
                  style={{ width: "100%", justifyContent: "center" }}
                  onClick={handleCreateDisaster}
                  disabled={
                    submitting || !disasterForm.lat || !disasterForm.description
                  }
                >
                  {submitting ? "⏳ Creating..." : "⚠️ Create Disaster Alert"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SHELTERS TAB */}
        {activeTab === "shelters" && (
          <div>
            <h2 className="section-title">🏥 Add Safe Shelter</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1.5rem",
              }}
            >
              <div>
                <div className="card" style={{ marginBottom: "1rem" }}>
                  <p
                    style={{
                      fontSize: "0.8rem",
                      color: "#7ba3c8",
                      marginBottom: "1rem",
                    }}
                  >
                    Click on the map to set shelter location.
                  </p>
                  <div
                    style={{
                      height: "300px",
                      borderRadius: "6px",
                      overflow: "hidden",
                    }}
                  >
                    <MapContainer
                      center={[22.5, 80.5]}
                      zoom={4}
                      style={{ height: "100%", width: "100%" }}
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <MapClickHandler onMapClick={handleMapClick} />
                    </MapContainer>
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="form-group">
                  <label className="form-label">Shelter Name *</label>
                  <input
                    className="form-input"
                    placeholder="e.g. Rajiv Gandhi Community Hall"
                    value={shelterForm.name}
                    onChange={(e) =>
                      setShelterForm((f) => ({ ...f, name: e.target.value }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select
                    className="form-select"
                    value={shelterForm.type}
                    onChange={(e) =>
                      setShelterForm((f) => ({ ...f, type: e.target.value }))
                    }
                  >
                    {[
                      "Evacuation Center",
                      "Medical Camp",
                      "Relief Station",
                      "Emergency Facility",
                    ].map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Latitude</label>
                    <input
                      className="form-input"
                      type="number"
                      step="any"
                      value={shelterForm.lat}
                      onChange={(e) =>
                        setShelterForm((f) => ({ ...f, lat: e.target.value }))
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Longitude</label>
                    <input
                      className="form-input"
                      type="number"
                      step="any"
                      value={shelterForm.lng}
                      onChange={(e) =>
                        setShelterForm((f) => ({ ...f, lng: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Capacity</label>
                    <input
                      className="form-input"
                      type="number"
                      placeholder="500"
                      value={shelterForm.capacity}
                      onChange={(e) =>
                        setShelterForm((f) => ({
                          ...f,
                          capacity: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contact Number</label>
                    <input
                      className="form-input"
                      placeholder="+91-XXXXXXXXXX"
                      value={shelterForm.contact}
                      onChange={(e) =>
                        setShelterForm((f) => ({
                          ...f,
                          contact: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Person</label>
                  <input
                    className="form-input"
                    placeholder="Name of in-charge"
                    value={shelterForm.contact_person}
                    onChange={(e) =>
                      setShelterForm((f) => ({
                        ...f,
                        contact_person: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Supplies (comma separated)
                  </label>
                  <input
                    className="form-input"
                    placeholder="Food, Water, Medicine, Blankets"
                    value={shelterForm.supplies}
                    onChange={(e) =>
                      setShelterForm((f) => ({
                        ...f,
                        supplies: e.target.value,
                      }))
                    }
                  />
                </div>
                <button
                  className="btn btn-success"
                  style={{ width: "100%", justifyContent: "center" }}
                  onClick={handleCreateShelter}
                  disabled={submitting || !shelterForm.name || !shelterForm.lat}
                >
                  {submitting ? "⏳ Adding..." : "🏥 Add Shelter"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === "users" && (
          <div>
            <h2 className="section-title">👥 Registered Users</h2>

            <div
              style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}
            >
              <input
                className="form-input"
                placeholder="Search users..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />

              <select
                className="form-select"
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="citizen">Citizens</option>
                <option value="volunteer">Volunteers</option>
                <option value="admin">Admins</option>
              </select>
            </div>

            <div className="card">
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #1a3355" }}>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>City</th>
                  </tr>
                </thead>

                <tbody>
                  {users
                    .filter((u) => {
                      const q = userSearch.toLowerCase();
                      const searchMatch =
                        !q ||
                        u.name?.toLowerCase().includes(q) ||
                        u.email?.toLowerCase().includes(q);

                      const roleMatch =
                        userRoleFilter === "all" || u.role === userRoleFilter;

                      return searchMatch && roleMatch;
                    })
                    .map((u) => (
                      <tr key={u.id || u.uid}>
                        <td>{u.name}</td>
                        <td>{u.email}</td>
                        <td>{u.role}</td>
                        <td>{u.city}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === "history" && (
          <div>
            <h2 className="section-title">📅 Disaster History</h2>
            <div className="card">
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "0.82rem",
                  }}
                >
                  <thead>
                    <tr style={{ borderBottom: "1px solid #1a3355" }}>
                      {[
                        "#",
                        "Type",
                        "Location",
                        "Severity",
                        "Rainfall",
                        "Elevation",
                        "Casualties",
                        "Date",
                        "Risk",
                      ].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: "0.5rem 0.75rem",
                            textAlign: "left",
                            color: "#7ba3c8",
                            fontFamily: "Rajdhani, sans-serif",
                            fontWeight: 700,
                            letterSpacing: "0.06em",
                            fontSize: "0.7rem",
                            textTransform: "uppercase",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #0d1b2e" }}>
                        <td
                          style={{
                            padding: "0.5rem 0.75rem",
                            color: "#3d6080",
                            fontFamily: "JetBrains Mono, monospace",
                          }}
                        >
                          {h.id}
                        </td>
                        <td style={{ padding: "0.5rem 0.75rem" }}>
                          {
                            {
                              Landslide: "🏔️",
                              Flood: "🌊",
                              Earthquake: "🌍",
                              Fire: "🔥",
                              Storm: "⛈️",
                            }[h.type]
                          }{" "}
                          {h.type}
                        </td>
                        <td
                          style={{
                            padding: "0.5rem 0.75rem",
                            color: "#7ba3c8",
                            fontFamily: "JetBrains Mono, monospace",
                            fontSize: "0.75rem",
                          }}
                        >
                          {parseFloat(h.latitude).toFixed(2)},{" "}
                          {parseFloat(h.longitude).toFixed(2)}
                        </td>
                        <td style={{ padding: "0.5rem 0.75rem" }}>
                          <span
                            className={`badge badge-${h.severity?.toLowerCase()}`}
                          >
                            {h.severity}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "0.5rem 0.75rem",
                            color: "#00b4ff",
                            fontFamily: "JetBrains Mono, monospace",
                          }}
                        >
                          {h.rainfall_mm}mm
                        </td>
                        <td
                          style={{
                            padding: "0.5rem 0.75rem",
                            color: "#7ba3c8",
                            fontFamily: "JetBrains Mono, monospace",
                          }}
                        >
                          {h.elevation_m}m
                        </td>
                        <td
                          style={{
                            padding: "0.5rem 0.75rem",
                            color:
                              parseInt(h.casualties) > 0
                                ? "#ff2d2d"
                                : "#00e676",
                            fontFamily: "JetBrains Mono, monospace",
                          }}
                        >
                          {h.casualties}
                        </td>
                        <td
                          style={{
                            padding: "0.5rem 0.75rem",
                            color: "#3d6080",
                          }}
                        >
                          {h.date}
                        </td>
                        <td style={{ padding: "0.5rem 0.75rem" }}>
                          <span
                            className={`badge badge-${h.risk_level?.toLowerCase()}`}
                          >
                            {h.risk_level}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
