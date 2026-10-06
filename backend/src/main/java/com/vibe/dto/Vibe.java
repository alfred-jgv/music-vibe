package com.vibe.dto;

/**
 * A vibe the user can select.
 * Kept minimal — id is used in the URL path, name is for display.
 */
public record Vibe(String id, String name) {
}