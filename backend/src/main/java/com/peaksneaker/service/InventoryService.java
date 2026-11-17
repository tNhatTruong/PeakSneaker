package com.peaksneaker.service;

import com.peaksneaker.dto.request.CreateBatchRequest;
import com.peaksneaker.dto.request.CreateTransactionRequest;
import com.peaksneaker.dto.request.CreateVariantRequest;
import com.peaksneaker.dto.response.*;
import com.peaksneaker.enums.InventoryTransactionType;
import com.peaksneaker.enums.InventoryStockStatus;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public interface InventoryService {
    PaginatedResponse<InventoryVariantResponse> getVariants(
            String search,
            Long productId,
            Long brandId,
            Long categoryId,
            Long silhouetteId,
            InventoryStockStatus stockStatus,
            int page,
            int size,
            String sortBy,
            String sortDirection
    );
    InventoryVariantSummaryResponse getVariantSummary();
    InventoryVariantResponse updateSafetyStockThreshold(Long variantId, int threshold);
    ProductVariantResponse createVariant(Long productId, CreateVariantRequest request);
    InventoryTransactionResponse createTransaction(CreateTransactionRequest request);
    PaginatedResponse<InventoryTransactionResponse> getTransactions(
            Long productId,
            Long variantId,
            InventoryTransactionType type,
            Instant startDate,
            Instant endDate,
            int page,
            int size
    );
    BatchResponse createBatch(CreateBatchRequest request);
    PaginatedResponse<BatchResponse> getBatches(Pageable pageable);
    PaginatedResponse<BatchResponse> getBatches(Long variantId, Pageable pageable);
    PaginatedResponse<BatchResponse> getBatchesWithFilter(String search, Long variantId, Boolean isQuarantined, Pageable pageable);
    BatchResponse toggleQuarantine(Long batchId, boolean isQuarantined, String reason, String actor);
    BatchTraceabilityResponse traceBatch(String query);
    SupplierClaimResponse generateSupplierClaim(Long batchId, String actor);
    PaginatedResponse<AuditLogResponse> getAuditLogs(Long variantId, Pageable pageable);
    PaginatedResponse<AuditLogResponse> getAuditLogs(
            String search,
            Long variantId,
            String categoryGroup,
            String performedBy,
            Instant startDate,
            Instant endDate,
            Pageable pageable
    );
    AuditLogSummaryResponse getAuditLogSummary();
    PaginatedResponse<InventoryForecastItemResponse> getInventoryForecast(
            int days,
            String search,
            Long brandId,
            Long categoryId,
            String forecastStatus,
            String sortBy,
            int page,
            int size
    );
    PaginatedResponse<InventoryForecastItemResponse> getInventoryForecast(
            int days,
            LocalDate startDate,
            LocalDate endDate,
            String search,
            Long brandId,
            Long categoryId,
            String forecastStatus,
            String sortBy,
            int page,
            int size
    );
    InventoryForecastSummaryResponse getInventoryForecastSummary(int days);
    InventoryForecastSummaryResponse getInventoryForecastSummary(int days, LocalDate startDate, LocalDate endDate);
    List<ProductVariantResponse> getLowStockVariants(Integer threshold);
    void deductBatchesFifo(Long variantId, int quantityToDeduct);
    void restoreBatchesFifo(Long variantId, int quantityToRestore);
}
