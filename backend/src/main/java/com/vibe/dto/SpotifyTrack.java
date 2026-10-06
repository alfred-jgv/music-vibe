package com.vibe.dto;

/**
 * Internal representation of a track returned by the Spotify client layer.
 * Deliberately not Spotify's JSON shape — the mapping happens in RealSpotifyClient
 * so the rest of the app never depends on Spotify's response format.
 */
public record SpotifyTrack(
        String id,
        String name,
        String artist,
        String album,
        String previewUrl,
        String externalUrl
) {
}