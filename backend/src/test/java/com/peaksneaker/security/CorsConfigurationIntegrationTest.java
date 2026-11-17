package com.peaksneaker.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class CorsConfigurationIntegrationTest {

    private static final String FRONTEND_ORIGIN = "http://localhost:5173";

    @Autowired
    private MockMvc mockMvc;

    @Test
    void adminOrderStatusPreflightAllowsPatch() throws Exception {
        mockMvc.perform(options("/api/v1/admin/orders/10001/status")
                        .header(HttpHeaders.ORIGIN, FRONTEND_ORIGIN)
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "PATCH")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, "authorization,content-type"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, FRONTEND_ORIGIN))
                .andExpect(header().string(
                        HttpHeaders.ACCESS_CONTROL_ALLOW_METHODS,
                        containsString("PATCH")))
                .andExpect(header().string(
                        HttpHeaders.ACCESS_CONTROL_ALLOW_HEADERS,
                        containsString("authorization")));
    }
}
