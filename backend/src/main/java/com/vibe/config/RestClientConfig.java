package com.vibe.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class RestClientConfig {

    /**
     * Shared RestClient.Builder. Spring Boot auto-configures the underlying
     * request factory (JDK HttpClient by default). We expose the builder so
     * each client layer (auth, search, etc.) can produce a base-configured instance.
     */
    @Bean
    public RestClient.Builder restClientBuilder() {
        return RestClient.builder();
    }
}