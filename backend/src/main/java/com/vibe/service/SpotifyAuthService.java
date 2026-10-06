package com.vibe.service;

import com.vibe.config.SpotifyConfig;
import com.vibe.dto.SpotifyTokenResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.context.annotation.Profile;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;

@Service
@Profile("spotify")
public class SpotifyAuthService {

    private static final Logger log = LoggerFactory.getLogger(SpotifyAuthService.class);

    // Refresh a little before actual expiry to avoid edge-case 401s.
    private static final long REFRESH_SAFETY_MARGIN_SECONDS = 30;

    private final RestClient restClient;
    private final String basicAuthHeader;

    // Cached token state. Volatile so it is safely published across threads.
    private volatile String cachedToken;
    private volatile Instant cachedTokenExpiresAt = Instant.EPOCH;

    public SpotifyAuthService(RestClient.Builder builder, SpotifyConfig config) {
        this.restClient = builder.baseUrl(config.getAuthUrl()).build();

        // Spotify requires Basic auth = base64(clientId:clientSecret) at the token endpoint.
        String credentials = config.getClientId() + ":" + config.getClientSecret();
        this.basicAuthHeader = "Basic " + Base64.getEncoder()
                .encodeToString(credentials.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Returns a valid access token, fetching a new one only when the cached token
     * is missing or about to expire. Synchronized so concurrent requests don't
     * stampede Spotify's token endpoint.
     */
    public synchronized String getAccessToken() {
        if (cachedToken != null && Instant.now().isBefore(cachedTokenExpiresAt)) {
            return cachedToken;
        }
        return fetchNewToken();
    }

    private String fetchNewToken() {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "client_credentials");

        SpotifyTokenResponse response = restClient.post()
                .header("Authorization", basicAuthHeader)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(form)
                .retrieve()
                .body(SpotifyTokenResponse.class);

        if (response == null || response.accessToken() == null) {
            throw new IllegalStateException("Spotify returned an empty token response");
        }

        this.cachedToken = response.accessToken();
        this.cachedTokenExpiresAt = Instant.now()
                .plusSeconds(response.expiresInSeconds() - REFRESH_SAFETY_MARGIN_SECONDS);

        // Never log the token itself.
        log.debug("Fetched new Spotify access token, expires in {}s", response.expiresInSeconds());
        return cachedToken;
    }
}