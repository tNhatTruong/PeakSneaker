package com.peaksneaker.dto.response;

import com.peaksneaker.enums.OrderStatus;
import com.peaksneaker.enums.PaymentStatus;
import com.peaksneaker.enums.PaymentMethod;
import com.peaksneaker.enums.ReturnStatus;
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
    private String orderCode;
    private Long userId;
    private String voucherCode;
    private List<OrderItemResponse> items;
    private BigDecimal subtotalAmount;
    private BigDecimal discountAmount;
    private BigDecimal shippingFee;
    private BigDecimal finalAmount;
    private OrderStatus status;
    private PaymentStatus paymentStatus;
    private PaymentMethod paymentMethod;
    private String ghnOrderCode;
    private String ghnTrackingStatus;
    private String shippingName;
    private String shippingPhone;
    private String shippingProvince;
    private String shippingDistrict;
    private String shippingWard;
    private String shippingStreet;
    private String note;
    private String cancelReason;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant deliveredAt;
    private Long latestReturnId;
    private ReturnStatus latestReturnStatus;
}
