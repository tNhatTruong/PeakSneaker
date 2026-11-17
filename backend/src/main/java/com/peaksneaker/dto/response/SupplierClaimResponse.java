package com.peaksneaker.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupplierClaimResponse {
    private String claimNumber;
    private Instant generatedAt;
    private String generatedBy;
    
    // Batch & Supplier Info
    private Long batchId;
    private String batchCode;
    private String supplierName;
    private String poNumber;
    private String invoiceNumber;
    private String paymentStatus;
    private BigDecimal unitCost;
    
    // Product Variant Info
    private String productName;
    private String brandName;
    private String sku;
    private String color;
    private String size;

    // Defect & Quarantine Figures
    private Integer initialImportedQuantity;
    private Integer defectiveCustomerCount;
    private Integer quarantinedRemainingCount;
    private Integer totalClaimQuantity;
    private BigDecimal totalClaimAmount; // totalClaimQuantity * unitCost

    // Recommendation
    private String settlementMethod; // "DEBIT_NOTE_OFFSET" or "CASH_REFUND_OR_REPLACEMENT"
    private String legalNotice;
    private List<BatchTraceabilityResponse.TraceabilityRmaItem> defectEvidences;

    public String getClaimReferenceCode() {
        return claimNumber;
    }

    public String getVariantSku() {
        return sku;
    }

    public String getVariantColor() {
        return color;
    }

    public String getVariantSize() {
        return size;
    }

    public Integer getQuantityImported() {
        return initialImportedQuantity != null ? initialImportedQuantity : 0;
    }

    public Integer getDefectiveFromCustomersCount() {
        return defectiveCustomerCount != null ? defectiveCustomerCount : 0;
    }

    public Integer getQuarantinedQuantity() {
        return quarantinedRemainingCount != null ? quarantinedRemainingCount : 0;
    }

    public String getRecommendation() {
        return legalNotice;
    }
}

