package com.peaksneaker.controller.admin;

import com.peaksneaker.dto.request.CreateTransactionRequest;
import com.peaksneaker.dto.request.CreateVariantRequest;
import com.peaksneaker.dto.response.ApiResponse;
import com.peaksneaker.dto.response.InventoryTransactionResponse;
import com.peaksneaker.dto.response.InventoryVariantResponse;
import com.peaksneaker.dto.response.InventoryVariantSummaryResponse;
import com.peaksneaker.dto.response.PaginatedResponse;
import com.peaksneaker.dto.response.ProductVariantResponse;
import com.peaksneaker.enums.InventoryTransactionType;
import com.peaksneaker.enums.InventoryStockStatus;
import com.peaksneaker.exception.BadRequestException;
import com.peaksneaker.service.InventoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.Instant;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping("/inventory/variants")
    public ResponseEntity<ApiResponse<PaginatedResponse<InventoryVariantResponse>>> getVariants(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) Long brandId,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long silhouetteId,
            @RequestParam(required = false) InventoryStockStatus stockStatus,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection) {
        return ResponseEntity.ok(ApiResponse.success("OK", inventoryService.getVariants(
                search, productId, brandId, categoryId, silhouetteId, stockStatus,
                page, size, sortBy, sortDirection)));
    }

    @GetMapping("/inventory/variants/summary")
    public ResponseEntity<ApiResponse<InventoryVariantSummaryResponse>> getVariantSummary() {
        return ResponseEntity.ok(ApiResponse.success("OK", inventoryService.getVariantSummary()));
    }

    @PatchMapping("/inventory/variants/{variantId}/threshold")
    public ResponseEntity<ApiResponse<InventoryVariantResponse>> updateSafetyStockThreshold(
            @PathVariable Long variantId,
            @RequestParam int threshold) {
        return ResponseEntity.ok(ApiResponse.success(
                "Cập nhật ngưỡng tồn kho an toàn thành công",
                inventoryService.updateSafetyStockThreshold(variantId, threshold)));
    }

    @PostMapping("/products/{productId}/variants")
    public ResponseEntity<ApiResponse<ProductVariantResponse>> createVariant(
            @PathVariable Long productId,
            @Valid @RequestBody CreateVariantRequest request) {
        ProductVariantResponse variant = inventoryService.createVariant(productId, request);
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
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Instant startInstant = null;
        Instant endInstant = null;
        ZoneId zone = ZoneId.systemDefault();

        if (startDate != null && endDate != null && startDate.isAfter(endDate)) {
            throw new BadRequestException("Ngày bắt đầu không được sau ngày kết thúc");
        }

        if (startDate != null) startInstant = startDate.atStartOfDay(zone).toInstant();
        if (endDate != null) endInstant = endDate.plusDays(1).atStartOfDay(zone).minusNanos(1).toInstant();

        PaginatedResponse<InventoryTransactionResponse> response = inventoryService.getTransactions(
                productId, variantId, type, startInstant, endInstant, page, size);

        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách giao dịch kho thành công", response));
    }
}
