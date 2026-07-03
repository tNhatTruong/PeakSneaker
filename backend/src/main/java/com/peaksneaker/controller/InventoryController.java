package com.peaksneaker.controller;

import com.peaksneaker.dto.request.CreateTransactionRequest;
import com.peaksneaker.dto.request.CreateVariantRequest;
import com.peaksneaker.dto.response.ApiResponse;
import com.peaksneaker.dto.response.InventoryTransactionResponse;
import com.peaksneaker.dto.response.PaginatedResponse;
import com.peaksneaker.entity.ProductVariant;
import com.peaksneaker.enums.InventoryTransactionType;
import com.peaksneaker.service.InventoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.Instant;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    @PostMapping("/products/{productId}/variants")
    public ResponseEntity<ApiResponse<ProductVariant>> createVariant(
            @PathVariable Long productId,
            @Valid @RequestBody CreateVariantRequest request) {
        ProductVariant variant = inventoryService.createVariant(productId, request);
        return ResponseEntity.ok(ApiResponse.success("Tạo biến thể mới thành công", variant));
    }

    @PostMapping("/inventory/transactions")
    public ResponseEntity<ApiResponse<InventoryTransactionResponse>> createTransaction(
            @Valid @RequestBody CreateTransactionRequest request) {
        InventoryTransactionResponse response = inventoryService.createTransaction(request);
        return ResponseEntity.ok(ApiResponse.success("Thực hiện giao dịch kho thành công", response));
    }

    @GetMapping("/inventory/transactions")
    public ResponseEntity<ApiResponse<PaginatedResponse<InventoryTransactionResponse>>> getTransactions(
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) Long variantId,
            @RequestParam(required = false) InventoryTransactionType type,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Instant startInstant = null;
        Instant endInstant = null;
        ZoneId zone = ZoneId.systemDefault();

        if (startDate != null && !startDate.isBlank()) {
            try {
                LocalDate localDate = LocalDate.parse(startDate, DateTimeFormatter.ISO_LOCAL_DATE);
                startInstant = localDate.atStartOfDay(zone).toInstant();
            } catch (Exception ignored) {}
        }

        if (endDate != null && !endDate.isBlank()) {
            try {
                LocalDate localDate = LocalDate.parse(endDate, DateTimeFormatter.ISO_LOCAL_DATE);
                // Lấy đến cuối ngày (23:59:59)
                endInstant = localDate.atTime(23, 59, 59).atZone(zone).toInstant();
            } catch (Exception ignored) {}
        }

        PaginatedResponse<InventoryTransactionResponse> response = inventoryService.getTransactions(
                productId, variantId, type, startInstant, endInstant, page, size);

        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách giao dịch kho thành công", response));
    }
}
