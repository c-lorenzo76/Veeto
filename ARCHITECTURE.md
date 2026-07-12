# Veto — Architecture

**Veto** is a real-time multiplayer group restaurant decision app. A host creates a lobby, players join via a 6-character PIN, everyone votes on food preferences through a poll, and the server queries the Google Places API to return restaurant recommendations. Players then vote on a final restaurant — the winner is revealed on a dedicated winner screen.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS + shadcn/ui + flowbite-react |
| Font | Plus Jakarta Sans (Google Fonts) |
| Theme | Forest green (`#1a2e1a`, `#2d6a2d`, `#e8f0e8`, `#f0f7f0`) |
| Animations | Framer Motion |
| Real-time | Socket.io (client + server) |
| Map | react-leaflet v4 + OpenStreetMap tiles |
| Backend | Node.js + Express |
| Restaurant Data | Google Places API (Text Search + Place Details + Photo) |
| HTTP client | axios |
| Validation | Zod (server-side socket payload validation) |
| Testing | Vitest (server) |
| CI/CD | GitHub Actions → Azure Container Apps + Static Web Apps |

---

## Project Structure

```
Veto/
├── client/                        # React/Vite frontend
│   ├── src/
│   │   ├── App.jsx                # Router + single app-wide SocketProvider
│   │   ├── SocketContext.jsx      # Socket.io context provider (one socket for the whole app lifetime)
│   │   ├── pages/
│   │   │   ├── Home.jsx           # Landing page (Create / Join buttons)
│   │   │   ├── Create.jsx         # Host creates lobby (gets geolocation)
│   │   │   ├── Join.jsx           # Player joins lobby via PIN
│   │   │   ├── Lobby.jsx          # Pre-game waiting room
│   │   │   ├── Questions.jsx      # Poll voting page
│   │   │   ├── Results.jsx        # Restaurant list + map + final vote + winner screen
│   │   │   └── Layout.jsx         # Shared wrapper (Navbar + Footer)
│   │   ├── components/
│   │   │   ├── navbar.jsx         # Top nav (forest green rounded pill, 80% width)
│   │   │   ├── Footer.jsx
│   │   │   └── AvatarSelection.jsx
│   │   ├── hooks/
│   │   │   └── useLeaveGuard.js   # Back-button/tab-close guard + host transfer on confirmed leave
│   │   └── index.css              # Tailwind + shadcn CSS vars + Leaflet popup overrides
│   ├── Dockerfile                 # Not used by the deploy pipeline — local docker-compose testing only
│   └── index.html                 # Entry HTML (Google Fonts link here)
├── server/
│   ├── index.js                   # All backend logic
│   └── index.test.js              # Vitest unit tests (game logic, validation, timers)
├── .github/workflows/
│   ├── ci.yml                     # Lint, build, tests, secret scanning, CodeQL
│   └── deploy.yml                 # Builds server image, deploys to Azure per environment
├── Dockerfile                     # Server container image — used by deploy.yml
├── docker-compose.yml             # Local container testing (optional, not used by CI/CD)
├── DEPLOYMENT.md                  # Full Azure infrastructure + CD pipeline setup
└── ARCHITECTURE.md                # This file
```

---

## Environment Variables

**Client** (`client/.env`):
```
VITE_MAPS_KEY=your_google_maps_key       # Domain-restricted, safe for client
VITE_API_BASE_URL=http://localhost:8000  # Backend URL — required in deployed environments,
                                          # defaults to localhost:8000 if unset (local dev)
```

**Server** (`server/.env`):
```
SECRET_KEY=your_google_places_key    # Server-only, never exposed to client
CLIENT_ORIGIN=http://localhost:5173  # Frontend origin, used for CORS + Socket.io
```

The client's `VITE_MAPS_KEY` is domain-restricted and safe to expose. `SECRET_KEY` is server-only — used for Places Text Search, Place Details, and Place Photos, all proxied through the Express server so it never reaches the browser.

---

## Running the Project Locally

```bash
# Terminal 1 — backend
cd server && npm install && npm run start   # Runs on port 8000

# Terminal 2 — frontend
cd client && npm install && npm run dev     # Runs on port 5173
```

The client connects to `VITE_API_BASE_URL` (or `localhost:8000` if unset) for both Socket.io and the photo proxy REST endpoint.

---

## Full App Flow

### Phase 1 — Home / Create / Join

- `Home.jsx` has Create and Join buttons
- `Create.jsx` calls `navigator.geolocation.getCurrentPosition` to get coords, then emits `createLobby` with coords. Has an error handler for permission denied / unavailable / timeout.
- `Join.jsx` collects name + avatar + 6-character alphanumeric PIN (mobile keyboard set to `inputMode="text"` so letters can be entered, input auto-uppercased to match generated codes), calls `connectSocket`, then emits `joinLobby`
- Socket auth: username stored as `socket.auth.token`, avatar as `socket.auth.avatar`

### Phase 2 — Lobby (`/Lobby/:code`)

- Host sees a green Start button (only visible to host)
- All players shown in a grid with avatar + name
- Host can **kick players** by hovering a card → red XCircle appears top-right → click emits `kickUser`
- Kicked players are navigated to `/` with `{ state: { kicked: true } }` → red toast on Home
- PIN can be copied to clipboard
- `lobbyInfo` event keeps the user list in sync
- When host clicks Start → `startGame` emitted → server snapshots `lockedPlayers`
- Back button / tab close is guarded (`useLeaveGuard`) — confirms before leaving; if the host leaves and another player remains, host duties transfer via `transferHost`/`hostTransferred` instead of ending the game

### Phase 3 — Questions (`/Questions/:code`)

- Server drives ALL question advancement (not client)
- Server emits `phase_start` with `{ questionIndex, duration: 30, startedAt, lockedPlayers }`
- Client computes remaining time from `startedAt` and runs a local countdown
- Timer turns yellow at ≤10s, red at ≤5s
- If timer runs out with **zero votes**: server extends by **10 seconds** and emits `phase_extend`
- If timer runs out with ≥1 vote: server advances to next question
- If all locked players vote before timer: server clears timer and advances immediately
- **Observers** (late joiners): can see questions and who voted, but the Vote button is hidden. Server rejects their vote events.
- Progress bar shows `(currentQuestion / total) * 100` (never reaches 100% during the poll)
- Vote count badge per card shows `X / lockedPlayers.length`

**Poll questions (4 total):**
1. Top priority (Ambiance / Budget / Cuisine / Distance)
2. Price range ($, $$, $$$, $$$$)
3. Cuisine type (Italian, Mexican, Chinese, Japanese, Mediterranean, American, French, Thai)
4. Travel distance (Walking 0-1mi, Short drive 1-5mi, Moderate 5-15mi, Long 15+mi)

### Phase 4 — Results / Final Vote (`/Results/:code`)

Two-column layout: **40% left restaurant list**, **60% right Leaflet map**.

**Server after poll ends:**
1. Calls `getMostVotedOptions` (tie-broken randomly) to build the search query
2. Calls Google Places Text Search: `${cuisine} restaurant` within a radius mapped from the distance answer, filtered by price level
3. Stores results in `lobby.places`
4. Emits `getPlaces` with `{ places, coords, lockedPlayers }`
5. Starts a **90-second final vote timer**, emits `phase_start` with `{ phase: 'finalVote', duration: 90, startedAt, lockedPlayers }`

**Client (Results.jsx):**
- Top bar shows countdown timer + `X/Y voted` pill (total count only, not which restaurant)
- Observers see a "👀 Watching" label, no vote button
- Expanding a restaurant row shows: photo, rating, stars, review count, price, address, open/closed, phone, website, Google Maps link
- **Vote button** appears at the bottom of the expanded row (locked players only, one vote per session)
- Voted row shows `✓ Voted`; other rows show `Already voted` (disabled)
- If timer runs out with zero votes: extends **15 seconds**
- When all locked players vote or timer ends: server picks the winner (random tie-break), emits `winner`

### Phase 5 — Winner Screen (same page, state change in Results.jsx)

- `phase` state switches from `'voting'` to `'winner'`
- Full-page green background with trophy icons
- Shows: restaurant name, photo, rating, price, address, hours, phone, website, Google Maps link
- Exit button disconnects the socket and returns to Home

---

## Server Lobby Data Structure

```js
lobbies[code] = {
    host: string,                    // socket.data.user of host
    users: [{ name, avatar }],       // all connected users
    coords: "lat,lng",               // from Create.jsx geolocation
    phase: 'lobby' | 'poll' | 'finalVote' | 'done',
    lockedPlayers: [{ name, avatar }], // snapshot on startGame
    currentQuestion: number,         // 0-indexed, server-driven
    questionStartedAt: timestamp,    // Date.now() when question started
    questionTimer: Timeout,          // setTimeout reference
    restaurantVotes: {},             // { username: placeId }
    finalVoteTimer: Timeout,         // setTimeout reference
    places: [],                      // Google Places results
    poll: [ /* 4 question objects */ ],
}
```

Each poll question:
```js
{
    id: number,
    question: string,
    options: [{ id, text, votes: [username, ...] }]
}
```

---

## Socket Events Reference

| Event | Direction | Description |
|---|---|---|
| `createLobby` | C→S | Host creates lobby with `{ coords }` |
| `lobbyCreated` | S→C | Returns `code` to host |
| `joinLobby` | C→S | Player joins with `{ lobbyCode }` |
| `lobbyJoined` | S→C | Confirms join, sent only to the joining socket |
| `lobbyInfo` | S→C | Broadcasts `{ code, users, host }` to the room |
| `updateLobby` | C→S | Request fresh lobbyInfo |
| `selfInfo` | S→C | Tells a specific socket whether it's the current host |
| `startGame` | C→S | Host starts the game `{ lobbyCode }` |
| `gameStarted` | S→C | Navigates all to Questions. Payload: `{ lockedPlayers }` |
| `kickUser` | C→S | Host kicks `{ lobbyCode, targetUser }` |
| `kicked` | S→C | Sent to the kicked user only |
| `hostLeft` | S→C | Broadcast when the host disconnects with no successor available |
| `transferHost` | C→S | Confirmed-leaving host hands off `{ lobbyCode }` |
| `hostTransferred` | S→C | Broadcasts `{ newHost }` after a successful handoff |
| `getPollData` | C→S | Request poll questions |
| `setPoll` | S→C | Full poll state `{ questions }` |
| `phase_start` | S→C | `{ phase, questionIndex?, duration, startedAt, lockedPlayers }` |
| `phase_extend` | S→C | `{ addedSeconds }` — timer extended |
| `vote` | C→S | `{ optionId, lobbyCode }` — server uses its own `currentQuestion` |
| `navResults` | S→C | Navigate all clients to the Results page |
| `getPlaces` | S→C | `{ places, coords, lockedPlayers }` |
| `getPlaceDetails` | C→S | `{ placeId }` — fetches name, rating, address, hours, phone, website, photos |
| `placeDetails` | S→C | Full Place Details object |
| `voteRestaurant` | C→S | `{ lobbyCode, placeId }` — final restaurant vote |
| `restaurantVoteCount` | S→C | `{ voted, total }` — count only, no breakdown |
| `winner` | S→C | `{ place }` — winning restaurant object |
| `cursorMove` | C→S | `{ lobbyCode, x, y }` — live cursor position on Results page |
| `cursorLeave` | C→S | `{ lobbyCode }` — cursor left the panel |
| `userDisconnect` | S→C | Username of a disconnected non-host player |
| `Error` | S→C | Error string |

---

## Key Implementation Details

### App-wide Socket.io connection
`SocketProvider` wraps the whole app once in `App.jsx` (inside `BrowserRouter`, around `<Routes>`) — **not** per-route. One socket persists for the entire browser session instead of disconnecting/reconnecting on every navigation. Because of this, anywhere a session actually *ends* (confirmed leave via `useLeaveGuard`, `kicked`, `hostLeft`, or the winner screen's Exit button) must explicitly call `socket.disconnect()` — the server's cleanup logic (removing a player from `lobby.users`, triggering host transfer) only runs on an actual `disconnect` event, which no longer happens automatically just from navigating away.

### Back-button / leave guard
`useLeaveGuard` pushes a guard entry via React Router's own `navigate()` (not raw `window.history.pushState`) so React Router's internal location tracking never desyncs from the real browser history stack — a raw `pushState` call doesn't fire `popstate`, so React Router has no way to observe it, which previously caused subsequent `navigate()` calls to silently fail after a leave/re-enter cycle.

### Input validation
All client→server socket payloads are validated server-side with Zod schemas via a `withValidation` wrapper — malformed payloads are rejected with an `Error` emit instead of trusting client input directly.

### Rate limiting
Per-socket in-memory rate limiting on `createLobby` (5/min) and `vote`/`voteRestaurant` (10/2s). The `/api/place-photo` REST endpoint has an `express-rate-limit` cap of 60 req/min to protect the paid Places API calls behind it.

### Photo Proxy + Cache
All Google Place photos go through `GET /api/place-photo?ref=<photo_reference>` on the Express server. Photos are cached in a `Map<ref, { data: Buffer, contentType }>` — no repeat API calls within a server session.

```jsx
// Usage in client:
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
<img src={`${API_BASE_URL}/api/place-photo?ref=${photo_reference}`} />
```

### Leaflet Setup (Vite fix)
```js
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });
```
Must use `react-leaflet@4` — v5 requires React 19.

### "You Are Here" Marker
Custom `L.divIcon` with a red dot + label. Coords passed from the server in the `getPlaces` payload as a `"lat,lng"` string.

### MapController Component
A separate child component inside `<MapContainer>` that uses the `useMap()` hook to call `map.flyTo()` when the selected place changes.

### Observer Mode
Late joiners are added to `users` but NOT `lockedPlayers`. The server rejects their `vote` and `voteRestaurant` events. The client checks `lockedPlayers.some(p => p.name === socket.auth.token)` to show/hide vote buttons.

### Timer Architecture
The server emits `startedAt + duration` once. The client computes `remaining = duration - (Date.now() - startedAt) / 1000` on mount and runs a local `setInterval`. `phase_extend` just adds seconds to the local `timeLeft` state.

### Host Disconnect / Transfer
On a confirmed leave, the client emits `transferHost` before disconnecting. The server picks the first remaining player in `lobby.users` as successor, updates `lobby.host`, and broadcasts `hostTransferred` + refreshed `lobbyInfo`/`selfInfo` so every client's `isHost` flag recalculates. If no successor exists (the host was the only player), the server falls back to the original behavior: broadcast `hostLeft` and delete the lobby.

### Places API error visibility
`searchPlaces()` on the server checks `response.data.status` in addition to the HTTP response — Google's Places API returns HTTP 200 even on failures like `REQUEST_DENIED` or `OVER_QUERY_LIMIT`, with the real reason only in the JSON body. Logging this prevents API misconfiguration (bad key restrictions, disabled billing, wrong API enabled) from silently manifesting as an empty restaurant list with no error anywhere.

---

## Styling Conventions

- **Theme**: Forest green. Primary colors: `#1a2e1a` (dark), `#2d6a2d` (accent/buttons), `#e8f0e8` (page bg), `#f0f7f0` (surface), `#c8dcc8` (border)
- **Font**: Plus Jakarta Sans loaded via Google Fonts in `client/index.html`, set on `body` in `index.css`
- **shadcn `--primary`**: `120 40% 30%` (forest green for the Progress bar)
- **Navbar**: `bg-[#1a2e1a] rounded-3xl w-full lg:w-[80%] mx-auto` — rounded pill, 80% wide on large screens
- **Results/Questions page bg**: `bg-[#e8f0e8]` applied via `-mx-6 -mt-6` negative margin trick to bleed through Layout's `p-6`
- **Leaflet popup**: `.veto-popup` class overrides in `index.css` for a rounded, padded card style

---

## Testing

- **Server**: `cd server && npm test` — Vitest suite covering `getMostVotedOptions` tie-breaking, Places query building, input validation logic, and timer/advance-question logic
- **Client**: no automated test suite yet — verify changes manually in the browser (see `DEPLOYMENT.md` for the Dev1 environment used to test deployed changes)

---

## CI/CD

- **`ci.yml`**: runs on every push/PR to `main`, `uat`, `develop` — lint, build, server tests, secret scanning (gitleaks), and CodeQL. All must pass before merging (enforced via branch protection).
- **`deploy.yml`**: builds the server into a Docker image, pushes to a shared Azure Container Registry, deploys to the matching Container App, builds the client, and deploys to the matching Static Web App.

| Branch | Environment | Trigger |
|---|---|---|
| `feature/*` | Dev1 | Auto-deploy on push |
| `develop` | Dev | Manual approval |
| `uat` | UAT | Manual approval |
| `main` | Prod | Manual approval (admins only) |

Full Azure infrastructure setup (resource groups, Container Apps, Static Web Apps, Key Vault, OIDC federation) is documented in **[DEPLOYMENT.md](./DEPLOYMENT.md)**.

---

## What's NOT Yet Built / Possible Next Steps

- Persistent storage (lobbies and photo cache are in-memory, lost on server restart)
- Authentication / user accounts
- "Play Again" functionality (create a new lobby with the same group after a game ends)
- Mobile-optimized layout for the Results page (map/list currently side-by-side, not stacked)
- Mapbox integration (currently OpenStreetMap — would allow full theme customization)
- Custom domain for Prod
