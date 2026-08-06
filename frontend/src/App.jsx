import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Login from "./components/Login";
import Home from "./pages/Home";
import MemoryMap from "./components/MemoryMap";

function App() {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("orkis_token");
    const stored = localStorage.getItem("orkis_user");
    if (token && stored) {
      try { return JSON.parse(stored); } catch { return null; }
    }
    return null;
  });
  const [mapOpen, setMapOpen] = useState(false);

  const handleLoginSuccess = (userData) => {
    localStorage.setItem("orkis_user", JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    ["orkis_token", "orkis_refresh", "orkis_user"].forEach(k => localStorage.removeItem(k));
    setUser(null);
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Public — redirect to /home if already logged in */}
        <Route
          path="/login"
          element={user ? <Navigate to="/home" replace /> : <Login onLoginSuccess={handleLoginSuccess} />}
        />

        {/* Protected — redirect to /login if not logged in */}
        <Route
          path="/home"
          element={
            user
              ? <>
                  <Home user={user} onLogout={handleLogout} onOpenMap={() => setMapOpen(true)} />
                  {mapOpen && <MemoryMap onBack={() => setMapOpen(false)} />}
                </>
              : <Navigate to="/login" replace />
          }
        />

        {/* Default */}
        <Route path="*" element={<Navigate to={user ? "/home" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
