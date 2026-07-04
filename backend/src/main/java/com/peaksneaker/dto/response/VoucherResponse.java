package com.peaksneaker.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.Instant;
import com.peaksneaker.enums.DiscountType;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VoucherResponse {
    private Long id;
    private String code;
    private DiscountType discountType;
    private BigDecimal discountValue;
    private BigDecimal minOrderAmount;
    private BigDecimal maxDiscountAmount;
    private Integer usageLimit;
    private Integer usedCount;
    private Instant startAt;
    private Instant expireAt;
    private Boolean isActive;
}
