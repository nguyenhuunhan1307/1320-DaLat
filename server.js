'use strict';

// Da Lat Suong Mu v9 — room relay for player state, vehicle/passenger sync,
// lightweight shared activity events, and WebRTC voice signaling.
const http = require('http');
const { WebSocketServer, WebSocket } = require('ws');
const { randomUUID } = require('crypto');

const PORT = Number(process.env.PORT || 8080);
const MAX_PLAYERS_PER_ROOM = Number(process.env.MAX_PLAYERS_PER_ROOM || 64);
const MAX_MESSAGE_BYTES = 65536;
const STATE_INTERVAL_MS = 75;
const rooms = new Map();
const clients = new Map();

const server = http.createServer((req, res) => {
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
    return res.end(JSON.stringify({ ok: true, service: 'dalat-suong-mu-v9-multiplayer', rooms: rooms.size, players: clients.size }));
  }
  res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
  res.end('Not found');
});

const wss = new WebSocketServer({ server, path: '/ws', maxPayload: MAX_MESSAGE_BYTES, perMessageDeflate: false });
function cleanText(value, max, fallback = '') {
  return String(value ?? fallback).replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, max) || fallback;
}
function finite(value, fallback = 0, min = -10000, max = 10000) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
}
function send(ws, data) { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(data)); }
function playerView(c) {
  return {
    id: c.id, name: c.name, x: c.x, y: c.y, z: c.z, face: c.face,
    run: c.run, seated: c.seated, lying: c.lying,
    jacket: c.jacket, scarf: c.scarf,
    rideIndex: c.rideIndex, vehicle: c.vehicle,
    passengerOf: c.passengerOf, seatIndex: c.seatIndex,
    fishing: c.fishing, fishCount: c.fishCount,
    activity: c.activity, mic: c.mic, talking: c.talking,
  };
}
function roomPlayers(room) {
  const set = rooms.get(room);
  return set ? [...set].filter(c => c.ws.readyState === WebSocket.OPEN).map(playerView) : [];
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
function broadcastEvent(room, from, event, data) {
  const set = rooms.get(room);
  if (!set) return;
  const payload = { type: 'event', from, event, data };
  for (const c of set) if (c.id !== from) send(c.ws, payload);
}

wss.on('connection', ws => {
  const c = {
    id: randomUUID(), ws, room: null, name: 'Lữ khách',
    x: 0, y: 0, z: 0, face: 0, run: false, seated: false, lying: false,
    jacket: 0, scarf: 0, rideIndex: -1, vehicle: null,
    passengerOf: null, seatIndex: 0, fishing: false, fishCount: 0,
    activity: 'exploring', mic: false, talking: false, lastStateAt: 0, alive: true,
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

    if (!c.room) return;
    if (msg.type === 'rtc-signal') {
      const target = clients.get(String(msg.to || ''));
      if (!target || target.room !== c.room || !msg.data || typeof msg.data !== 'object') return;
      send(target.ws, { type: 'rtc-signal', from: c.id, data: msg.data });
      return;
    }

    if (msg.type === 'event') {
      const allowed = new Set(['fish-catch', 'group-action']);
      if (!allowed.has(msg.event)) return;
      const data = msg.data && typeof msg.data === 'object' ? msg.data : {};
      if (msg.event === 'fish-catch') {
        broadcastEvent(c.room, c.id, 'fish-catch', {
          fish: cleanText(data.fish, 32, 'cá'),
          kg: finite(data.kg, 0, 0, 100).toFixed(1),
        });
      } else {
        broadcastEvent(c.room, c.id, 'group-action', { message: cleanText(data.message, 90, 'đang tham gia hoạt động') });
      }
      return;
    }

    if (msg.type === 'state') {
      const now = Date.now();
      if (now - c.lastStateAt < STATE_INTERVAL_MS) return;
      c.lastStateAt = now;
      c.x = finite(msg.x, c.x); c.y = finite(msg.y, c.y, -1000, 10000); c.z = finite(msg.z, c.z);
      c.face = finite(msg.face, c.face); c.run = !!msg.run; c.seated = !!msg.seated; c.lying = !!msg.lying;
      c.rideIndex = Number.isInteger(msg.rideIndex) && msg.rideIndex >= 0 && msg.rideIndex < 1000 ? msg.rideIndex : -1;
      if (c.rideIndex >= 0 && msg.vehicle && typeof msg.vehicle === 'object') {
        c.vehicle = {
          x: finite(msg.vehicle.x, c.x), y: finite(msg.vehicle.y, c.y, -1000, 10000), z: finite(msg.vehicle.z, c.z),
          heading: finite(msg.vehicle.heading, c.face), pitch: finite(msg.vehicle.pitch, 0, -2, 2), roll: finite(msg.vehicle.roll, 0, -2, 2), speed: finite(msg.vehicle.speed, 0, -60, 60),
          type: ['bike', 'car', 'boat'].includes(msg.vehicle.type) ? msg.vehicle.type : 'car', campOn: !!msg.vehicle.campOn,
        };
        c.passengerOf = null; c.seatIndex = 0;
      } else {
        c.vehicle = null;
        const requestedDriver = msg.passengerOf ? clients.get(cleanText(msg.passengerOf, 64, '')) : null;
        const requestedSeat = Number.isInteger(msg.seatIndex) ? Math.max(1, Math.min(20, msg.seatIndex)) : 0;
        const occupied = requestedDriver && rooms.get(c.room) ? [...rooms.get(c.room)].some(other => other.id !== c.id && other.passengerOf === requestedDriver.id && other.seatIndex === requestedSeat) : false;
        if (requestedDriver && requestedDriver.room === c.room && requestedDriver.rideIndex >= 0 && requestedSeat > 0 && !occupied) {
          c.passengerOf = requestedDriver.id; c.seatIndex = requestedSeat;
        } else {
          c.passengerOf = null; c.seatIndex = 0;
          if (msg.passengerOf && occupied) send(c.ws, { type: 'notice', message: 'Ghế này vừa có người ngồi. Hãy thử lên xe lại.' });
        }
      }
      c.jacket = Math.max(0, Math.min(4, Number(msg.jacket) | 0));
      c.scarf = Math.max(0, Math.min(4, Number(msg.scarf) | 0));
      c.fishing = !!msg.fishing; c.mic = !!msg.mic; c.talking = !!msg.talking && c.mic;
      c.fishCount = Math.max(0, Math.min(9999, Number(msg.fishCount) | 0));
      c.activity = ['fishing', 'driving', 'inside', 'hotel', 'restaurant', 'resting', 'exploring'].includes(msg.activity) ? msg.activity : 'exploring';
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
server.listen(PORT, '0.0.0.0', () => console.log(`Da Lat Suong Mu v9 Multiplayer listening on :${PORT}`));
server.on('close', () => clearInterval(heartbeat));
