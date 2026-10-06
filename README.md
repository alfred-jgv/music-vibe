# Vibe

Mobile-first music discovery app. Users pick a vibe; the backend will later return randomized Spotify catalog tracks. 

## Current status

Slice 1: Spring Boot serves the vibe catalog from config. No Spotify calls yet.

## Backend

Requires Java 27 and Maven.

```bash
cd backend
mvn test
mvn spring-boot:run
```

Then: `GET http://localhost:8080/api/vibes`

Vibes live in `backend/src/main/resources/application.yml` under `vibe.catalog`.

## Environment variables

None required for this slice. Later (Spotify):

- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `SPOTIFY_MARKET` (ISO country code, e.g. `PH`)

Never put Spotify secrets in frontend env files.

## Frontend

Not created yet. Planned: React + Vite + TypeScript + Tailwind.
