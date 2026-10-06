package com.vibe.client;

import com.vibe.config.SpotifyConfig;
import com.vibe.dto.SpotifyTrack;
import com.vibe.service.SpotifyAuthService;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;

/**
 * Real Spotify Web API implementation. Requires the app owner to have an
 * active Spotify Premium subscription (Spotify's Development Mode rule as of 2026).
 */
@Component
@Profile("spotify")
public class RealSpotifyClient implements SpotifyClient {

    private final RestClient restClient;
    private final SpotifyAuthService authService;

    public RealSpotifyClient(RestClient.Builder builder,
                             SpotifyConfig config,
                             SpotifyAuthService authService) {
        this.restClient = builder.baseUrl(config.getApiBaseUrl()).build();
        this.authService = authService;
    }

    @Override
    public List<SpotifyTrack> searchTracksByGenre(String genre, int limit) {
        // Spotify's current search endpoint. Response mapping lives here so
        // the rest of the app never sees Spotify's raw JSON shape.
        SpotifySearchResponse response = restClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/search")
                        .queryParam("q", "genre:" + genre)
                        .queryParam("type", "track")
                        .queryParam("limit", limit)
                        .build())
                .header("Authorization", "Bearer " + authService.getAccessToken())
                .retrieve()
                .body(SpotifySearchResponse.class);

        if (response == null || response.tracks() == null || response.tracks().items() == null) {
            return List.of();
        }

        return response.tracks().items().stream()
                .map(item -> new SpotifyTrack(
                        item.id(),
                        item.name(),
                        item.artists() == null || item.artists().isEmpty()
                                ? "Unknown Artist"
                                : item.artists().get(0).name(),
                        item.album() == null ? null : item.album().name(),
                        item.previewUrl(),
                        item.externalUrls() == null ? null : item.externalUrls().spotify()
                ))
                .toList();
    }

    // --- Spotify response shapes (private to this client) ---

    private record SpotifySearchResponse(TracksPage tracks) {}

    private record TracksPage(List<TrackItem> items) {}

    private record TrackItem(
            String id,
            String name,
            List<Artist> artists,
            Album album,
            String previewUrl,
            ExternalUrls externalUrls
    ) {}

    private record Artist(String name) {}

    private record Album(String name) {}

    private record ExternalUrls(String spotify) {}
}