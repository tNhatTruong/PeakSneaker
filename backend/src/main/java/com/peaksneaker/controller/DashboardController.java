package com.peaksneaker.controller;

import com.peaksneaker.dto.response.ApiResponse;
import com.peaksneaker.dto.response.DashboardSummaryResponse;
import com.peaksneaker.dto.response.RevenueChartResponse;
import com.peaksneaker.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<DashboardSummaryResponse>> getSummary() {
        DashboardSummaryResponse summary = dashboardService.getSummary();
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin tổng quan dashboard thành công", summary));
    }

    @GetMapping("/revenue-chart")
    public ResponseEntity<ApiResponse<List<RevenueChartResponse>>> getRevenueChart() {
        List<RevenueChartResponse> chartData = dashboardService.getRevenueChart();
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin biểu đồ doanh thu thành công", chartData));
    }
}
