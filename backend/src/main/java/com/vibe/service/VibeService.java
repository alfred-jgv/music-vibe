package com.vibe.service;

import com.vibe.config.VibeCatalogProperties;
import com.vibe.dto.VibeDto;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class VibeService {

    private final VibeCatalogProperties vibeCatalogProperties;

    public VibeService(VibeCatalogProperties vibeCatalogProperties) {
        this.vibeCatalogProperties = vibeCatalogProperties;
    }

    public List<VibeDto> listVibes() {
        return vibeCatalogProperties.getCatalog().stream()
                .map(vibe -> new VibeDto(vibe.getId(), vibe.getName(), vibe.getEmoji()))
                .toList();
    }
}
