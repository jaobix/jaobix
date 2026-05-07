import React, { useState, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useAuthStore } from '../store';

export default function MapGrid({ campaignId }) {
  const canvasRef = useRef(null);
  const [tokens, setTokens] = useState([]);
  const [mapId, setMapId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedTokenIndex, setDraggedTokenIndex] = useState(null);
  const [socket, setSocket] = useState(null);
  const { token } = useAuthStore();

  const gridSize = 50;

  useEffect(() => {
    // Load map and initial tokens
    axios.get(`http://localhost:3001/api/maps/campaign/${campaignId}`, {
        headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
        setMapId(res.data.map.id);
        const loadedTokens = res.data.tokens.map(t => {
            let info = { color: 'red', label: 'Token' };
            try { info = JSON.parse(t.image_url); } catch(e){}
            return { x: t.x, y: t.y, color: info.color, label: info.label };
        });
        setTokens(loadedTokens);
    }).catch(console.error);

    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.emit('join_campaign', campaignId);

    newSocket.on('update_tokens', (newTokens) => {
      setTokens(newTokens);
    });

    return () => newSocket.close();
  }, [campaignId, token]);

  useEffect(() => {
    drawGrid();
  }, [tokens]);

  const drawGrid = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background (could be map image, using gray for now)
    ctx.fillStyle = '#4B5563';
    ctx.fillRect(0, 0, width, height);

    // Draw Grid Lines
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw Tokens
    tokens.forEach((token, index) => {
      ctx.fillStyle = token.color || 'red';
      ctx.beginPath();
      ctx.arc(
        token.x * gridSize + gridSize / 2,
        token.y * gridSize + gridSize / 2,
        gridSize / 2.2, 0, 2 * Math.PI
      );
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();

      if (token.label) {
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '12px Arial';
        ctx.fillText(token.label[0], token.x * gridSize + gridSize / 2, token.y * gridSize + gridSize / 2);
      }
    });
  };

  const getMousePos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleMouseDown = (e) => {
    const pos = getMousePos(e);
    const gridX = Math.floor(pos.x / gridSize);
    const gridY = Math.floor(pos.y / gridSize);

    const tokenIndex = tokens.findIndex(t => t.x === gridX && t.y === gridY);
    if (tokenIndex !== -1) {
      setIsDragging(true);
      setDraggedTokenIndex(tokenIndex);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging || draggedTokenIndex === null) return;
  };

  const handleMouseUp = (e) => {
    if (!isDragging || draggedTokenIndex === null) return;

    const pos = getMousePos(e);
    const gridX = Math.floor(pos.x / gridSize);
    const gridY = Math.floor(pos.y / gridSize);

    const newTokens = [...tokens];
    newTokens[draggedTokenIndex].x = gridX;
    newTokens[draggedTokenIndex].y = gridY;

    setTokens(newTokens);
    setIsDragging(false);
    setDraggedTokenIndex(null);

    // Broadcast and save to db
    if (socket && mapId) {
      socket.emit('update_tokens', { campaignId, mapId, tokens: newTokens });
    }
  };

  const addToken = () => {
    const newTokens = [...tokens, { x: 0, y: 0, color: '#' + Math.floor(Math.random()*16777215).toString(16), label: 'Hero' }];
    setTokens(newTokens);
    if (socket && mapId) {
      socket.emit('update_tokens', { campaignId, mapId, tokens: newTokens });
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="mb-4">
        <button onClick={addToken} className="bg-green-600 px-4 py-2 rounded text-white font-bold">Add Token</button>
      </div>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="border-2 border-gray-600 cursor-crosshair bg-gray-700"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
    </div>
  );
}
