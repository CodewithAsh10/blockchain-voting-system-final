import React, { useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import VoterInterface from './components/VoterInterface';
import './App.css';
import io from 'socket.io-client';

const socket = io('http://localhost:5001');

function App() {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [blockCount, setBlockCount] = useState(0);
  const [highlight, setHighlight] = useState(false);

  useEffect(() => {
    socket.on('block_mined', (data) => {
      setBlockCount(data.block_count);
      setHighlight(true);
      setTimeout(() => setHighlight(false), 2000);
    });

    // Check if user is logged in from localStorage
    const savedUser = localStorage.getItem('user');
    const savedUserType = localStorage.getItem('userType');
    if (savedUser && savedUserType) {
      setUser(JSON.parse(savedUser));
      setUserType(savedUserType);
    }

    return () => {
      socket.off('block_mined');
    };
  }, []);

  const handleLogin = (userData, type) => {
    setUser(userData);
    setUserType(type);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('userType', type);
  };

  const handleLogout = () => {
    setUser(null);
    setUserType(null);
    localStorage.removeItem('user');
    localStorage.removeItem('userType');
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  if (userType === 'admin') {
    return (
      <AdminDashboard 
        user={user} 
        onLogout={handleLogout} 
        blockCount={blockCount}
        highlight={highlight}
      />
    );
  }

  // ... existing code ...

if (userType === 'admin') {
  return (
    <AdminDashboard 
      user={user} 
      onLogout={handleLogout} 
    />
  );
}

// ... existing code ...
  return (
    <VoterInterface 
      user={user} 
      onLogout={handleLogout}
      blockCount={blockCount}
      highlight={highlight}
    />
  );
}

export default App;