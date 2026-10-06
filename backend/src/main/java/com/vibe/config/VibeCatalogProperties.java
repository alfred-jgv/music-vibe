package com.vibe.config;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.util.List;

@Validated
@ConfigurationProperties(prefix = "vibe")
public class VibeCatalogProperties {

    @NotEmpty
    private List<VibeDefinition> catalog = List.of();

    public List<VibeDefinition> getCatalog() {
        return catalog;
    }

    public void setCatalog(List<VibeDefinition> catalog) {
        this.catalog = catalog;
    }

    public static class VibeDefinition {

        @NotBlank
        private String id;

        @NotBlank
        private String name;

        @NotBlank
        private String emoji;

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getEmoji() {
            return emoji;
        }

        public void setEmoji(String emoji) {
            this.emoji = emoji;
        }
    }
}
