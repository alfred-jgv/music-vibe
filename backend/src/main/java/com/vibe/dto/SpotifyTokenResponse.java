package com.vibe.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Response from Spotify's /api/token endpoint.
 * We only map the fields we use — unknown fields are ignored by Jackson by default.
 */
public record SpotifyTokenResponse(
        @JsonProperty("access_token") String accessToken,
        @JsonProperty("token_type") String tokenType,
        @JsonProperty("expires_in") long expiresInSeconds
) {
}