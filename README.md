# Veto

## Background
Veto was inspired by the many occurrences where my partner and I struggled to decide where to eat,
often spending more time second-guessing our options than enjoying a meal.
Our indecisiveness led me to create a solution — a website designed to help simplify the decision-making process.
Unlike existing tools that merely list nearby restaurants, Veto takes group preferences into account to make a tailored recommendation.

## How it works
1. A host creates a lobby and shares a 6-character PIN.
2. Players join the lobby, then the host starts the game.
3. Everyone votes on a short poll (priority, price, cuisine, distance).
4. The server queries the Google Places API and returns a shortlist of restaurants.
5. Players vote on a final restaurant — the winner is revealed on a dedicated screen.

## Tech Stack
- React 18 + Vite
- Tailwind CSS + shadcn/ui + flowbite-react
- Framer Motion
- Socket.io (client + server)
- react-leaflet v4 + OpenStreetMap
- Node.js + Express
- Google Places API (Text Search, Place Details, Place Photo)

See [CLAUDE.md](./CLAUDE.md) for full architecture, socket event reference, and implementation details.

## Directory Structure
    client/                React/Vite frontend
        src/
            assets/         Static images (avatars, etc.)
            components/     Shared components (shadcn, navbar, footer, avatar picker)
            lib/             Tailwind utility helpers
            pages/           Route-level pages (Home, Create, Join, Lobby, Questions, Results)
    server/                 Express + Socket.io backend
        index.js             All backend/game logic

## Setup

### Environment variables
**Server** (`server/.env`, see `server/.env.example`):
```
SECRET_KEY=your_google_places_api_key
CLIENT_ORIGIN=http://localhost:5173   # your deployed client's origin in production
```

**Client** (`client/.env`):
```
VITE_MAPS_KEY=your_google_maps_key
```

### Run the server
```
cd server
npm i
npm start
```
Runs on `localhost:8000`.

### Run the client
In a separate terminal:
```
cd client
npm i
npm run dev
```
Runs on `localhost:5173`.

## Deployment

Veto deploys to 4 Azure environments via GitHub Actions:

| Branch | Environment | Trigger |
|---|---|---|
| `feature/*` | Dev1 | Auto-deploy on push |
| `develop` | Dev | Manual approval |
| `uat` | UAT | Manual approval |
| `main` | Prod | Manual approval (admins only) |

CI (`ci.yml`) runs lint, build, tests, and security scanning on every push and PR. See [DEPLOYMENT.md](./DEPLOYMENT.md) for full Azure infrastructure setup and the deployment pipeline.

## Known gaps
See the "What's NOT Yet Built" section in [CLAUDE.md](./CLAUDE.md) for the current backlog (persistence, auth, mobile layout, etc.).
