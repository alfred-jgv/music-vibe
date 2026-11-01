# Vibe

Vibe is a mobile-first music discovery app. Choose a situation or mood and
get a randomized set of tracks that match it.

The React frontend communicates with the Spring Boot backend. Spotify-specific
integration stays on the backend, and the app does not replace Spotify's
official playback experience.

<img width="1915" height="937" alt="image" src="https://github.com/user-attachments/assets/b6681c6e-56e6-40f3-b1d9-daf54647604a" />

## Status

The current slice includes:

- A configurable catalog of vibes
- Mock recommendations for local development
- Randomized, deduplicated recommendations
- A React and TypeScript frontend
- An optional Spotify Web API client using Client Credentials

## Tech stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Backend:** Java 26, Spring Boot, Maven
- **External API:** Spotify Web API (optional)
- **Database:** None

## Prerequisites

- Java 26
- Maven 3.9+
- Node.js 20+
- npm

## Run locally

Start the backend in one terminal:

```bash
cd backend
mvn spring-boot:run
```

The backend runs at `http://localhost:8080` and uses the `mock` Spring profile
by default, so no Spotify credentials are needed.

Start the frontend in another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite, usually `http://localhost:5173`.

To point the frontend at another backend URL, set `VITE_API_BASE` before
starting Vite:

```bash
VITE_API_BASE=http://localhost:8080 npm run dev
```

On Windows PowerShell:

```powershell
$env:VITE_API_BASE = "http://localhost:8080"
npm run dev
```

## Backend profiles

### Mock profile

The mock profile is active by default. It returns synthetic tracks and is the
recommended profile for development and tests.

### Spotify profile

The optional Spotify integration uses the server-side Client Credentials flow.
Set the credentials in the backend process environment and activate the
`spotify` profile:

```powershell
$env:SPOTIFY_CLIENT_ID = "your-client-id"
$env:SPOTIFY_CLIENT_SECRET = "your-client-secret"
mvn spring-boot:run -Dspring-boot.run.profiles=spotify
```

Do not put these credentials in frontend files, commit them to Git, or expose
them to the browser. Review Spotify's current developer terms and API
documentation before enabling this profile.

## API

List the available vibes:

```http
GET /api/vibes
```

Get recommendations for a vibe:

```http
GET /api/vibes/{vibeId}
```

Available vibe IDs currently include `late-night`, `road-trip`, `party`,
`chill`, `rainy-day`, `hype`, `romantic`, and `feel-good`.

The catalog and recommendation limits are configured in
`backend/src/main/resources/application.yml`.

## Testing and builds

Run backend tests:

```bash
cd backend
mvn test
```

Build and lint the frontend:

```bash
cd frontend
npm run build
npm run lint
```

## Project structure

```text
backend/
  src/main/java/com/vibe/
    client/       Spotify and mock API clients
    config/       Spring configuration and catalog properties
    controller/   REST endpoints
    dto/          API response models
    exception/    API error handling
    service/      Recommendation and authentication logic
frontend/
  src/
    components/   Reusable UI components
    pages/        Application pages
    services/     Backend API access
    types/        TypeScript API types
```

## License

This project is licensed under the [MIT License](./LICENSE).
