package com.peaksneaker.dto.response;

import com.peaksneaker.enums.ReturnStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderReturnFilterOptionsResponse {
    private Map<ReturnStatus, Long> statusCounts;
    private List<ProductOption> products;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductOption {
        private Long id;
        private String name;
    }
}
