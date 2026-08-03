import { useState } from "react";
import Login from "./components/Login";
import Home from "./components/Home";

function App() {
  const [user, setUser] = useState(() => {
    // Restore session if token exists
    const token = localStorage.getItem("orkis_token");
    const stored = localStorage.getItem("orkis_user");
    if (token && stored) {
      try { return JSON.parse(stored); } catch { return null; }
    }
    return null;
  });

  const handleLoginSuccess = (userData) => {
    localStorage.setItem("orkis_user", JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("orkis_user");
    setUser(null);
  };

  if (user) {
    return <Home user={user} onLogout={handleLogout} />;
  }

  return <Login onLoginSuccess={handleLoginSuccess} />;
}

export default App;