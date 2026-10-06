package com.vibe.client;

import com.vibe.dto.SpotifyTrack;

import java.util.List;

/**
 * Abstraction over the Spotify catalog. Implementations are selected by
 * Spring profile so the application can run fully offline with MockSpotifyClient
 * and switch to RealSpotifyClient once Spotify Premium is available.
 */
public interface SpotifyClient {

    /**
     * Search for tracks matching a genre keyword.
     *
     * @param genre free-text genre/keyword, e.g. "chill" or "indie"
     * @param limit max number of tracks to return
     * @return list of matching tracks; empty list if nothing matched
     */
    List<SpotifyTrack> searchTracksByGenre(String genre, int limit);
}