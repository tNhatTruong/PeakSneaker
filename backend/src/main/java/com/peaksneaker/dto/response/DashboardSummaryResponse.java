package com.peaksneaker.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardSummaryResponse {
    private BigDecimal totalRevenue;
    private Double revenueChange;
    private Long totalOrders;
    private Double ordersChange;
    private Long newCustomers;
    private Double customersChange;
    private Double conversionRate;
    private Double conversionRateChange;
    private Long lowStockCount;
    private List<TopProductResponse> topProducts;
}
