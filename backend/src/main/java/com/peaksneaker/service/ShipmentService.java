package com.peaksneaker.service;

import com.peaksneaker.dto.request.GhnWebhookRequest;
import com.peaksneaker.dto.response.ShipmentResponse;
import com.peaksneaker.dto.response.WebhookReceiptResponse;

public interface ShipmentService {
    ShipmentResponse dispatch(Long orderId);
    ShipmentResponse getForAdmin(Long orderId);
    ShipmentResponse getForCustomer(Long userId, Long orderId);
    WebhookReceiptResponse processGhnWebhook(GhnWebhookRequest request, String token);
}
