package com.peaksneaker.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Builder
public class VoucherCheckResponse {
    private boolean isValid;
    private BigDecimal discountAmount;
    private String message;
}
