package com.peaksneaker.controller.admin;

import com.peaksneaker.dto.response.ApiResponse;
import com.peaksneaker.dto.response.DashboardSummaryResponse;
import com.peaksneaker.dto.response.RevenueChartResponse;
import com.peaksneaker.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<DashboardSummaryResponse>> getSummary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        DashboardSummaryResponse summary = dashboardService.getSummary(from, to);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin tổng quan dashboard thành công", summary));
    }

    @GetMapping("/revenue-chart")
    public ResponseEntity<ApiResponse<List<RevenueChartResponse>>> getRevenueChart(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        List<RevenueChartResponse> chartData = dashboardService.getRevenueChart(from, to);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin biểu đồ doanh thu thành công", chartData));
    }
}
