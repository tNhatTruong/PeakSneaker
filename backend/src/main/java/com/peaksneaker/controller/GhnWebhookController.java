package com.peaksneaker.controller;

import com.peaksneaker.dto.request.GhnWebhookRequest;
import com.peaksneaker.dto.response.ApiResponse;
import com.peaksneaker.dto.response.WebhookReceiptResponse;
import com.peaksneaker.service.ShipmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/webhooks/ghn")
@RequiredArgsConstructor
public class GhnWebhookController {
    private final ShipmentService shipmentService;

    @PostMapping
    public ResponseEntity<ApiResponse<WebhookReceiptResponse>> receive(
            @RequestHeader(value = "X-GHN-Webhook-Token", required = false) String headerToken,
            @RequestParam(value = "token", required = false) String queryToken,
            @RequestBody GhnWebhookRequest request) {
        String credential = headerToken == null || headerToken.isBlank() ? queryToken : headerToken;
        return ResponseEntity.ok(ApiResponse.success("Đã tiếp nhận webhook GHN",
                shipmentService.processGhnWebhook(request, credential)));
    }
}
