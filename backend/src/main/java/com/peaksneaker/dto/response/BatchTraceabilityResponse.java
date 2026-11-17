package com.peaksneaker.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchTraceabilityResponse {
    private BatchResponse batch;
    private Integer totalShipped;
    private Integer totalRemaining;
    private Integer totalRmaDefects;
    private Boolean isQuarantined;
    private String quarantineReason;
    private List<TraceabilityOrderItem> relatedOrders;
    private List<TraceabilityRmaItem> relatedRmaReturns;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TraceabilityOrderItem {
        private Long orderId;
        private String orderCode;
        private String customerName;
        private String customerEmail;
        private String customerPhone;
        private Integer quantity;
        private BigDecimal unitPrice;
        private String orderStatus;
        private Instant orderDate;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TraceabilityRmaItem {
        private Long rmaId;
        private Long orderId;
        private String customerEmail;
        private String reasonCode;
        private String reasonLabel;
        private String customerNote;
        private Integer requestedQuantity;
        private Integer approvedQuantity;
        private String status;
        private List<String> evidenceImages;
        private Instant requestedAt;
    }
}

