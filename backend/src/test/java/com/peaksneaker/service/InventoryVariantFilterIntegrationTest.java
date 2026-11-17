package com.peaksneaker.service;

import com.peaksneaker.dto.response.InventoryVariantResponse;
import com.peaksneaker.dto.response.InventoryVariantSummaryResponse;
import com.peaksneaker.dto.response.PaginatedResponse;
import com.peaksneaker.entity.ProductVariant;
import com.peaksneaker.enums.InventoryStockStatus;
import com.peaksneaker.repository.ProductVariantRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class InventoryVariantFilterIntegrationTest {

    @Autowired
    private InventoryService inventoryService;

    @Autowired
    private ProductVariantRepository productVariantRepository;

    @Test
    void summaryShouldPartitionEveryVariantIntoOneStockStatus() {
        InventoryVariantSummaryResponse summary = inventoryService.getVariantSummary();

        assertThat(summary.getTotal()).isPositive();
        assertThat(summary.getTotal()).isEqualTo(
                summary.getInStock()
                        + summary.getLowStock()
                        + summary.getOutOfStock()
                        + summary.getInactive());
    }

    @Test
    void searchShouldMatchSkuAcrossTheWholeCatalog() {
        ProductVariant candidate = productVariantRepository.findAll().stream()
                .filter(variant -> variant.getSku() != null && !variant.getSku().isBlank())
                .findFirst()
                .orElseThrow();

        PaginatedResponse<InventoryVariantResponse> result = inventoryService.getVariants(
                candidate.getSku(), null, null, null, null, null,
                0, 20, "createdAt", "desc");

        assertThat(result.getItems())
                .extracting(InventoryVariantResponse::getId)
                .contains(candidate.getId());
    }

    @Test
    void lowStockFilterShouldUseEachVariantSafetyThreshold() {
        PaginatedResponse<InventoryVariantResponse> result = inventoryService.getVariants(
                null, null, null, null, null, InventoryStockStatus.LOW_STOCK,
                0, 100, "stockQuantity", "asc");

        assertThat(result.getItems())
                .isNotEmpty()
                .allSatisfy(variant -> {
                    assertThat(variant.getProductInactive()).isFalse();
                    assertThat(variant.getStock()).isPositive();
                    assertThat(variant.getStock()).isLessThanOrEqualTo(variant.getSafetyStockThreshold());
                });
    }

    @Test
    void negativePageAndOversizedPageSizeShouldBeNormalized() {
        PaginatedResponse<InventoryVariantResponse> result = inventoryService.getVariants(
                null, null, null, null, null, null,
                -1, 500, "unsupported", "unsupported");

        assertThat(result.getPage()).isZero();
        assertThat(result.getSize()).isEqualTo(100);
    }

    @Test
    void getBatchesWithFilterShouldSupportNullAndNonNullFiltersWithoutSqlExceptions() {
        org.springframework.data.domain.PageRequest pageable =
                org.springframework.data.domain.PageRequest.of(0, 10, org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "receivedDate"));

        // All null filters
        PaginatedResponse<com.peaksneaker.dto.response.BatchResponse> allBatches =
                inventoryService.getBatchesWithFilter(null, null, null, pageable);
        assertThat(allBatches).isNotNull();

        // Filter by quarantined
        PaginatedResponse<com.peaksneaker.dto.response.BatchResponse> quarantinedBatches =
                inventoryService.getBatchesWithFilter(null, null, true, pageable);
        assertThat(quarantinedBatches).isNotNull();

        // Filter by search string
        PaginatedResponse<com.peaksneaker.dto.response.BatchResponse> searchedBatches =
                inventoryService.getBatchesWithFilter("PO-", null, null, pageable);
        assertThat(searchedBatches).isNotNull();
    }

    @Test
    void traceBatchAndSupplierClaimShouldComputeAccurately() {
        var batchPage = inventoryService.getBatchesWithFilter(null, null, null, org.springframework.data.domain.PageRequest.of(0, 1));
        if (!batchPage.getItems().isEmpty()) {
            var firstBatch = batchPage.getItems().get(0);
            var trace = inventoryService.traceBatch(firstBatch.getBatchCode());
            assertThat(trace).isNotNull();
            assertThat(trace.getBatch()).isNotNull();
            assertThat(trace.getBatch().getBatchCode()).isEqualTo(firstBatch.getBatchCode());

            var claim = inventoryService.generateSupplierClaim(firstBatch.getId(), "TEST_ADMIN");
            assertThat(claim).isNotNull();
            assertThat(claim.getBatchCode()).isEqualTo(firstBatch.getBatchCode());
            assertThat(claim.getTotalClaimQuantity()).isGreaterThanOrEqualTo(0);
            assertThat(claim.getTotalClaimAmount()).isGreaterThanOrEqualTo(java.math.BigDecimal.ZERO);
        }
    }
}
