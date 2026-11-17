package com.peaksneaker.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardSummaryResponse {
    private LocalDate periodStart;
    private LocalDate periodEnd;
    private BigDecimal totalRevenue;
    private Double revenueChange;
    private Long totalOrders;
    private Double ordersChange;
    private Long processingOrders;
    private Long shippingOrders;
    private Long completedOrders;
    private Long cancelledOrders;
    private Long paidOrders;
    private Long failedPaymentCount;
    private Long codOrders;
    private Long vnpayOrders;
    private BigDecimal averageOrderValue;
    private Double averageOrderValueChange;
    private Long newCustomers;
    private Double customersChange;
    private Double conversionRate;
    private Double conversionRateChange;
    private Double cancellationRate;
    private Double cancellationRateChange;
    private Long lowStockCount;
    private Long agedBatchCount;
    private List<TopProductResponse> topProducts;
    private List<BrandSalesResponse> brandSales;
    private List<LowStockItemResponse> lowStockItems;
    private Map<String, Long> orderStatusCounts;
    private Map<String, Long> paymentMethodCounts;
}
