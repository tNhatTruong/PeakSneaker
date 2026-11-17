package com.peaksneaker.dto.response;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.Instant;

@Value
@Builder
public class GhnCreateOrderResult {
    String providerOrderCode;
    String providerStatus;
    BigDecimal shippingFee;
    Instant expectedDeliveryAt;
    String rawResponse;
}
