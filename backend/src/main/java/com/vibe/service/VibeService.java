package com.vibe.service;

import com.vibe.client.SpotifyClient;
import com.vibe.config.RecommendationProperties;
import com.vibe.config.VibeCatalogProperties;
import com.vibe.config.VibeCatalogProperties.VibeDefinition;
import com.vibe.dto.SpotifyTrack;
import com.vibe.dto.TrackDto;
import com.vibe.dto.Vibe;
import com.vibe.dto.VibeRecommendationResponse;
import com.vibe.exception.VibeNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

@Service
public class VibeService {

    private final VibeCatalogProperties catalogProperties;
    private final RecommendationProperties recommendationProperties;
    private final SpotifyClient spotifyClient;
    private final Random random;

    public VibeService(VibeCatalogProperties catalogProperties,
                       RecommendationProperties recommendationProperties,
                       SpotifyClient spotifyClient,
                       Random recommendationRandom) {
        this.catalogProperties = catalogProperties;
        this.recommendationProperties = recommendationProperties;
        this.spotifyClient = spotifyClient;
        this.random = recommendationRandom;
    }

    public List<Vibe> listVibes() {
        return catalogProperties.getCatalog().stream()
                .map(def -> new Vibe(def.getId(), def.getName()))
                .toList();
    }

    public VibeRecommendationResponse recommend(String vibeId) {
        VibeDefinition vibe = findVibe(vibeId);

        // 1. Gather tracks from every genre mapped to this vibe.
        List<SpotifyTrack> all = new ArrayList<>();
        for (String genre : vibe.getGenres()) {
            all.addAll(spotifyClient.searchTracksByGenre(
                    genre, recommendationProperties.getTracksPerGenre()));
        }

        // 2. Deduplicate by track id. LinkedHashMap preserves insertion order
        //    so behavior is deterministic before the shuffle step.
        Map<String, SpotifyTrack> unique = new LinkedHashMap<>();
        for (SpotifyTrack track : all) {
            if (track.id() != null) {
                unique.putIfAbsent(track.id(), track);
            }
        }

        // 3. Shuffle for discovery variety.
        List<SpotifyTrack> shuffled = new ArrayList<>(unique.values());
        Collections.shuffle(shuffled, random);

        // 4. Cap to configured max.
        List<TrackDto> tracks = shuffled.stream()
                .limit(recommendationProperties.getMaxResults())
                .map(this::toDto)
                .toList();

        return new VibeRecommendationResponse(vibe.getId(), vibe.getName(), tracks);
    }

    private VibeDefinition findVibe(String vibeId) {
        return catalogProperties.getCatalog().stream()
                .filter(def -> def.getId().equals(vibeId))
                .findFirst()
                .orElseThrow(() -> new VibeNotFoundException(vibeId));
    }

    private TrackDto toDto(SpotifyTrack track) {
        return new TrackDto(
                track.id(),
                track.name(),
                track.artist(),
                track.album(),
                track.previewUrl(),
                track.externalUrl()
        );
    }
}