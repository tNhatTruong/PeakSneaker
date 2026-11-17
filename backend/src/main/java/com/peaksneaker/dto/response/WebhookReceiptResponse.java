package com.peaksneaker.dto.response;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class WebhookReceiptResponse {
    boolean duplicate;
    boolean applied;
    String providerOrderCode;
    String providerStatus;
}
