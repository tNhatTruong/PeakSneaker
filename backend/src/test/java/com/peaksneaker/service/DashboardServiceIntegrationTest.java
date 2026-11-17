package com.peaksneaker.service;

import com.peaksneaker.dto.response.DashboardSummaryResponse;
import com.peaksneaker.dto.response.RevenueChartResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class DashboardServiceIntegrationTest {

    @Autowired
    private DashboardService dashboardService;

    @Test
    void dashboardAnalyticsShouldExposeCompleteOperationalContract() {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(29);

        DashboardSummaryResponse summary = dashboardService.getSummary(startDate, endDate);
        List<RevenueChartResponse> chart = dashboardService.getRevenueChart(startDate, endDate);

        assertThat(summary.getOrderStatusCounts()).isNotNull().containsKey("PENDING");
        assertThat(summary.getPaymentMethodCounts()).isNotNull().containsKeys("COD", "VNPAY");
        assertThat(summary.getLowStockItems()).isNotNull().hasSizeLessThanOrEqualTo(5);
        assertThat(summary.getAverageOrderValue()).isNotNull();
        assertThat(summary.getCancellationRate()).isNotNull();
        assertThat(chart).isNotEmpty().allSatisfy(point -> {
            assertThat(point.getRevenue()).isNotNull();
            assertThat(point.getOrderCount()).isNotNull().isGreaterThanOrEqualTo(0L);
        });
    }
}
