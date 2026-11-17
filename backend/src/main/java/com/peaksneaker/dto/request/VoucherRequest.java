package com.peaksneaker.dto.request;

import java.time.Instant;

import com.peaksneaker.enums.DiscountType;
import com.peaksneaker.enums.VoucherApplicationScope;
import com.peaksneaker.enums.VoucherChannel;
import com.peaksneaker.enums.VoucherStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VoucherRequest {
    private String query;
    private Boolean isActive;
    private VoucherStatus status;
    private DiscountType discountType;
    private VoucherApplicationScope applicationScope;
    private VoucherChannel applicationChannel;
    private Instant fromDate;
    private Instant toDate;
    private String sortBy;
    private String sortDirection;
    
    @Builder.Default
    private int page = 0;
    
    @Builder.Default
    private int size = 10;
}
