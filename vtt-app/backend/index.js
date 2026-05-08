require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const db = require('./db/database');

const authRoutes = require('./routes/auth');
const campaignRoutes = require('./routes/campaigns');
const characterRoutes = require('./routes/characters');
const mapRoutes = require('./routes/maps');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/characters', characterRoutes);
app.use('/api/maps', mapRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join_campaign', (campaignId) => {
    socket.join(`campaign_${campaignId}`);
  });

  socket.on('chat_message', (data) => {
    io.to(`campaign_${data.campaignId}`).emit('chat_message', data);
  });

  socket.on('update_tokens', (data) => {
     // data: { campaignId, mapId, tokens: [{id, x, y, color, label}, ...] }
     // Broadcast to clients
     io.to(`campaign_${data.campaignId}`).emit('update_tokens', data.tokens);

     // Save to database properly (avoiding delete-all)
     if (data.mapId && data.tokens) {
         // Because tokens can be added/removed, we first delete tokens that are NOT in the array
         // To keep it simple but safe for the MVP, we just update existing ones and insert new ones
         // And since tokens might not have an ID yet when first added by the client,
         // we just clear and re-insert, but using a transaction to avoid race conditions
         // causing temporary empty map reads for others.
         db.serialize(() => {
             db.run('BEGIN TRANSACTION');
             db.run('DELETE FROM tokens WHERE map_id = ?', [data.mapId]);

             if (data.tokens.length > 0) {
                 const stmt = db.prepare('INSERT INTO tokens (map_id, x, y, image_url) VALUES (?, ?, ?, ?)');
                 data.tokens.forEach(t => {
                     stmt.run(data.mapId, t.x, t.y, JSON.stringify({ color: t.color, label: t.label }));
                 });
                 stmt.finalize();
             }
             db.run('COMMIT');
         });
     }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
