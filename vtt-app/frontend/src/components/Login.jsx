import React, { useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('player');
  const [error, setError] = useState('');
  const login = useAuthStore(state => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        const res = await axios.post('http://localhost:3001/api/auth/login', { username, password });
        login(res.data.user, res.data.token);
        navigate('/dashboard');
      } else {
        await axios.post('http://localhost:3001/api/auth/register', { username, password, role });
        setIsLogin(true);
        setError('Registration successful. Please login.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="p-8 bg-gray-800 rounded shadow-md w-96">
        <h2 className="text-2xl mb-4 font-bold">{isLogin ? 'Login' : 'Register'}</h2>
        {error && <p className="text-red-400 mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Username"
            className="p-2 bg-gray-700 rounded"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="p-2 bg-gray-700 rounded"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          {!isLogin && (
            <select
              className="p-2 bg-gray-700 rounded"
              value={role}
              onChange={e => setRole(e.target.value)}
            >
              <option value="player">Player</option>
              <option value="dm">Dungeon Master</option>
            </select>
          )}
          <button type="submit" className="bg-blue-600 p-2 rounded hover:bg-blue-700">
            {isLogin ? 'Login' : 'Register'}
          </button>
        </form>
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="mt-4 text-sm text-blue-400 hover:underline"
        >
          {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
        </button>
      </div>
    </div>
  );
}
