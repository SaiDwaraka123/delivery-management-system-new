// frontend/src/AuthScreen.js
import React, { useState } from 'react';
import { saveUser } from './auth';

export default function AuthScreen({ onLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('buyer');

  const handleLogin = () => {
    if (!name.trim() || !email.trim()) {
      alert('Please enter name and email');
      return;
    }

    // map to seeded DB users
    let mappedUser;
    if (role === 'buyer') {
      mappedUser = { id: 3, name, email, role: 'buyer' };
    } else if (role === 'seller') {
      mappedUser = { id: 2, name, email, role: 'seller' };
    } else {
      mappedUser = { id: 1, name, email, role: 'admin' };
    }

    saveUser(mappedUser);
    onLogin(mappedUser);
  };

  return (
    <div style={{ padding: 40, maxWidth: 400, margin: '80px auto', background: 'white', borderRadius: 12 }}>
      <h2>Register / Login</h2>
      <p>Enter your name, email and select role.</p>

      <input
        style={{ width: '100%', padding: 8, margin: '8px 0' }}
        placeholder="Name"
        value={name}
        onChange={e => setName(e.target.value)}
      />
      <input
        style={{ width: '100%', padding: 8, margin: '8px 0' }}
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />

      <select
        style={{ width: '100%', padding: 8, margin: '8px 0' }}
        value={role}
        onChange={e => setRole(e.target.value)}
      >
        <option value="buyer">Buyer</option>
        <option value="seller">Seller</option>
        <option value="admin">Admin</option>
      </select>

      <button onClick={handleLogin} style={{ padding: '10px 20px', marginTop: 10 }}>
        Continue
      </button>
    </div>
  );
}



