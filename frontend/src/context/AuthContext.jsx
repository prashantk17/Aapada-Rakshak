// context/AuthContext.jsx — Authentication & Role Management
import { createContext, useContext, useState, useEffect } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import api from "../utils/api";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState("citizen");
  const [loading, setLoading] = useState(true);

  // Demo mode: allow app to work without Firebase
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setUserRole("citizen");
        setLoading(false);
        return;
      }

      let role = localStorage.getItem("userRole") || "citizen";

      try {
        try {
  const res = await api.get(`/user-role?email=${firebaseUser.email}`);
  role = res.role || "citizen";
  localStorage.setItem("userRole", role);
} catch (err) {
  console.warn("Role fetch failed:", err);
}
      } catch (err) {
        console.warn("Role fetch failed:", err);
      }

      setUser({ ...firebaseUser, role });
      setUserRole(role);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUp = async (email, password, name, role = "citizen") => {
    const result = await createUserWithEmailAndPassword(auth, email, password);

    await updateProfile(result.user, { displayName: name });

    await setDoc(doc(db, "users", result.user.uid), {
      name,
      email,
      role,
      created_at: new Date().toISOString(),
      location: null,
    });

    // Let onAuthStateChanged handle state update
    return result.user;
  };

  const signIn = async (email, password) => {
    if (demoMode) {
      let role = "citizen";
      if (email.includes("admin")) role = "admin";
      else if (email.includes("volunteer")) role = "volunteer";

      const demoUser = {
        uid: "demo-" + Date.now(),
        email,
        displayName: email.split("@")[0],
        role,
      };

      setUser(demoUser);
      setUserRole(role);
      return demoUser;
    }

    // 🔹 Login using Firebase
    const result = await signInWithEmailAndPassword(auth, email, password);

    // 🔹 Get role from Firestore
    let role = "citizen";

try {
  const res = await api.get(`/user-role?email=${result.user.email}`);
  role = res.role || "citizen";
} catch (err) {
  console.warn("Role fetch failed:", err);
}

    localStorage.setItem("userRole", role);

    setUserRole(role);
    setUser({ ...result.user, role });

    return result.user;
  };

  const logout = async () => {
    if (demoMode) {
      setUser(null);
      setUserRole("citizen");
      return;
    }
    localStorage.removeItem("userRole");
    await signOut(auth);
  };

  // Quick demo login
  const demoLogin = (role) => {
    const demos = {
      admin: {
        uid: "demo-admin",
        email: "admin@aapada.gov.in",
        displayName: "Admin Officer",
        role: "admin",
      },
      volunteer: {
        uid: "demo-vol",
        email: "volunteer@test.com",
        displayName: "Priya Volunteer",
        role: "volunteer",
      },
      citizen: {
        uid: "demo-cit",
        email: "citizen@test.com",
        displayName: "Ramesh Citizen",
        role: "citizen",
      },
    };
    const demoUser = demos[role] || demos.citizen;
    setUser(demoUser);
    setUserRole(demoUser.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userRole,
        loading,
        demoMode,
        signUp,
        signIn,
        logout,
        demoLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
