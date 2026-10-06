package com.vibe.service;

import com.vibe.client.SpotifyClient;
import com.vibe.config.RecommendationProperties;
import com.vibe.config.VibeCatalogProperties;
import com.vibe.config.VibeCatalogProperties.VibeDefinition;
import com.vibe.dto.SpotifyTrack;
import com.vibe.dto.VibeRecommendationResponse;
import com.vibe.exception.VibeNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Random;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class VibeServiceTest {

    private VibeCatalogProperties catalog;
    private RecommendationProperties recommendation;
    private VibeService service;

    @BeforeEach
    void setUp() {
        catalog = new VibeCatalogProperties();
        VibeDefinition chill = new VibeDefinition();
        chill.setId("chill");
        chill.setName("Chill");
        chill.setGenres(List.of("acoustic", "ambient"));
        catalog.setCatalog(List.of(chill));

        recommendation = new RecommendationProperties();
        recommendation.setTracksPerGenre(10);
        recommendation.setMaxResults(20);

        // Fake client that returns genre-prefixed tracks with overlap so
        // duplicate removal is actually exercised.
        SpotifyClient fakeClient = (genre, limit) -> List.of(
                new SpotifyTrack("shared-1", "Shared One", "A", "Alb", null, null),
                new SpotifyTrack(genre + "-a", genre + " A", "B", "Alb", null, null),
                new SpotifyTrack(genre + "-b", genre + " B", "C", "Alb", null, null)
        );

        // Seeded Random → deterministic shuffle for assertions.
        service = new VibeService(catalog, recommendation, fakeClient, new Random(42L));
    }

    @Test
    void recommendReturnsMappedTracksForKnownVibe() {
        VibeRecommendationResponse response = service.recommend("chill");

        assertThat(response.vibeId()).isEqualTo("chill");
        assertThat(response.vibeName()).isEqualTo("Chill");
        assertThat(response.tracks()).isNotEmpty();
        assertThat(response.tracks()).allSatisfy(t -> assertThat(t.id()).isNotBlank());
    }

    @Test
    void recommendDeduplicatesTracksAcrossGenres() {
        VibeRecommendationResponse response = service.recommend("chill");

        long sharedCount = response.tracks().stream()
                .filter(t -> t.id().equals("shared-1"))
                .count();
        assertThat(sharedCount).isEqualTo(1);
    }

    @Test
    void recommendCapsAtMaxResults() {
        recommendation.setMaxResults(2);
        VibeRecommendationResponse response = service.recommend("chill");

        assertThat(response.tracks()).hasSize(2);
    }

    @Test
    void recommendThrowsForUnknownVibe() {
        assertThatThrownBy(() -> service.recommend("does-not-exist"))
                .isInstanceOf(VibeNotFoundException.class)
                .hasMessageContaining("does-not-exist");
    }
}