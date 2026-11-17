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

    public List<TraceabilityOrderItem> getOrders() {
        return relatedOrders != null ? relatedOrders : List.of();
    }

    public List<TraceabilityRmaItem> getReturns() {
        return relatedRmaReturns != null ? relatedRmaReturns : List.of();
    }

    public List<BatchResponse> getBatches() {
        return batch != null ? List.of(batch) : List.of();
    }

    public String getProductName() {
        return batch != null ? batch.getProductName() : null;
    }

    public String getVariantSku() {
        return batch != null ? batch.getVariantSku() : null;
    }

    public String getVariantColor() {
        return batch != null ? batch.getVariantColor() : null;
    }

    public String getVariantSize() {
        return batch != null ? batch.getVariantSize() : null;
    }

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

        public Integer getQuantityOrdered() {
            return quantity != null ? quantity : 0;
        }
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

        public Long getReturnId() {
            return rmaId;
        }

        public Integer getQuantityReturned() {
            return approvedQuantity != null && approvedQuantity > 0
                    ? approvedQuantity
                    : (requestedQuantity != null ? requestedQuantity : 0);
        }

        public String getReturnReason() {
            return reasonLabel != null ? reasonLabel : reasonCode;
        }

        public String getCustomerNotes() {
            return customerNote;
        }
    }
}

