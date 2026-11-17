package com.peaksneaker.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogSummaryResponse {
    private long total;
    private long importCount;
    private long orderHoldCount;
    private long restockCount;
    private long adjustmentCount;
    private List<String> performers;
}

