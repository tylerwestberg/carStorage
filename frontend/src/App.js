import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./components/CarDashboard";
import Login from "./components/Login";
import Profile from "./components/Profile";
import Navbar from "./components/Navbar";

function App() {
  // Always start logged out: clear any stored token on app mount
  const [token, setToken] = useState("");

  useEffect(() => {
    localStorage.removeItem("token");
    setToken("");
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken("");
  };

  return (
    <Router>
      {token && <Navbar onLogout={handleLogout} />}
      <Routes>
        <Route path="/login" element={<Login setToken={setToken} />} />
        <Route path="/" element={token ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/profile" element={token ? <Profile /> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
