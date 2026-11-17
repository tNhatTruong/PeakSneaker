package com.peaksneaker.dto.response;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VoucherDetailResponse {
    private VoucherResponse voucher;
    private long usageCount;
    private BigDecimal totalDiscountAmount;
    private BigDecimal generatedRevenue;
}
