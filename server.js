'use strict';

// Multiplayer relay server for Da Lat Suong Mu.
// Deploy behind HTTPS/WSS on Render, Railway, Fly.io, or a VPS.
const http = require('http');
const { WebSocketServer, WebSocket } = require('ws');
const { randomUUID } = require('crypto');

const PORT = Number(process.env.PORT || 8080);
const MAX_PLAYERS_PER_ROOM = Number(process.env.MAX_PLAYERS_PER_ROOM || 64);
const MAX_MESSAGE_BYTES = 2048;
const rooms = new Map();
const clients = new Map();

const server = http.createServer((req, res) => {
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({ ok: true, service: 'dalat-suong-mu-multiplayer', rooms: rooms.size, players: clients.size }));
  }
  res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
  res.end('Not found');
});

const wss = new WebSocketServer({
  server,
  path: '/ws',
  maxPayload: MAX_MESSAGE_BYTES,
  perMessageDeflate: false,
});

function cleanText(value, max, fallback) {
  return String(value ?? fallback).replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, max) || fallback;
}
function finite(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(-10000, Math.min(10000, n)) : fallback;
}
function playerView(c) {
  return {
    id: c.id, name: c.name, x: c.x, y: c.y, z: c.z,
    face: c.face, run: c.run, seated: c.seated,
    jacket: c.jacket, scarf: c.scarf,
  };
}
function roomPlayers(room) {
  const set = rooms.get(room);
  return set ? [...set].filter(c => c.ws.readyState === WebSocket.OPEN).map(playerView) : [];
}
function send(ws, data) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(data));
}
function broadcastRoom(room) {
  const set = rooms.get(room);
  if (!set) return;
  const payload = JSON.stringify({ type: 'players', players: roomPlayers(room) });
  for (const c of set) if (c.ws.readyState === WebSocket.OPEN) c.ws.send(payload);
}
function removeClient(c) {
  if (!c || !clients.has(c.id)) return;
  clients.delete(c.id);
  const set = rooms.get(c.room);
  if (set) {
    set.delete(c);
    if (!set.size) rooms.delete(c.room);
    else broadcastRoom(c.room);
  }
}

wss.on('connection', (ws, req) => {
  const c = {
    id: randomUUID(), ws, room: null, name: 'Lữ khách',
    x: 0, y: 0, z: 0, face: 0, run: false, seated: false,
    jacket: 0, scarf: 0, lastStateAt: 0, alive: true,
  };
  ws.on('pong', () => { c.alive = true; });
  ws.on('message', raw => {
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch { return; }
    if (!msg || typeof msg !== 'object') return;

    if (msg.type === 'join') {
      if (c.room) return;
      const room = cleanText(msg.room, 24, 'dalat').toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'dalat';
      let set = rooms.get(room);
      if (!set) { set = new Set(); rooms.set(room, set); }
      if (set.size >= MAX_PLAYERS_PER_ROOM) {
        send(ws, { type: 'notice', message: 'Phòng đã đủ người. Hãy thử phòng khác.' });
        ws.close(1008, 'Room full');
        return;
      }
      c.room = room;
      c.name = cleanText(msg.name, 16, 'Lữ khách');
      c.jacket = Math.max(0, Math.min(4, Number(msg.jacket) | 0));
      c.scarf = Math.max(0, Math.min(4, Number(msg.scarf) | 0));
      set.add(c);
      clients.set(c.id, c);
      send(ws, { type: 'welcome', id: c.id, room, players: roomPlayers(room).filter(p => p.id !== c.id) });
      broadcastRoom(room);
      return;
    }

    if (msg.type === 'state' && c.room) {
      const now = Date.now();
      if (now - c.lastStateAt < 65) return; // rate limit per client
      c.lastStateAt = now;
      c.x = finite(msg.x, c.x); c.y = finite(msg.y, c.y); c.z = finite(msg.z, c.z);
      c.face = finite(msg.face, c.face);
      c.run = !!msg.run; c.seated = !!msg.seated;
      c.jacket = Math.max(0, Math.min(4, Number(msg.jacket) | 0));
      c.scarf = Math.max(0, Math.min(4, Number(msg.scarf) | 0));
      broadcastRoom(c.room);
    }
  });
  ws.on('close', () => removeClient(c));
  ws.on('error', () => removeClient(c));
});

const heartbeat = setInterval(() => {
  for (const c of clients.values()) {
    if (!c.alive) { c.ws.terminate(); removeClient(c); continue; }
    c.alive = false;
    c.ws.ping();
  }
}, 30000);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Da Lat Suong Mu Multiplayer listening on :${PORT}`);
});
server.on('close', () => clearInterval(heartbeat));
