package com.peaksneaker.service;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
class InventoryForecastTest {

    @Autowired
    private InventoryService inventoryService;

    @Test
    void forecastAndAuditSummaryShouldRunWithoutError() {
        var summary = inventoryService.getInventoryForecastSummary(30);
        assertNotNull(summary);
        var page = inventoryService.getInventoryForecast(30, null, null, null, null, "urgency", 0, 20);
        assertNotNull(page);

        LocalDate end = LocalDate.now();
        LocalDate start = end.minusDays(14);
        var customSummary = inventoryService.getInventoryForecastSummary(15, start, end);
        assertNotNull(customSummary);
        var customPage = inventoryService.getInventoryForecast(15, start, end, null, null, null, null, "urgency", 0, 20);
        assertNotNull(customPage);

        var auditSummary = inventoryService.getAuditLogSummary();
        assertNotNull(auditSummary);
        var auditPage = inventoryService.getAuditLogs(null, null, null, null, null, null,
                org.springframework.data.domain.PageRequest.of(0, 15));
        assertNotNull(auditPage);
    }
}

