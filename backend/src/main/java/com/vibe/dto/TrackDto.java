package com.vibe.dto;

/**
 * Track representation returned to the frontend.
 * Deliberately separate from SpotifyTrack: external API shape must never
 * leak to the client.
 */
public record TrackDto(
        String id,
        String name,
        String artist,
        String album,
        String previewUrl,
        String externalUrl
) {
}