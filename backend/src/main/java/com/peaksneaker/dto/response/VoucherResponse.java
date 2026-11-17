package com.peaksneaker.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.Instant;
import com.peaksneaker.enums.DiscountType;
import com.peaksneaker.enums.VoucherApplicationScope;
import com.peaksneaker.enums.VoucherChannel;
import com.peaksneaker.enums.VoucherStatus;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VoucherResponse {
    private Long id;
    private String code;
    private String name;
    private String description;
    private DiscountType discountType;
    private BigDecimal discountValue;
    private BigDecimal minOrderAmount;
    private BigDecimal maxDiscountAmount;
    private Integer usageLimit;
    private Integer perUserLimit;
    private Integer usedCount;
    private Instant startAt;
    private Instant expireAt;
    private Boolean isActive;
    private VoucherApplicationScope applicationScope;
    private VoucherChannel applicationChannel;
    private Boolean isCombinable;
    private VoucherStatus status;
    private Instant createdAt;
    private Instant updatedAt;
}
