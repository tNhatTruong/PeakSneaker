package com.peaksneaker.dto.response;

import lombok.Builder;
import lombok.Value;

import java.time.Instant;

@Value
@Builder
public class ShipmentEventResponse {
    Long id;
    String eventType;
    String providerStatus;
    Instant occurredAt;
    boolean applied;
}
