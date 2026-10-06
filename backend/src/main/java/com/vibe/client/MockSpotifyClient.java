package com.vibe.client;

import com.vibe.dto.SpotifyTrack;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.IntStream;

@Component
@Profile("mock")
public class MockSpotifyClient implements SpotifyClient {

    @Override
    public List<SpotifyTrack> searchTracksByGenre(String genre, int limit) {
        return IntStream.range(0, limit)
                .mapToObj(i -> new SpotifyTrack(
                        "mock-" + genre + "-" + i,
                        capitalize(genre) + " Track " + (i + 1),
                        "Mock Artist " + ((i % 5) + 1),
                        "Mock Album " + ((i % 3) + 1),
                        null,
                        null
                ))
                .toList();
    }

    private String capitalize(String s) {
        if (s == null || s.isEmpty()) return s;
        return Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }
}