# Vibe

Mobile-first music discovery app. Users pick a vibe; the backend returns randomized Spotify catalog tracks.

## Current Status

**Slice 1 complete:** Spring Boot serves the vibe catalog and returns mock recommendations. No real Spotify calls yet.

## Architecture

React frontend → Spring Boot REST API → Spotify service/client layer → Spotify Web API

The React frontend never communicates directly with Spotify.

## Prerequisites

- Java 26
- Maven 3.9+
- Node.js 20+

## Backend

```bash
cd backend
mvn test
mvn spring-boot:run