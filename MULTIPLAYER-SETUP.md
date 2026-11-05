# Đà Lạt Sương Mù — Multiplayer Online Setup

## What is included
- `Da-Lat-Suong-Mu-Cinematic-v8.html`: browser game with WebSocket multiplayer client.
- `index.html`: entry page; forwards the `server` query parameter to the game.
- `server.js`: Node.js WebSocket relay server.
- `package.json`: server dependency and start script.

## Local test
Requires Node.js 18+.

Terminal 1 (server):

```bash
npm install
npm start
```

Terminal 2 (static game files):

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000/index.html` in two browser windows/devices on the same computer. The game will connect to `ws://localhost:8080/ws` automatically. Both players should use the same room name, e.g. `dalat`.

## Public deployment
1. Deploy `server.js`, `package.json`, and `Procfile` as a Node web service on a host that supports WebSockets.
2. Build/install command: `npm install`.
3. Start command: `npm start`.
4. The host must provide HTTPS/WSS and forward WebSocket traffic to `/ws`.
5. Host the HTML game files on an HTTPS static host.
6. Open the game using this pattern:

```text
https://YOUR-GAME-DOMAIN/index.html?server=wss%3A%2F%2FYOUR-SERVER-DOMAIN%2Fws
```

Replace both example domains with the actual deployed domains. All players must use the same WebSocket server and room name to meet each other.

## Current multiplayer scope
The first online milestone synchronizes player presence, avatar position, height, facing direction, basic running/seated state, and outfit palette. Default room capacity is 64 connections (`MAX_PLAYERS_PER_ROOM` can be configured as an environment variable).

Vehicles, passengers, fishing, hotel/restaurant interactions, world object state, chat, accounts, cloud saves, and authoritative anti-cheat physics are not synchronized yet. The server is a relay, not a full authoritative game simulation. Do not treat illustrative hotel booking UI as a real booking system.
