package com.peaksneaker.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class GhnWebhookRequest {
    @JsonAlias({"OrderCode", "order_code"})
    private String orderCode;

    @JsonAlias({"ClientOrderCode", "client_order_code"})
    private String clientOrderCode;

    @JsonAlias({"Status", "status"})
    private String status;

    @JsonAlias({"Type", "type"})
    private String type;

    @JsonAlias({"Time", "time"})
    private Instant time;

    @JsonAlias({"CODAmount", "cod_amount"})
    private BigDecimal codAmount;

    @JsonAlias({"TotalFee", "total_fee"})
    private BigDecimal totalFee;

    @JsonAlias({"Reason", "reason"})
    private String reason;

    @JsonAlias({"ReasonCode", "reason_code"})
    private String reasonCode;
}
