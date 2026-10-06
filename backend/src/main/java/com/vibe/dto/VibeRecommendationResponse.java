package com.vibe.dto;

import java.util.List;

public record VibeRecommendationResponse(
        String vibeId,
        String vibeName,
        List<TrackDto> tracks
) {
}