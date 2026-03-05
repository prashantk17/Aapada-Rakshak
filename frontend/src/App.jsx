// App.jsx — Main Application with Routing
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import SOSButton from "./components/SOSButton";
import AlertPopup from "./components/AlertPopup";
import Home from "./pages/Home";
import DisasterMap from "./pages/DisasterMap";
import Shelters from "./pages/Shelters";
import Volunteers from "./pages/Volunteers";
import ReliefFeed from "./pages/ReliefFeed";
import AdminDashboard from "./pages/AdminDashboard";
import UserDashboard from "./pages/UserDashboard";
import Login from "./pages/Login";
import { useState, useEffect } from "react";
import { disasterAPI } from "./utils/api";

function AppContent() {
  const { loading, user, userRole } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [alertDismissed, setAlertDismissed] = useState(false);

  // Load high-severity alerts on login
  useEffect(() => {
    if (user && !alertDismissed) {
      disasterAPI
        .getAll({ severity: "High" })
        .then((res) => {
          if (res.length) {
            setAlerts(res.slice(0, 3));
          }
        })
        .catch(() => {});
    }
  }, [user, alertDismissed]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.5rem",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            background: "linear-gradient(135deg, #cc0000, #ff2d2d)",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.8rem",
            boxShadow: "0 0 24px rgba(255,45,45,0.4)",
            animation: "pulse-red 2s infinite",
          }}
        >
          🛡️
        </div>
        <div className="spinner" />
        <div
          style={{
            fontFamily: "Rajdhani, sans-serif",
            color: "#7ba3c8",
            letterSpacing: "0.15em",
            fontSize: "0.85rem",
            textTransform: "uppercase",
          }}
        >
          Initializing Aapada Rakshak...
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      {/* Alert popup for high-severity disasters */}
      {user && !alertDismissed && alerts.length > 0 && (
        <AlertPopup alerts={alerts} onDismiss={() => setAlertDismissed(true)} />
      )}
      {/* SOS button (always visible when logged in) */}
      {user && <SOSButton />}

      <main style={{ paddingTop: "60px", minHeight: "calc(100vh - 60px)" }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/map" element={<DisasterMap />} />
          <Route path="/shelters" element={<Shelters />} />
          <Route path="/volunteers" element={<Volunteers />} />
          <Route path="/relief-feed" element={<ReliefFeed />} />
          <Route
            path="/admin"
            element={
              user ? (
                userRole === "admin" ? (
                  <AdminDashboard />
                ) : (
                  <Navigate to="/" />
                )
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/dashboard"
            element={user ? <UserDashboard /> : <Navigate to="/login" />}
          />
          <Route
            path="/login"
            element={user ? <Navigate to="/" /> : <Login />}
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer
        style={{
          background: "#060d1a",
          borderTop: "1px solid #1a3355",
          padding: "1rem 1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <div
          style={{
            fontFamily: "Rajdhani, sans-serif",
            fontWeight: 700,
            color: "#7ba3c8",
            fontSize: "0.8rem",
          }}
        >
          🛡️ AAPADA RAKSHAK — Disaster Management Platform
        </div>
        <div style={{ fontSize: "0.72rem", color: "#3d6080" }}>
          Final Year B.Tech Project · React + Flask + Firebase + Leaflet.js
        </div>
      </footer>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
