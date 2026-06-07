package com.peaksneaker.dto.response;

import com.peaksneaker.entity.Order;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CheckoutResponse {
    private Long orderId;
    private String paymentUrl;
}
