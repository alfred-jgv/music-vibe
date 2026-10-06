package com.vibe.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(VibeCatalogProperties.class)
public class VibeConfig {
}
