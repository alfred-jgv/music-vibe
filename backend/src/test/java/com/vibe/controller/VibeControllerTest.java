package com.vibe.controller;

import com.vibe.VibeApplication;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = VibeApplication.class)
@AutoConfigureMockMvc
class VibeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void listVibesReturnsConfiguredCatalog() throws Exception {
        mockMvc.perform(get("/api/vibes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.vibes", hasSize(8)))
                .andExpect(jsonPath("$.vibes[0].id").value("late-night"))
                .andExpect(jsonPath("$.vibes[0].name").value("Late Night"));
    }
}