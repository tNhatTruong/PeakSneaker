package com.peaksneaker.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VoucherCheckResponse {
    @JsonProperty("isValid")
    private boolean isValid;
    private BigDecimal discountAmount;
    private String message;

    @JsonProperty("valid")
    public boolean isValid() {
        return isValid;
    }
}
