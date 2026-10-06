package com.vibe.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Random;

@Configuration
public class RandomConfig {

    /**
     * Shared Random instance. Exposed as a bean so tests can inject a
     * seeded Random for deterministic shuffle behavior.
     */
    @Bean
    public Random recommendationRandom() {
        return new Random();
    }
}