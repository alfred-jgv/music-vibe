package com.vibe.exception;

public class VibeNotFoundException extends RuntimeException {

    public VibeNotFoundException(String vibeId) {
        super("Unknown vibe: " + vibeId);
    }
}