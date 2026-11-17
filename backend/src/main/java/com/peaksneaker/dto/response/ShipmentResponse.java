package com.peaksneaker.dto.response;

import com.peaksneaker.enums.ShipmentStatus;
import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Value
@Builder
public class ShipmentResponse {
    Long id;
    Long orderId;
    String provider;
    String providerOrderCode;
    ShipmentStatus status;
    String providerStatus;
    BigDecimal codAmount;
    BigDecimal shippingFee;
    Instant expectedDeliveryAt;
    Instant lastEventAt;
    List<ShipmentEventResponse> events;
}
