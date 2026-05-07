import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store';

export default function Chat({ campaignId, onRoll }) {
  const { user } = useAuthStore();
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.emit('join_campaign', campaignId);

    newSocket.on('chat_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    // Provide a way for external components (like CharacterSheet) to trigger rolls
    if (onRoll) {
        onRoll.current = (rollString, label) => {
            handleRoll(rollString, label, newSocket);
        };
    }

    return () => newSocket.close();
  }, [campaignId, onRoll]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const parseAndRoll = (rollString) => {
    // Basic parser for things like 1d20+3 or 2d6-1
    const match = rollString.toLowerCase().match(/(\d+)d(\d+)([\+\-]\d+)?/);
    if (!match) return null;

    const count = parseInt(match[1]);
    const sides = parseInt(match[2]);
    const modifier = match[3] ? parseInt(match[3]) : 0;

    let total = 0;
    const rolls = [];
    for (let i = 0; i < count; i++) {
      const roll = Math.floor(Math.random() * sides) + 1;
      rolls.push(roll);
      total += roll;
    }
    total += modifier;

    return { total, rolls, modifier, formula: rollString };
  };

  const handleRoll = (rollString, label, activeSocket = socket) => {
      const result = parseAndRoll(rollString);
      if (result) {
        const msg = {
          campaignId,
          sender: user.username,
          message: `${label ? label + ': ' : ''}Rolled ${rollString}`,
          isRoll: true,
          rollResult: result,
          timestamp: new Date().toISOString()
        };
        activeSocket.emit('chat_message', msg);
      }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (input.startsWith('/r ') || input.startsWith('/roll ')) {
      const rollStr = input.replace(/^\/(r|roll)\s+/, '');
      if (parseAndRoll(rollStr)) {
          handleRoll(rollStr);
      } else {
          // Invalid roll format
          setMessages(prev => [...prev, { sender: 'System', message: 'Invalid roll format. Use e.g. 1d20+3', isRoll: false }]);
      }
    } else {
      socket.emit('chat_message', {
        campaignId,
        sender: user.username,
        message: input,
        isRoll: false,
        timestamp: new Date().toISOString()
      });
    }

    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 text-white border-t border-gray-700">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`p-2 rounded ${m.sender === 'System' ? 'bg-red-900 text-yellow-200' : 'bg-gray-700'}`}>
            <div className="text-xs text-gray-400 font-bold mb-1">{m.sender}</div>
            {m.isRoll ? (
              <div className="bg-gray-900 p-2 rounded border border-gray-600">
                <div className="font-bold">{m.message}</div>
                <div className="text-2xl text-center font-bold text-green-400 py-2">
                  {m.rollResult.total}
                </div>
                <div className="text-xs text-gray-400 text-center">
                  [{m.rollResult.rolls.join(', ')}] {m.rollResult.modifier !== 0 ? (m.rollResult.modifier > 0 ? `+${m.rollResult.modifier}` : m.rollResult.modifier) : ''}
                </div>
              </div>
            ) : (
              <div>{m.message}</div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="p-4 bg-gray-900 border-t border-gray-700 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type message or /r 1d20+3"
          className="flex-1 bg-gray-700 p-2 rounded focus:outline-none"
        />
        <button type="submit" className="bg-blue-600 px-4 py-2 rounded font-bold hover:bg-blue-700">
          Send
        </button>
      </form>
    </div>
  );
}
