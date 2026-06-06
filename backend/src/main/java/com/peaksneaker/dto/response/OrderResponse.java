package com.peaksneaker.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {
    private Long id;
    private Long userId;
    private String voucherCode;
    private List<OrderItemResponse> items;
    private BigDecimal subtotalAmount;
    private BigDecimal discountAmount;
    private BigDecimal shippingFee;
    private BigDecimal finalAmount;
    private String status;
    private String paymentStatus;
    private String shippingName;
    private String shippingPhone;
    private String shippingProvince;
    private String shippingDistrict;
    private String shippingWard;
    private String shippingStreet;
    private String note;
    private Instant createdAt;
    private Instant updatedAt;
}
