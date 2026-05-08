import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../store';
import CharacterSheet from './CharacterSheet';
import MapGrid from './MapGrid';
import Chat from './Chat';

export default function Campaign() {
  const { id } = useParams();
  const { token, user } = useAuthStore();
  const navigate = useNavigate();
  const [characterId, setCharacterId] = useState(null);
  const [view, setView] = useState('map');

  const chatRollRef = useRef(null);

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }

    const checkCampaign = async () => {
      try {
        const res = await axios.get('http://localhost:3001/api/campaigns', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const campaigns = res.data;
        const myCampaign = campaigns.find(c => c.id === parseInt(id));

        if (!myCampaign) {
          navigate('/dashboard');
        } else {
           const charRes = await axios.get(`http://localhost:3001/api/characters/campaign/${id}`, {
               headers: { Authorization: `Bearer ${token}` }
           }).catch(() => null);

           if (charRes && charRes.data) {
               setCharacterId(charRes.data.id);
           } else if (user.role === 'player') {
               const joinRes = await axios.post(`http://localhost:3001/api/campaigns/${id}/join`, {}, {
                   headers: { Authorization: `Bearer ${token}` }
               });
               setCharacterId(joinRes.data.characterId);
           }
        }
      } catch (err) {
         console.error(err);
      }
    };

    checkCampaign();
  }, [id, token, user]);

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      {/* Sidebar: Chat */}
      <div className="w-80 bg-gray-800 flex flex-col border-r border-gray-700 h-full">
        <div className="p-4 border-b border-gray-700 font-bold flex justify-between">
          <span>Campaign #{id}</span>
          <button onClick={() => navigate('/dashboard')} className="text-xs bg-gray-600 px-2 py-1 rounded">Back</button>
        </div>
        <div className="flex-1 overflow-hidden">
          <Chat campaignId={id} onRoll={chatRollRef} />
        </div>
      </div>

      {/* Main Area: Grid or Character Sheet */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="bg-gray-800 p-4 flex gap-4 border-b border-gray-700 shrink-0">
          <button
            onClick={() => setView('map')}
            className={`px-4 py-2 rounded ${view === 'map' ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-500'}`}
          >
            Map
          </button>
          <button
            onClick={() => setView('sheet')}
            className={`px-4 py-2 rounded ${view === 'sheet' ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-500'}`}
          >
            Character Sheet
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 relative bg-gray-900">
            {view === 'map' && <MapGrid campaignId={id} />}
            {view === 'sheet' && <CharacterSheet characterId={characterId} chatRollRef={chatRollRef} />}
        </div>
      </div>
    </div>
  );
}
