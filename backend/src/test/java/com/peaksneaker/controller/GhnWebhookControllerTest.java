package com.peaksneaker.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.peaksneaker.dto.response.WebhookReceiptResponse;
import com.peaksneaker.exception.GlobalExceptionHandler;
import com.peaksneaker.exception.UnauthorizedException;
import com.peaksneaker.service.ShipmentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class GhnWebhookControllerTest {

    @Mock
    private ShipmentService shipmentService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(new GhnWebhookController(shipmentService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void acceptsPreSharedTokenFromRegisteredWebhookUrl() throws Exception {
        when(shipmentService.processGhnWebhook(any(), eq("query-secret")))
                .thenReturn(WebhookReceiptResponse.builder()
                        .providerOrderCode("GHN-10")
                        .providerStatus("ready_to_pick")
                        .applied(true)
                        .build());

        mockMvc.perform(post("/api/v1/webhooks/ghn")
                        .queryParam("token", "query-secret")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validPayload()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"));

        verify(shipmentService).processGhnWebhook(any(), eq("query-secret"));
    }

    @Test
    void headerCredentialTakesPrecedenceForInternalCalls() throws Exception {
        when(shipmentService.processGhnWebhook(any(), eq("header-secret")))
                .thenReturn(WebhookReceiptResponse.builder().applied(true).build());

        mockMvc.perform(post("/api/v1/webhooks/ghn")
                        .queryParam("token", "query-secret")
                        .header("X-GHN-Webhook-Token", "header-secret")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validPayload()))
                .andExpect(status().isOk());

        verify(shipmentService).processGhnWebhook(any(), eq("header-secret"));
    }

    @Test
    void returnsUnauthorizedWhenCredentialIsRejected() throws Exception {
        when(shipmentService.processGhnWebhook(any(), eq("wrong-secret")))
                .thenThrow(new UnauthorizedException("Webhook GHN không hợp lệ."));

        mockMvc.perform(post("/api/v1/webhooks/ghn")
                        .queryParam("token", "wrong-secret")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validPayload()))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value("error"));
    }

    private String validPayload() throws Exception {
        return new ObjectMapper().writeValueAsString(new Payload(
                "GHN-10", "PS-10", "ready_to_pick", "switch_status"));
    }

    private record Payload(String OrderCode, String ClientOrderCode, String Status, String Type) {
    }
}
