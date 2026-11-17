package com.peaksneaker.controller.admin;

import com.peaksneaker.dto.request.CreateBatchRequest;
import com.peaksneaker.dto.response.*;
import com.peaksneaker.exception.BadRequestException;
import com.peaksneaker.service.InventoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/batches")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('INVENTORY_VIEW', 'INVENTORY_IMPORT', 'INVENTORY_ADJUST', 'INVENTORY_FORECAST', 'AUDIT_LOG_VIEW', 'ROLE_SUPER_ADMIN', 'SUPER_ADMIN', 'ROLE_ADMIN', 'ADMIN', 'ROLE_WAREHOUSE', 'WAREHOUSE', 'ROLE_STAFF_MANAGER', 'STAFF_MANAGER')")
public class AdminBatchController {

    private final InventoryService inventoryService;

    @PostMapping
    public ResponseEntity<ApiResponse<BatchResponse>> createBatch(
            @Valid @RequestBody CreateBatchRequest request) {
        BatchResponse response = inventoryService.createBatch(request);
        return ResponseEntity.ok(ApiResponse.success("Nhập lô hàng kho thành công", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PaginatedResponse<BatchResponse>>> getBatches(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long variantId,
            @RequestParam(required = false) Boolean isQuarantined,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "receivedDate"));
        PaginatedResponse<BatchResponse> response = inventoryService.getBatchesWithFilter(search, variantId, isQuarantined, pageable);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách lô hàng thành công", response));
    }

    @PostMapping("/{id}/quarantine")
    public ResponseEntity<ApiResponse<BatchResponse>> toggleQuarantine(
            @PathVariable Long id,
            @Valid @RequestBody com.peaksneaker.dto.request.QuarantineBatchRequest request,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.peaksneaker.security.UserDetailsImpl userDetails) {
        String actor = userDetails != null ? userDetails.getUsername() : "ADMIN";
        BatchResponse response = inventoryService.toggleQuarantine(id, request.getIsQuarantined(), request.getReason(), actor);
        String msg = Boolean.TRUE.equals(request.getIsQuarantined())
                ? "Phong tỏa lô hàng thành công. Lô hàng đã bị loại khỏi thuật toán xuất kho FIFO."
                : "Giải phóng phong tỏa lô hàng thành công.";
        return ResponseEntity.ok(ApiResponse.success(msg, response));
    }

    @GetMapping("/trace")
    public ResponseEntity<ApiResponse<com.peaksneaker.dto.response.BatchTraceabilityResponse>> traceBatch(
            @RequestParam String query) {
        com.peaksneaker.dto.response.BatchTraceabilityResponse response = inventoryService.traceBatch(query);
        return ResponseEntity.ok(ApiResponse.success("Truy xuất nguồn gốc lô hàng thành công", response));
    }

    @GetMapping("/{id}/supplier-claim")
    public ResponseEntity<ApiResponse<com.peaksneaker.dto.response.SupplierClaimResponse>> getSupplierClaim(
            @PathVariable Long id,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.peaksneaker.security.UserDetailsImpl userDetails) {
        String actor = userDetails != null ? userDetails.getUsername() : "ADMIN";
        com.peaksneaker.dto.response.SupplierClaimResponse response = inventoryService.generateSupplierClaim(id, actor);
        return ResponseEntity.ok(ApiResponse.success("Xuất hồ sơ khiếu nại nhà cung cấp thành công", response));
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<ApiResponse<PaginatedResponse<AuditLogResponse>>> getAuditLogs(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long variantId,
            @RequestParam(required = false) String categoryGroup,
            @RequestParam(required = false) String performedBy,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        if (startDate != null && endDate != null && startDate.isAfter(endDate)) {
            throw new BadRequestException("Ngày bắt đầu không được sau ngày kết thúc");
        }
        ZoneId zone = ZoneId.systemDefault();
        Instant startInstant = startDate != null ? startDate.atStartOfDay(zone).toInstant() : null;
        Instant endInstant = endDate != null ? endDate.plusDays(1).atStartOfDay(zone).minusNanos(1).toInstant() : null;

        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        PaginatedResponse<AuditLogResponse> response = inventoryService.getAuditLogs(
                search, variantId, categoryGroup, performedBy, startInstant, endInstant, pageable);
        return ResponseEntity.ok(ApiResponse.success("Lấy nhật ký hoạt động thành công", response));
    }

    @GetMapping("/audit-logs/summary")
    public ResponseEntity<ApiResponse<AuditLogSummaryResponse>> getAuditLogSummary() {
        return ResponseEntity.ok(ApiResponse.success(
                "Lấy thống kê nhật ký hoạt động thành công",
                inventoryService.getAuditLogSummary()));
    }

    @GetMapping("/forecast")
    public ResponseEntity<ApiResponse<PaginatedResponse<InventoryForecastItemResponse>>> getInventoryForecast(
            @RequestParam(defaultValue = "30") int days,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long brandId,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String forecastStatus,
            @RequestParam(defaultValue = "urgency") String sortBy,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        if (startDate != null && endDate != null && startDate.isAfter(endDate)) {
            throw new BadRequestException("Ngày bắt đầu không được sau ngày kết thúc");
        }
        PaginatedResponse<InventoryForecastItemResponse> response = inventoryService.getInventoryForecast(
                days, startDate, endDate, search, brandId, categoryId, forecastStatus, sortBy, page, size);
        return ResponseEntity.ok(ApiResponse.success("Lấy dữ liệu dự báo tồn kho thành công", response));
    }

    @GetMapping("/forecast/summary")
    public ResponseEntity<ApiResponse<InventoryForecastSummaryResponse>> getInventoryForecastSummary(
            @RequestParam(defaultValue = "30") int days,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        if (startDate != null && endDate != null && startDate.isAfter(endDate)) {
            throw new BadRequestException("Ngày bắt đầu không được sau ngày kết thúc");
        }
        return ResponseEntity.ok(ApiResponse.success(
                "Lấy tổng quan dự báo tồn kho thành công",
                inventoryService.getInventoryForecastSummary(days, startDate, endDate)));
    }

    @GetMapping("/low-stock")
    public ResponseEntity<ApiResponse<List<ProductVariantResponse>>> getLowStock(
            @RequestParam(defaultValue = "10") Integer threshold) {
        List<ProductVariantResponse> response = inventoryService.getLowStockVariants(threshold);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách sản phẩm cảnh báo tồn thấp thành công", response));
    }
}
