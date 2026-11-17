package com.peaksneaker.service;

import com.peaksneaker.dto.response.DashboardSummaryResponse;
import com.peaksneaker.dto.response.RevenueChartResponse;

import java.util.List;
import java.time.LocalDate;

public interface DashboardService {
    DashboardSummaryResponse getSummary(LocalDate startDate, LocalDate endDate);
    List<RevenueChartResponse> getRevenueChart(LocalDate startDate, LocalDate endDate);
}
