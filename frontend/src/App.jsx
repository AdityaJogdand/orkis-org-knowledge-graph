import { useState, useEffect } from "react";
import Login from "./components/Login";
import Home from "./components/Home";
import MemoryMap from "./components/MemoryMap";

function App() {
  const [mapOpen, setMapOpen] = useState(false);
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("orkis_token");
    const stored = localStorage.getItem("orkis_user");
    if (token && stored) {
      try { return JSON.parse(stored); } catch { return null; }
    }
    return null;
  });
  const [visible, setVisible] = useState(true);
  const [pendingUser, setPendingUser] = useState(null);

  const handleLoginSuccess = (userData) => {
    setVisible(false);
    setPendingUser(userData);
  };

  const handleLogout = () => {
    setMapOpen(false);
    setVisible(false);
    setTimeout(() => {
      localStorage.removeItem("orkis_user");
      setUser(null);
      setVisible(true);
    }, 350);
  };

  useEffect(() => {
    if (!visible && pendingUser) {
      const t = setTimeout(() => {
        localStorage.setItem("orkis_user", JSON.stringify(pendingUser));
        setUser(pendingUser);
        setPendingUser(null);
        setVisible(true);
      }, 350);
      return () => clearTimeout(t);
    }
  }, [visible, pendingUser]);

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transition: "opacity 350ms ease",
      }}
    >
      {user
        ? <Home user={user} onLogout={handleLogout} onOpenMap={() => setMapOpen(true)} />
        : <Login onLoginSuccess={handleLoginSuccess} />
      }
      {/* MemoryMap mounts outside the fade-div so it covers the full viewport */}
      {user && mapOpen && <MemoryMap onBack={() => setMapOpen(false)} />}
    </div>
  );
}

export default App;