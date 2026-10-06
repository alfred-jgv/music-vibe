package com.vibe.config;

import jakarta.validation.constraints.Min;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "recommendation")
public class RecommendationProperties {

    @Min(1)
    private int tracksPerGenre = 10;

    @Min(1)
    private int maxResults = 20;

    public int getTracksPerGenre() {
        return tracksPerGenre;
    }

    public void setTracksPerGenre(int tracksPerGenre) {
        this.tracksPerGenre = tracksPerGenre;
    }

    public int getMaxResults() {
        return maxResults;
    }

    public void setMaxResults(int maxResults) {
        this.maxResults = maxResults;
    }
}