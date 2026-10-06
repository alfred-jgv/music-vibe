package com.vibe.controller;

import com.vibe.dto.VibeListResponse;
import com.vibe.dto.VibeRecommendationResponse;
import com.vibe.service.VibeService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/vibes")
public class VibeController {

    private final VibeService vibeService;

    public VibeController(VibeService vibeService) {
        this.vibeService = vibeService;
    }

    @GetMapping
    public VibeListResponse listVibes() {
        return new VibeListResponse(vibeService.listVibes());
    }

    @GetMapping("/{vibeId}")
    public VibeRecommendationResponse recommend(@PathVariable String vibeId) {
        return vibeService.recommend(vibeId);
    }
}