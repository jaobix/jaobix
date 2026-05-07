import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user, token, logout } = useAuthStore();
  const [campaigns, setCampaigns] = useState([]);
  const [newCampaignName, setNewCampaignName] = useState('');
  const [joinCampaignId, setJoinCampaignId] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    fetchCampaigns();
  }, [token]);

  const fetchCampaigns = async () => {
    try {
      const res = await axios.get('http://localhost:3001/api/campaigns', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCampaigns(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3001/api/campaigns', { name: newCampaignName }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewCampaignName('');
      fetchCampaigns();
    } catch (err) {
      console.error(err);
    }
  };

  const handleJoinCampaign = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`http://localhost:3001/api/campaigns/${joinCampaignId}/join`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setJoinCampaignId('');
      fetchCampaigns();
    } catch (err) {
      console.error(err);
      alert('Failed to join. Make sure the ID is correct.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
        <h1 className="text-3xl font-bold">VTT Dashboard</h1>
        <div className="flex items-center gap-4">
          <span>Welcome, {user?.username} ({user?.role})</span>
          <button onClick={() => { logout(); navigate('/'); }} className="bg-red-600 px-4 py-2 rounded">Logout</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl mb-4">Your Campaigns</h2>
          {campaigns.length === 0 ? (
            <p className="text-gray-400">No campaigns found.</p>
          ) : (
            <ul className="space-y-4">
              {campaigns.map(c => (
                <li key={c.id} className="bg-gray-800 p-4 rounded flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold">{c.name}</h3>
                    <p className="text-sm text-gray-400">ID: {c.id}</p>
                  </div>
                  <button
                    onClick={() => navigate(`/campaign/${c.id}`)}
                    className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Enter
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          {user?.role === 'dm' ? (
            <div className="bg-gray-800 p-4 rounded">
              <h2 className="text-xl mb-4">Create Campaign</h2>
              <form onSubmit={handleCreateCampaign} className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 p-2 bg-gray-700 rounded"
                  placeholder="Campaign Name"
                  value={newCampaignName}
                  onChange={e => setNewCampaignName(e.target.value)}
                  required
                />
                <button type="submit" className="bg-green-600 px-4 py-2 rounded hover:bg-green-700">Create</button>
              </form>
            </div>
          ) : (
            <div className="bg-gray-800 p-4 rounded">
              <h2 className="text-xl mb-4">Join Campaign</h2>
              <form onSubmit={handleJoinCampaign} className="flex gap-2">
                <input
                  type="number"
                  className="flex-1 p-2 bg-gray-700 rounded"
                  placeholder="Campaign ID"
                  value={joinCampaignId}
                  onChange={e => setJoinCampaignId(e.target.value)}
                  required
                />
                <button type="submit" className="bg-green-600 px-4 py-2 rounded hover:bg-green-700">Join</button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
