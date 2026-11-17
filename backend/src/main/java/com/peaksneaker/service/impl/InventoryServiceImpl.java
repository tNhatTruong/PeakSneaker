package com.peaksneaker.service.impl;

import com.peaksneaker.dto.request.CreateBatchRequest;
import com.peaksneaker.dto.request.CreateTransactionRequest;
import com.peaksneaker.dto.request.CreateVariantRequest;
import com.peaksneaker.dto.response.*;
import com.peaksneaker.entity.*;
import com.peaksneaker.enums.InventoryChangeType;
import com.peaksneaker.enums.InventoryTransactionType;
import com.peaksneaker.enums.InventoryStockStatus;
import com.peaksneaker.enums.ProductType;
import com.peaksneaker.exception.BadRequestException;
import com.peaksneaker.exception.ConflictException;
import com.peaksneaker.exception.ResourceNotFoundException;
import com.peaksneaker.repository.*;
import com.peaksneaker.repository.specification.InventoryTransactionSpecification;
import com.peaksneaker.repository.specification.InventoryVariantSpecification;
import com.peaksneaker.service.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InventoryServiceImpl implements InventoryService {

    private static final Set<String> STANDARD_EU_SHOE_SIZES = Set.of(
            "35", "36", "37", "38", "39", "40",
            "41", "42", "43", "44", "45", "46");
    private static final Set<String> STANDARD_NON_SHOE_SIZES = Set.of(
            "ONE SIZE", "S", "M", "L", "XL");

    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final InventoryBatchRepository inventoryBatchRepository;
    private final InventoryAuditLogRepository inventoryAuditLogRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderReturnRepository orderReturnRepository;
    private final OrderRepository orderRepository;

    @Override
    public PaginatedResponse<InventoryVariantResponse> getVariants(
            String search,
            Long productId,
            Long brandId,
            Long categoryId,
            Long silhouetteId,
            InventoryStockStatus stockStatus,
            int page,
            int size,
            String sortBy,
            String sortDirection) {
        Sort.Direction direction = "asc".equalsIgnoreCase(sortDirection)
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;
        String safeSortBy = switch (sortBy) {
            case "sku", "stockQuantity", "updatedAt", "createdAt" -> sortBy;
            default -> "createdAt";
        };
        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.min(Math.max(size, 1), 100),
                Sort.by(direction, safeSortBy));
        Specification<ProductVariant> specification = InventoryVariantSpecification.filter(
                search, productId, brandId, categoryId, silhouetteId, stockStatus);
        return PaginatedResponse.from(productVariantRepository.findAll(specification, pageable)
                .map(this::mapVariantResponse));
    }

    @Override
    public InventoryVariantSummaryResponse getVariantSummary() {
        return InventoryVariantSummaryResponse.builder()
                .total(productVariantRepository.count())
                .inStock(countVariantsByStatus(InventoryStockStatus.IN_STOCK))
                .lowStock(countVariantsByStatus(InventoryStockStatus.LOW_STOCK))
                .outOfStock(countVariantsByStatus(InventoryStockStatus.OUT_OF_STOCK))
                .inactive(countVariantsByStatus(InventoryStockStatus.INACTIVE))
                .build();
    }

    @Override
    @Transactional
    public InventoryVariantResponse updateSafetyStockThreshold(Long variantId, int threshold) {
        if (threshold < 0) {
            throw new BadRequestException("Ngưỡng tồn kho an toàn không được nhỏ hơn 0.");
        }
        ProductVariant variant = productVariantRepository.findByIdWithLock(variantId)
                .orElseThrow(() -> new ResourceNotFoundException("Biến thể", "id", variantId));
        variant.setSafetyStockThreshold(threshold);
        ProductVariant saved = productVariantRepository.save(variant);
        return mapVariantResponse(saved);
    }

    private long countVariantsByStatus(InventoryStockStatus status) {
        return productVariantRepository.count(InventoryVariantSpecification.filter(
                null, null, null, null, null, status));
    }

    private InventoryVariantResponse mapVariantResponse(ProductVariant variant) {
        Product product = variant.getProduct();
        String imageUrl = product.getImages().stream()
                .filter(image -> Boolean.TRUE.equals(image.getIsPrimary()))
                .findFirst()
                .or(() -> product.getImages().stream().findFirst())
                .map(Image::getImageUrl)
                .orElse(null);
        return InventoryVariantResponse.builder()
                .id(variant.getId())
                .productId(product.getId())
                .productName(product.getName())
                .productImageUrl(imageUrl)
                .brandId(product.getBrand() != null ? product.getBrand().getId() : null)
                .brandName(product.getBrand() != null ? product.getBrand().getName() : null)
                .categoryId(product.getCategory() != null ? product.getCategory().getId() : null)
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                .silhouetteId(product.getSilhouette() != null ? product.getSilhouette().getId() : null)
                .silhouetteName(product.getSilhouette() != null ? product.getSilhouette().getName() : null)
                .sku(variant.getSku())
                .color(variant.getColor())
                .size(variant.getSize())
                .stock(variant.getStockQuantity())
                .safetyStockThreshold(variant.getSafetyStockThreshold())
                .priceAdjustment(variant.getPriceAdjustment())
                .finalPrice(variant.getFinalPrice())
                .productInactive(Boolean.TRUE.equals(product.getIsDeleted()))
                .createdAt(variant.getCreatedAt())
                .build();
    }

    @Override
    @Transactional
    public ProductVariantResponse createVariant(Long productId, CreateVariantRequest request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm", "id", productId));

        String normalizedSize = request.getSize().trim().toUpperCase(Locale.ROOT);
        if (product.getProductType() == ProductType.SNEAKER
                && !STANDARD_EU_SHOE_SIZES.contains(normalizedSize)) {
            throw new BadRequestException("Size giày phải theo chuẩn EU/VN, là số nguyên từ 35 đến 46.");
        }
        if (product.getProductType() != ProductType.SNEAKER
                && !STANDARD_NON_SHOE_SIZES.contains(normalizedSize)) {
            throw new BadRequestException("Kích cỡ phụ kiện phải là ONE SIZE, S, M, L hoặc XL.");
        }

        if (productVariantRepository.existsBySku(request.getSku())) {
            throw new ConflictException("Mã SKU này đã tồn tại trong hệ thống: " + request.getSku());
        }

        BigDecimal priceAdjustment = request.getPriceAdjustment() != null ? request.getPriceAdjustment() : BigDecimal.ZERO;

        ProductVariant variant = ProductVariant.builder()
                .product(product)
                .color(request.getColor())
                .size(normalizedSize)
                .sku(request.getSku())
                .stockQuantity(0)
                .priceAdjustment(priceAdjustment)
                .build();

        ProductVariant saved = productVariantRepository.save(variant);

        return ProductVariantResponse.builder()
                .id(saved.getId())
                .sku(saved.getSku())
                .color(saved.getColor())
                .size(saved.getSize())
                .stock(saved.getStockQuantity())
                .priceMultiplier(saved.getPriceAdjustment())
                .originalPrice(saved.getOriginalPrice())
                .finalPrice(saved.getFinalPrice())
                .build();
    }

    @Override
    @Transactional
    public InventoryTransactionResponse createTransaction(CreateTransactionRequest request) {
        ProductVariant variant = productVariantRepository.findByIdWithLock(request.getVariantId())
                .orElseThrow(() -> new ResourceNotFoundException("Biến thể", "id", request.getVariantId()));

        String actor = resolveCurrentActor();
        String auditReason;

        if (request.getType() == InventoryTransactionType.IMPORT) {
            variant.increaseStock(request.getQuantity());
            InventoryBatch batch = createBatchForImportTransaction(variant, request);
            String baseNote = request.getNote() == null || request.getNote().isBlank()
                    ? "Nhập kho theo lô " + batch.getBatchCode() + " (NCC: " + batch.getSupplierName() + ")"
                    : request.getNote().trim() + " [Lô: " + batch.getBatchCode() + " · NCC: " + batch.getSupplierName() + "]";
            auditReason = baseNote;
        } else if (request.getType() == InventoryTransactionType.EXPORT) {
            if (variant.getStockQuantity() < request.getQuantity()) {
                throw new BadRequestException("Số lượng tồn kho hiện tại không đủ. Hiện có: "
                        + variant.getStockQuantity() + ", yêu cầu xuất: " + request.getQuantity());
            }
            variant.decreaseStock(request.getQuantity());
            deductBatchesFifo(variant.getId(), request.getQuantity());
            auditReason = request.getNote() == null || request.getNote().isBlank()
                    ? "Xuất kho / điều chỉnh kiểm kê thủ công"
                    : request.getNote().trim();
        } else {
            auditReason = request.getNote() == null || request.getNote().isBlank()
                    ? "Điều chỉnh kho"
                    : request.getNote().trim();
        }

        productVariantRepository.save(variant);

        int quantityChanged = request.getType() == InventoryTransactionType.IMPORT
                ? request.getQuantity()
                : -request.getQuantity();
        InventoryAuditLog transaction = InventoryAuditLog.builder()
                .variant(variant)
                .changeType(request.getType() == InventoryTransactionType.IMPORT
                        ? InventoryChangeType.IMPORT
                        : InventoryChangeType.ADJUSTMENT)
                .quantityChanged(quantityChanged)
                .balanceAfter(variant.getStockQuantity())
                .reason(auditReason)
                .performedBy(actor)
                .build();

        InventoryAuditLog saved = inventoryAuditLogRepository.save(transaction);
        return mapToResponse(saved);
    }

    private InventoryBatch createBatchForImportTransaction(ProductVariant variant, CreateTransactionRequest request) {
        String batchCode = request.getBatchCode() != null && !request.getBatchCode().isBlank()
                ? request.getBatchCode().trim().toUpperCase(Locale.ROOT)
                : generateUniqueBatchCode(variant);
        if (inventoryBatchRepository.existsByBatchCode(batchCode)) {
            throw new ConflictException("Mã lô hàng này đã tồn tại: " + batchCode);
        }

        List<InventoryBatch> existingBatches = inventoryBatchRepository.findByVariantIdOrderByReceivedDateDescIdDesc(variant.getId());
        InventoryBatch latestBatch = existingBatches.isEmpty() ? null : existingBatches.get(0);

        String defaultSupplier = variant.getProduct() != null && variant.getProduct().getBrand() != null
                ? variant.getProduct().getBrand().getName() + " Official Distribution"
                : "Nhà phân phối chính hãng";
        String supplierName = request.getSupplierName() != null && !request.getSupplierName().isBlank()
                ? request.getSupplierName().trim()
                : (latestBatch != null && latestBatch.getSupplierName() != null && !latestBatch.getSupplierName().isBlank()
                        ? latestBatch.getSupplierName()
                        : defaultSupplier);

        BigDecimal fallbackCost = variant.getFinalPrice() != null
                ? variant.getFinalPrice().multiply(BigDecimal.valueOf(0.65)).setScale(0, RoundingMode.HALF_UP)
                : BigDecimal.valueOf(1000000);
        BigDecimal unitCost = request.getUnitCost() != null && request.getUnitCost().compareTo(BigDecimal.ZERO) > 0
                ? request.getUnitCost()
                : (latestBatch != null && latestBatch.getUnitCost() != null && latestBatch.getUnitCost().compareTo(BigDecimal.ZERO) > 0
                        ? latestBatch.getUnitCost()
                        : fallbackCost);

        InventoryBatch batch = InventoryBatch.builder()
                .variant(variant)
                .batchCode(batchCode)
                .supplierName(supplierName)
                .quantityImported(request.getQuantity())
                .quantityRemaining(request.getQuantity())
                .unitCost(unitCost)
                .manufacturingDate(request.getManufacturingDate())
                .expiryDate(request.getExpiryDate())
                .receivedDate(Instant.now())
                .build();
        return inventoryBatchRepository.save(batch);
    }

    private String generateUniqueBatchCode(ProductVariant variant) {
        String skuPart = variant.getSku() != null
                ? variant.getSku().replaceAll("[^A-Za-z0-9]", "").toUpperCase(Locale.ROOT)
                : "VAR" + variant.getId();
        if (skuPart.length() > 8) {
            skuPart = skuPart.substring(0, 8);
        }
        String datePart = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);
        for (int attempt = 1; attempt <= 50; attempt++) {
            String candidate = String.format("BATCH-%s-%s-%02d", skuPart, datePart, attempt);
            if (!inventoryBatchRepository.existsByBatchCode(candidate)) {
                return candidate;
            }
        }
        return "BATCH-" + skuPart + "-" + System.currentTimeMillis();
    }

    @Override
    @Transactional
    public void deductBatchesFifo(Long variantId, int quantityToDeduct) {
        if (variantId == null || quantityToDeduct <= 0) return;
        int remaining = quantityToDeduct;
        List<InventoryBatch> activeBatches = inventoryBatchRepository
                .findByVariantIdAndQuantityRemainingGreaterThanAndIsQuarantinedFalseOrderByReceivedDateAscIdAsc(variantId, 0);
        for (InventoryBatch batch : activeBatches) {
            if (remaining <= 0) break;
            int available = batch.getQuantityRemaining() != null ? batch.getQuantityRemaining() : 0;
            if (available <= 0) continue;
            int deducted = Math.min(available, remaining);
            batch.setQuantityRemaining(available - deducted);
            inventoryBatchRepository.save(batch);
            remaining -= deducted;
        }
    }

    @Override
    @Transactional
    public void restoreBatchesFifo(Long variantId, int quantityToRestore) {
        if (variantId == null || quantityToRestore <= 0) return;
        int remaining = quantityToRestore;
        List<InventoryBatch> batches = inventoryBatchRepository
                .findByVariantIdOrderByReceivedDateDescIdDesc(variantId);
        if (batches.isEmpty()) return;

        // Ưu tiên hoàn vào các lô còn dung lượng chưa đầy (quantityRemaining < quantityReceived)
        for (InventoryBatch batch : batches) {
            if (remaining <= 0) break;
            int received = batch.getQuantityImported() != null ? batch.getQuantityImported() : 0;
            int current = batch.getQuantityRemaining() != null ? batch.getQuantityRemaining() : 0;
            int capacity = Math.max(0, received - current);
            if (capacity <= 0) continue;

            int restored = Math.min(capacity, remaining);
            batch.setQuantityRemaining(current + restored);
            inventoryBatchRepository.save(batch);
            remaining -= restored;
        }

        // Nếu còn dư (ví dụ tất cả các lô đã đầy), cộng vào lô mới nhất
        if (remaining > 0) {
            InventoryBatch latest = batches.get(0);
            int current = latest.getQuantityRemaining() != null ? latest.getQuantityRemaining() : 0;
            latest.setQuantityRemaining(current + remaining);
            inventoryBatchRepository.save(latest);
        }
    }

    private String resolveCurrentActor() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            String name = authentication.getName();
            if (name != null && !name.isBlank() && !"anonymousUser".equalsIgnoreCase(name)) {
                return name;
            }
        }
        return "ADMIN";
    }

    @Override
    public PaginatedResponse<InventoryTransactionResponse> getTransactions(
            Long productId,
            Long variantId,
            InventoryTransactionType type,
            Instant startDate,
            Instant endDate,
            int page,
            int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Specification<InventoryAuditLog> spec = InventoryTransactionSpecification.filterTransactions(
                productId, variantId, type, startDate, endDate);
        
        Page<InventoryAuditLog> transactionPage = inventoryAuditLogRepository.findAll(spec, pageable);
        Page<InventoryTransactionResponse> responsePage = transactionPage.map(this::mapToResponse);
        return PaginatedResponse.from(responsePage);
    }

    @Override
    @Transactional
    public BatchResponse createBatch(CreateBatchRequest request) {
        if (inventoryBatchRepository.existsByBatchCode(request.getBatchCode())) {
            throw new ConflictException("Mã lô hàng này đã tồn tại: " + request.getBatchCode());
        }

        ProductVariant variant = productVariantRepository.findByIdWithLock(request.getVariantId())
                .orElseThrow(() -> new ResourceNotFoundException("Biến thể", "id", request.getVariantId()));

        String poNumber = request.getPoNumber() != null && !request.getPoNumber().isBlank()
                ? request.getPoNumber().trim()
                : "PO-" + LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE) + "-" + variant.getId();
        String invoiceNumber = request.getInvoiceNumber() != null && !request.getInvoiceNumber().isBlank()
                ? request.getInvoiceNumber().trim()
                : null;
        String paymentStatus = request.getPaymentStatus() != null && !request.getPaymentStatus().isBlank()
                ? request.getPaymentStatus().trim()
                : "PAID";

        InventoryBatch batch = InventoryBatch.builder()
                .variant(variant)
                .batchCode(request.getBatchCode().trim())
                .supplierName(request.getSupplierName().trim())
                .quantityImported(request.getQuantityImported())
                .quantityRemaining(request.getQuantityImported())
                .unitCost(request.getUnitCost())
                .manufacturingDate(request.getManufacturingDate())
                .expiryDate(request.getExpiryDate())
                .poNumber(poNumber)
                .invoiceNumber(invoiceNumber)
                .paymentStatus(paymentStatus)
                .isQuarantined(false)
                .receivedDate(Instant.now())
                .build();

        batch = inventoryBatchRepository.save(batch);

        // Tăng số lượng tồn kho
        variant.setStockQuantity(variant.getStockQuantity() + request.getQuantityImported());
        productVariantRepository.save(variant);

        // Ghi nhận Audit Log
        InventoryAuditLog auditLog = InventoryAuditLog.builder()
                .variant(variant)
                .changeType(InventoryChangeType.IMPORT)
                .quantityChanged(request.getQuantityImported())
                .balanceAfter(variant.getStockQuantity())
                .reason("Nhập hàng theo lô mã: " + batch.getBatchCode() + " từ NCC: " + batch.getSupplierName())
                .performedBy(resolveCurrentActor())
                .build();
        inventoryAuditLogRepository.save(auditLog);

        return BatchResponse.fromEntity(batch);
    }

    @Override
    public PaginatedResponse<BatchResponse> getBatches(Pageable pageable) {
        return getBatches(null, pageable);
    }

    @Override
    public PaginatedResponse<BatchResponse> getBatches(Long variantId, Pageable pageable) {
        Page<InventoryBatch> batchPage = variantId != null
                ? inventoryBatchRepository.findByVariantId(variantId, pageable)
                : inventoryBatchRepository.findAll(pageable);
        return PaginatedResponse.from(batchPage.map(BatchResponse::fromEntity));
    }

    @Override
    @Transactional(readOnly = true)
    public PaginatedResponse<BatchResponse> getBatchesWithFilter(String search, Long variantId, Boolean isQuarantined, Pageable pageable) {
        String cleanSearch = (search != null && !search.trim().isBlank()) ? search.trim() : null;
        org.springframework.data.jpa.domain.Specification<InventoryBatch> spec =
                com.peaksneaker.repository.specification.InventoryBatchSpecification.withFilters(cleanSearch, variantId, isQuarantined);
        Page<InventoryBatch> batchPage = inventoryBatchRepository.findAll(spec, pageable);
        return PaginatedResponse.from(batchPage.map(BatchResponse::fromEntity));
    }

    @Override
    @Transactional
    public BatchResponse toggleQuarantine(Long batchId, boolean isQuarantined, String reason, String actor) {
        InventoryBatch batch = inventoryBatchRepository.findById(batchId)
                .orElseThrow(() -> new ResourceNotFoundException("Lô hàng", "id", batchId));

        boolean currentlyQuarantined = Boolean.TRUE.equals(batch.getIsQuarantined());
        batch.setIsQuarantined(isQuarantined);
        batch.setQuarantineReason(isQuarantined ? reason : null);
        InventoryBatch saved = inventoryBatchRepository.save(batch);

        ProductVariant variant = productVariantRepository.findByIdWithLock(batch.getVariant().getId())
                .orElse(batch.getVariant());
        int batchRemaining = batch.getQuantityRemaining() != null ? batch.getQuantityRemaining() : 0;
        int quantityChanged = 0;

        if (currentlyQuarantined != isQuarantined && batchRemaining > 0 && variant != null) {
            int currentStock = variant.getStockQuantity() != null ? variant.getStockQuantity() : 0;
            if (isQuarantined) {
                int deducted = Math.min(currentStock, batchRemaining);
                variant.setStockQuantity(Math.max(0, currentStock - deducted));
                quantityChanged = -deducted;
            } else {
                variant.setStockQuantity(currentStock + batchRemaining);
                quantityChanged = batchRemaining;
            }
            productVariantRepository.save(variant);
        }

        String actionText = isQuarantined ? "PHONG TỎA LÔ HÀNG" : "GIẢI PHÓA PHONG TỎA";
        String note = String.format("[%s] Mã lô: %s. Lý do: %s. Tồn còn lại của lô: %d đôi.",
                actionText, batch.getBatchCode(), (reason != null ? reason : "Không có ghi chú"), batchRemaining);

        InventoryAuditLog auditLog = InventoryAuditLog.builder()
                .variant(variant)
                .changeType(isQuarantined ? InventoryChangeType.DEFECT : InventoryChangeType.ADJUSTMENT)
                .quantityChanged(quantityChanged)
                .balanceAfter(variant != null ? variant.getStockQuantity() : 0)
                .reason(note)
                .performedBy(actor != null ? actor : resolveCurrentActor())
                .build();
        inventoryAuditLogRepository.save(auditLog);

        return BatchResponse.fromEntity(saved);
    }

    @Override
    public BatchTraceabilityResponse traceBatch(String query) {
        if (query == null || query.trim().isBlank()) {
            throw new BadRequestException("Vui lòng cung cấp mã lô, mã đơn hàng hoặc mã RMA để truy xuất.");
        }
        String cleanQuery = query.trim();

        InventoryBatch batch = null;

        // 1. Thử tìm theo batch_code chính xác
        batch = inventoryBatchRepository.findByBatchCode(cleanQuery).orElse(null);

        // 2. Thử tìm theo ID nếu là số
        if (batch == null) {
            try {
                Long id = Long.parseLong(cleanQuery);
                batch = inventoryBatchRepository.findById(id).orElse(null);
            } catch (NumberFormatException ignored) {}
        }

        // 3. Thử tìm qua Order Code hoặc Order ID
        if (batch == null) {
            Order order = null;
            try {
                Long orderId = Long.parseLong(cleanQuery);
                order = orderRepository.findById(orderId).orElse(null);
            } catch (NumberFormatException ignored) {}
            if (order == null) {
                order = orderRepository.findByOrderCode(cleanQuery).orElse(null);
            }
            if (order != null && order.getItems() != null && !order.getItems().isEmpty()) {
                OrderItem firstItem = order.getItems().get(0);
                if (firstItem.getProductVariant() != null) {
                    List<InventoryBatch> batches = inventoryBatchRepository
                            .findByVariantIdOrderByReceivedDateDescIdDesc(firstItem.getProductVariant().getId());
                    if (!batches.isEmpty()) {
                        batch = batches.get(0);
                    }
                }
            }
        }

        // 4. Thử tìm qua RMA ID
        if (batch == null) {
            try {
                Long rmaId = Long.parseLong(cleanQuery);
                OrderReturn rma = orderReturnRepository.findById(rmaId).orElse(null);
                if (rma != null && rma.getItems() != null && !rma.getItems().isEmpty()) {
                    OrderItem orderItem = rma.getItems().get(0).getOrderItem();
                    if (orderItem != null && orderItem.getProductVariant() != null) {
                        List<InventoryBatch> batches = inventoryBatchRepository
                                .findByVariantIdOrderByReceivedDateDescIdDesc(orderItem.getProductVariant().getId());
                        if (!batches.isEmpty()) {
                            batch = batches.get(0);
                        }
                    }
                }
            } catch (NumberFormatException ignored) {}
        }

        if (batch == null) {
            throw new ResourceNotFoundException("Không tìm thấy dữ liệu lô hàng nào khớp với truy vấn: " + cleanQuery);
        }

        ProductVariant variant = batch.getVariant();
        Long variantId = variant.getId();

        // Lấy danh sách RMA liên quan đến biến thể này
        List<OrderReturn> rmaList = orderReturnRepository.findByProductVariantId(variantId);
        List<BatchTraceabilityResponse.TraceabilityRmaItem> rmaItems = new ArrayList<>();
        int totalRmaDefects = 0;

        for (OrderReturn rma : rmaList) {
            List<String> evidenceImages = new ArrayList<>();
            if (rma.getEvidenceImages() != null && !rma.getEvidenceImages().isBlank()) {
                String rawImg = rma.getEvidenceImages().trim();
                if (rawImg.startsWith("[") && rawImg.endsWith("]")) {
                    String inner = rawImg.substring(1, rawImg.length() - 1).trim();
                    if (!inner.isEmpty()) {
                        for (String part : inner.split(",")) {
                            String cleaned = part.trim().replaceAll("^\"|\"$", "");
                            if (!cleaned.isEmpty()) {
                                evidenceImages.add(cleaned);
                            }
                        }
                    }
                } else {
                    evidenceImages.add(rawImg);
                }
            }

            int reqQty = rma.getItems().stream()
                    .filter(i -> i.getOrderItem() != null && i.getOrderItem().getProductVariant() != null
                            && variantId.equals(i.getOrderItem().getProductVariant().getId()))
                    .mapToInt(OrderReturnItem::getRequestedQuantity)
                    .sum();
            int appQty = rma.getItems().stream()
                    .filter(i -> i.getOrderItem() != null && i.getOrderItem().getProductVariant() != null
                            && variantId.equals(i.getOrderItem().getProductVariant().getId()))
                    .mapToInt(OrderReturnItem::getApprovedQuantity)
                    .sum();

            String reasonCodeName = rma.getReasonCode() != null ? rma.getReasonCode().name() : "OTHER";
            boolean isNotRejected = rma.getStatus() == null || !"REJECTED".equalsIgnoreCase(rma.getStatus().name());
            boolean isQualityDefect = !"WRONG_SIZE".equals(reasonCodeName) && !"CHANGE_OF_MIND".equals(reasonCodeName);
            if (isNotRejected && isQualityDefect) {
                totalRmaDefects += (appQty > 0 ? appQty : reqQty);
            }

            String reasonLabel = switch (reasonCodeName) {
                case "DEFECTIVE_PRODUCT" -> "Lỗi sản xuất / Gia công";
                case "WRONG_ITEM" -> "Sai mẫu / Sai thông số lô";
                case "NOT_AS_DESCRIBED" -> "Không đúng tiêu chuẩn mô tả";
                case "SHIPPING_DAMAGE" -> "Hư hỏng bao bì / vận chuyển";
                case "WRONG_SIZE" -> "Khách đổi kích cỡ";
                case "CHANGE_OF_MIND" -> "Khách đổi nhu cầu";
                default -> "Lý do khác";
            };

            rmaItems.add(BatchTraceabilityResponse.TraceabilityRmaItem.builder()
                    .rmaId(rma.getId())
                    .orderId(rma.getOrder() != null ? rma.getOrder().getId() : null)
                    .customerEmail(rma.getUser() != null ? rma.getUser().getEmail() : null)
                    .reasonCode(reasonCodeName)
                    .reasonLabel(reasonLabel)
                    .customerNote(rma.getReason())
                    .requestedQuantity(reqQty)
                    .approvedQuantity(appQty)
                    .status(rma.getStatus() != null ? rma.getStatus().name() : null)
                    .evidenceImages(evidenceImages)
                    .requestedAt(rma.getCreatedAt())
                    .build());
        }

        // Lấy danh sách đơn hàng đã xuất biến thể này
        List<OrderItem> orderItems = orderItemRepository.findByProductVariantIdWithOrder(variantId, PageRequest.of(0, 20));
        List<BatchTraceabilityResponse.TraceabilityOrderItem> orderResponses = new ArrayList<>();
        int totalShipped = 0;

        for (OrderItem oi : orderItems) {
            Order o = oi.getOrder();
            totalShipped += (oi.getQuantity() != null ? oi.getQuantity() : 0);
            orderResponses.add(BatchTraceabilityResponse.TraceabilityOrderItem.builder()
                    .orderId(o.getId())
                    .orderCode(o.getOrderCode())
                    .customerName(o.getShippingName())
                    .customerEmail(o.getUser() != null ? o.getUser().getEmail() : null)
                    .customerPhone(o.getShippingPhone())
                    .quantity(oi.getQuantity())
                    .unitPrice(oi.getUnitPrice())
                    .orderStatus(o.getStatus() != null ? o.getStatus().name() : null)
                    .orderDate(o.getCreatedAt())
                    .build());
        }

        return BatchTraceabilityResponse.builder()
                .batch(BatchResponse.fromEntity(batch))
                .totalShipped(totalShipped)
                .totalRemaining(batch.getQuantityRemaining())
                .totalRmaDefects(totalRmaDefects)
                .isQuarantined(Boolean.TRUE.equals(batch.getIsQuarantined()))
                .quarantineReason(batch.getQuarantineReason())
                .relatedOrders(orderResponses)
                .relatedRmaReturns(rmaItems)
                .build();
    }

    @Override
    public SupplierClaimResponse generateSupplierClaim(Long batchId, String actor) {
        InventoryBatch batch = inventoryBatchRepository.findById(batchId)
                .orElseThrow(() -> new ResourceNotFoundException("Lô hàng", "id", batchId));

        ProductVariant variant = batch.getVariant();
        Product product = variant != null ? variant.getProduct() : null;

        BatchTraceabilityResponse trace = traceBatch(batch.getBatchCode());
        int defectCustomerCount = trace.getTotalRmaDefects();
        int quarantinedCount = Boolean.TRUE.equals(batch.getIsQuarantined()) && batch.getQuantityRemaining() != null
                ? batch.getQuantityRemaining()
                : 0;
        int totalClaimQty = defectCustomerCount + quarantinedCount;
        BigDecimal unitCost = batch.getUnitCost() != null ? batch.getUnitCost() : BigDecimal.ZERO;
        BigDecimal totalClaimAmount = unitCost.multiply(BigDecimal.valueOf(totalClaimQty));

        boolean isPaid = "PAID".equalsIgnoreCase(batch.getPaymentStatus());
        String settlementMethod = isPaid ? "CASH_REFUND_OR_REPLACEMENT" : "DEBIT_NOTE_OFFSET";
        String legalNotice = isPaid
                ? "Lô hàng đã thanh toán 100%. Căn cứ biên bản kiểm định chất lượng, PeakSneaker yêu cầu Nhà cung cấp giao bù lô hàng mới trong vòng 7 ngày làm việc hoặc hoàn trả trực tiếp số tiền bồi hoàn vào tài khoản ngân hàng."
                : "Lô hàng hiện đang trong thời gian giữ công nợ. Căn cứ biên bản kiểm định, PeakSneaker thông báo xuất Biên bản giảm trừ công nợ (Debit Note), khấu trừ trực tiếp số tiền bồi hoàn vào đợt thanh toán công nợ tiếp theo.";

        String claimNumber = "CLAIM-" + batch.getBatchCode() + "-" + (System.currentTimeMillis() % 10000);

        return SupplierClaimResponse.builder()
                .claimNumber(claimNumber)
                .generatedAt(Instant.now())
                .generatedBy(actor != null ? actor : resolveCurrentActor())
                .batchId(batch.getId())
                .batchCode(batch.getBatchCode())
                .supplierName(batch.getSupplierName())
                .poNumber(batch.getPoNumber())
                .invoiceNumber(batch.getInvoiceNumber())
                .paymentStatus(batch.getPaymentStatus())
                .unitCost(unitCost)
                .productName(product != null ? product.getName() : null)
                .brandName(product != null && product.getBrand() != null ? product.getBrand().getName() : null)
                .sku(variant != null ? variant.getSku() : null)
                .color(variant != null ? variant.getColor() : null)
                .size(variant != null ? variant.getSize() : null)
                .initialImportedQuantity(batch.getQuantityImported())
                .defectiveCustomerCount(defectCustomerCount)
                .quarantinedRemainingCount(quarantinedCount)
                .totalClaimQuantity(totalClaimQty)
                .totalClaimAmount(totalClaimAmount)
                .settlementMethod(settlementMethod)
                .legalNotice(legalNotice)
                .defectEvidences(trace.getRelatedRmaReturns())
                .build();
    }

    @Override
    public PaginatedResponse<AuditLogResponse> getAuditLogs(Long variantId, Pageable pageable) {
        return getAuditLogs(null, variantId, null, null, null, null, pageable);
    }

    @Override
    public PaginatedResponse<AuditLogResponse> getAuditLogs(
            String search,
            Long variantId,
            String categoryGroup,
            String performedBy,
            Instant startDate,
            Instant endDate,
            Pageable pageable
    ) {
        Specification<InventoryAuditLog> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            var variantJoin = root.join("variant", JoinType.LEFT);
            var productJoin = variantJoin.join("product", JoinType.LEFT);

            if (variantId != null) {
                predicates.add(cb.equal(variantJoin.get("id"), variantId));
            }
            if (performedBy != null && !performedBy.isBlank()) {
                predicates.add(cb.equal(cb.lower(root.get("performedBy")), performedBy.trim().toLowerCase(Locale.ROOT)));
            }
            if (categoryGroup != null && !categoryGroup.isBlank() && !"ALL".equalsIgnoreCase(categoryGroup)) {
                Set<InventoryChangeType> matchedTypes = resolveChangeTypesByGroup(categoryGroup);
                if (!matchedTypes.isEmpty()) {
                    predicates.add(root.get("changeType").in(matchedTypes));
                }
            }
            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), startDate));
            }
            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), endDate));
            }
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase(Locale.ROOT) + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(variantJoin.get("sku")), pattern),
                        cb.like(cb.lower(productJoin.get("name")), pattern),
                        cb.like(cb.lower(root.get("reason")), pattern),
                        cb.like(cb.lower(root.get("performedBy")), pattern)
                ));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<InventoryAuditLog> logs = inventoryAuditLogRepository.findAll(spec, pageable);
        return PaginatedResponse.from(logs.map(AuditLogResponse::fromEntity));
    }

    private Set<InventoryChangeType> resolveChangeTypesByGroup(String group) {
        return switch (group.trim().toUpperCase(Locale.ROOT)) {
            case "IMPORT" -> Set.of(InventoryChangeType.IMPORT, InventoryChangeType.INITIAL_IMPORT);
            case "ORDER_HOLD" -> Set.of(InventoryChangeType.ORDER_HOLD);
            case "RESTOCK", "RETURN" -> Set.of(InventoryChangeType.RESTOCK, InventoryChangeType.RETURN);
            case "ADJUSTMENT", "DEFECT" -> Set.of(
                    InventoryChangeType.ADJUSTMENT,
                    InventoryChangeType.DEFECT,
                    InventoryChangeType.DEMO_NORMALIZE);
            default -> {
                try {
                    yield Set.of(InventoryChangeType.valueOf(group.trim().toUpperCase(Locale.ROOT)));
                } catch (IllegalArgumentException ex) {
                    yield Set.of();
                }
            }
        };
    }

    @Override
    public AuditLogSummaryResponse getAuditLogSummary() {
        long total = inventoryAuditLogRepository.count();
        long importCount = inventoryAuditLogRepository.countByChangeTypeIn(
                Set.of(InventoryChangeType.IMPORT, InventoryChangeType.INITIAL_IMPORT));
        long orderHoldCount = inventoryAuditLogRepository.countByChangeTypeIn(
                Set.of(InventoryChangeType.ORDER_HOLD));
        long restockCount = inventoryAuditLogRepository.countByChangeTypeIn(
                Set.of(InventoryChangeType.RESTOCK, InventoryChangeType.RETURN));
        long adjustmentCount = inventoryAuditLogRepository.countByChangeTypeIn(
                Set.of(InventoryChangeType.ADJUSTMENT, InventoryChangeType.DEFECT, InventoryChangeType.DEMO_NORMALIZE));
        List<String> performers = inventoryAuditLogRepository.findDistinctPerformers();

        return AuditLogSummaryResponse.builder()
                .total(total)
                .importCount(importCount)
                .orderHoldCount(orderHoldCount)
                .restockCount(restockCount)
                .adjustmentCount(adjustmentCount)
                .performers(performers)
                .build();
    }

    @Override
    public PaginatedResponse<InventoryForecastItemResponse> getInventoryForecast(
            int days,
            String search,
            Long brandId,
            Long categoryId,
            String forecastStatus,
            String sortBy,
            int page,
            int size
    ) {
        return getInventoryForecast(days, null, null, search, brandId, categoryId, forecastStatus, sortBy, page, size);
    }

    @Override
    public PaginatedResponse<InventoryForecastItemResponse> getInventoryForecast(
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
    ) {
        int safeDays = days <= 0 ? 30 : Math.min(days, 366);
        List<InventoryForecastItemResponse> allItems = computeAllForecastItems(safeDays, startDate, endDate);

        String normalizedSearch = search != null && !search.isBlank()
                ? search.trim().toLowerCase(Locale.ROOT)
                : null;
        String normalizedStatus = forecastStatus != null && !forecastStatus.isBlank() && !"ALL".equalsIgnoreCase(forecastStatus)
                ? forecastStatus.trim().toUpperCase(Locale.ROOT)
                : null;

        List<InventoryForecastItemResponse> filtered = allItems.stream()
                .filter(item -> brandId == null || brandId.equals(item.getBrandId()))
                .filter(item -> categoryId == null || categoryId.equals(item.getCategoryId()))
                .filter(item -> normalizedStatus == null || normalizedStatus.equalsIgnoreCase(item.getForecastStatus()))
                .filter(item -> normalizedSearch == null
                        || (item.getSku() != null && item.getSku().toLowerCase(Locale.ROOT).contains(normalizedSearch))
                        || (item.getProductName() != null && item.getProductName().toLowerCase(Locale.ROOT).contains(normalizedSearch))
                        || (item.getBrandName() != null && item.getBrandName().toLowerCase(Locale.ROOT).contains(normalizedSearch)))
                .sorted(resolveForecastComparator(sortBy))
                .toList();

        int safePage = Math.max(0, page);
        int safeSize = Math.min(Math.max(size, 1), 100);
        int fromIndex = Math.min(safePage * safeSize, filtered.size());
        int toIndex = Math.min(fromIndex + safeSize, filtered.size());
        List<InventoryForecastItemResponse> pageContent = filtered.subList(fromIndex, toIndex);

        Page<InventoryForecastItemResponse> resultPage = new PageImpl<>(
                pageContent,
                PageRequest.of(safePage, safeSize),
                filtered.size());
        return PaginatedResponse.from(resultPage);
    }

    @Override
    public InventoryForecastSummaryResponse getInventoryForecastSummary(int days) {
        return getInventoryForecastSummary(days, null, null);
    }

    @Override
    public InventoryForecastSummaryResponse getInventoryForecastSummary(int days, LocalDate startDate, LocalDate endDate) {
        int safeDays = days <= 0 ? 30 : Math.min(days, 366);
        List<InventoryForecastItemResponse> allItems = computeAllForecastItems(safeDays, startDate, endDate);

        long critical = 0;
        long warning = 0;
        long fastMoving = 0;
        long slowMoving = 0;
        long healthy = 0;
        long totalSuggestedUnits = 0;
        BigDecimal totalEstimatedCost = BigDecimal.ZERO;

        for (InventoryForecastItemResponse item : allItems) {
            switch (item.getForecastStatus()) {
                case "CRITICAL" -> critical++;
                case "WARNING" -> warning++;
                case "FAST_MOVING" -> fastMoving++;
                case "SLOW_MOVING" -> slowMoving++;
                default -> healthy++;
            }
            if (item.getSuggestedReorderQty() > 0) {
                totalSuggestedUnits += item.getSuggestedReorderQty();
                if (item.getEstimatedRestockCost() != null) {
                    totalEstimatedCost = totalEstimatedCost.add(item.getEstimatedRestockCost());
                }
            }
        }

        return InventoryForecastSummaryResponse.builder()
                .totalVariants(allItems.size())
                .criticalCount(critical)
                .warningCount(warning)
                .fastMovingCount(fastMoving)
                .slowMovingCount(slowMoving)
                .healthyCount(healthy)
                .totalSuggestedUnits(totalSuggestedUnits)
                .totalEstimatedRestockCost(totalEstimatedCost)
                .build();
    }

    private List<InventoryForecastItemResponse> computeAllForecastItems(int days, LocalDate startDate, LocalDate endDate) {
        int effectiveDays = days <= 0 ? 30 : Math.min(days, 366);
        List<Object[]> rawSales;
        if (startDate != null || endDate != null) {
            LocalDate resolvedEnd = endDate != null ? endDate : LocalDate.now();
            LocalDate resolvedStart = startDate != null ? startDate : resolvedEnd.minusDays(Math.max(effectiveDays, 1) - 1L);
            if (resolvedStart.isAfter(resolvedEnd)) {
                throw new BadRequestException("Ngày bắt đầu không được sau ngày kết thúc");
            }
            effectiveDays = (int) Math.min(366, Math.max(1, ChronoUnit.DAYS.between(resolvedStart, resolvedEnd) + 1));
            ZoneId zone = ZoneId.systemDefault();
            Instant startInstant = resolvedStart.atStartOfDay(zone).toInstant();
            Instant endInstant = resolvedEnd.plusDays(1).atStartOfDay(zone).minusNanos(1).toInstant();
            rawSales = orderItemRepository.findVariantSalesBetween(startInstant, endInstant);
        } else {
            Instant since = Instant.now().minus(effectiveDays, ChronoUnit.DAYS);
            rawSales = orderItemRepository.findVariantSalesSince(since);
        }

        Map<Long, Integer> soldByVariantId = new HashMap<>();
        for (Object[] row : rawSales) {
            if (row[0] instanceof Number variantIdNum && row[1] instanceof Number qtyNum) {
                soldByVariantId.put(variantIdNum.longValue(), qtyNum.intValue());
            }
        }

        Map<Long, InventoryBatch> latestBatchByVariantId = new HashMap<>();
        for (InventoryBatch batch : inventoryBatchRepository.findAll(Sort.by(Sort.Direction.DESC, "receivedDate"))) {
            if (batch.getVariant() != null && batch.getVariant().getId() != null) {
                latestBatchByVariantId.putIfAbsent(batch.getVariant().getId(), batch);
            }
        }

        List<ProductVariant> variants = productVariantRepository.findAllActiveWithProductAndImages();

        List<InventoryForecastItemResponse> items = new ArrayList<>();
        for (ProductVariant variant : variants) {
            Product product = variant.getProduct();
            if (product == null || Boolean.TRUE.equals(product.getIsDeleted())) {
                continue;
            }
            int stock = variant.getStockQuantity() != null ? variant.getStockQuantity() : 0;
            int safetyStock = variant.getSafetyStockThreshold() != null ? variant.getSafetyStockThreshold() : 5;
            int soldInPeriod = soldByVariantId.getOrDefault(variant.getId(), 0);
            double rawVelocity = (double) soldInPeriod / effectiveDays;
            double dailyVelocity = Math.round(rawVelocity * 100.0) / 100.0;

            Integer daysUntilStockout = null;
            if (stock == 0) {
                daysUntilStockout = 0;
            } else if (rawVelocity > 0) {
                daysUntilStockout = (int) Math.floor(stock / rawVelocity);
            }

            int leadTimeDemand = (int) Math.ceil(rawVelocity * 7.0);
            int reorderPoint = leadTimeDemand + safetyStock;

            int targetThirtyDayDemand = (int) Math.ceil(rawVelocity * 30.0);
            int suggestedReorderQty = 0;
            if (stock == 0 || stock <= reorderPoint) {
                int baselineTarget = Math.max(safetyStock * 2, targetThirtyDayDemand + safetyStock);
                suggestedReorderQty = Math.max(Math.max(5, safetyStock), baselineTarget - stock);
            }

            String forecastStatus;
            if (stock == 0 || (daysUntilStockout != null && daysUntilStockout <= 7)) {
                forecastStatus = "CRITICAL";
            } else if (stock <= safetyStock || stock <= reorderPoint || (daysUntilStockout != null && daysUntilStockout <= 14)) {
                forecastStatus = "WARNING";
            } else if (soldInPeriod >= 3 || dailyVelocity >= 0.1) {
                forecastStatus = "FAST_MOVING";
            } else if (soldInPeriod == 0 && stock > Math.max(safetyStock * 2, 12)) {
                forecastStatus = "SLOW_MOVING";
            } else {
                forecastStatus = "HEALTHY";
            }

            InventoryBatch latestBatch = latestBatchByVariantId.get(variant.getId());
            BigDecimal retailPrice = variant.getFinalPrice() != null ? variant.getFinalPrice() : BigDecimal.ZERO;
            BigDecimal latestUnitCost = latestBatch != null && latestBatch.getUnitCost() != null
                    ? latestBatch.getUnitCost()
                    : retailPrice.multiply(BigDecimal.valueOf(0.65)).setScale(0, RoundingMode.HALF_UP);
            String latestSupplier = latestBatch != null && latestBatch.getSupplierName() != null
                    ? latestBatch.getSupplierName()
                    : (product.getBrand() != null ? product.getBrand().getName() + " Official Distribution" : "Nhà phân phối chính hãng");

            BigDecimal estimatedRestockCost = latestUnitCost.multiply(BigDecimal.valueOf(suggestedReorderQty));
            String imageUrl = product.getImages() != null
                    ? product.getImages().stream()
                            .filter(image -> Boolean.TRUE.equals(image.getIsPrimary()))
                            .findFirst()
                            .or(() -> product.getImages().stream().findFirst())
                            .map(Image::getImageUrl)
                            .orElse(null)
                    : null;

            items.add(InventoryForecastItemResponse.builder()
                    .variantId(variant.getId())
                    .sku(variant.getSku())
                    .color(variant.getColor())
                    .size(variant.getSize())
                    .productId(product.getId())
                    .productName(product.getName())
                    .productImageUrl(imageUrl)
                    .brandId(product.getBrand() != null ? product.getBrand().getId() : null)
                    .brandName(product.getBrand() != null ? product.getBrand().getName() : null)
                    .categoryId(product.getCategory() != null ? product.getCategory().getId() : null)
                    .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                    .stock(stock)
                    .safetyStockThreshold(safetyStock)
                    .soldInPeriod(soldInPeriod)
                    .dailyVelocity(dailyVelocity)
                    .daysUntilStockout(daysUntilStockout)
                    .reorderPoint(reorderPoint)
                    .suggestedReorderQty(suggestedReorderQty)
                    .retailPrice(retailPrice)
                    .latestUnitCost(latestUnitCost)
                    .estimatedRestockCost(estimatedRestockCost)
                    .latestSupplierName(latestSupplier)
                    .forecastStatus(forecastStatus)
                    .build());
        }
        return items;
    }

    private Comparator<InventoryForecastItemResponse> resolveForecastComparator(String sortBy) {
        if ("stock-asc".equalsIgnoreCase(sortBy)) {
            return Comparator.comparingInt(InventoryForecastItemResponse::getStock)
                    .thenComparing(Comparator.comparingInt(InventoryForecastItemResponse::getSoldInPeriod).reversed());
        }
        if ("velocity-desc".equalsIgnoreCase(sortBy)) {
            return Comparator.comparingDouble(InventoryForecastItemResponse::getDailyVelocity).reversed()
                    .thenComparingInt(InventoryForecastItemResponse::getStock);
        }
        if ("restock-desc".equalsIgnoreCase(sortBy)) {
            return Comparator.comparingInt(InventoryForecastItemResponse::getSuggestedReorderQty).reversed()
                    .thenComparingInt(InventoryForecastItemResponse::getStock);
        }
        return Comparator
                .comparingInt((InventoryForecastItemResponse item) -> switch (item.getForecastStatus()) {
                    case "CRITICAL" -> 0;
                    case "WARNING" -> 1;
                    case "FAST_MOVING" -> 2;
                    case "SLOW_MOVING" -> 3;
                    default -> 4;
                })
                .thenComparingInt(item -> item.getDaysUntilStockout() != null ? item.getDaysUntilStockout() : Integer.MAX_VALUE)
                .thenComparingInt(InventoryForecastItemResponse::getStock);
    }

    @Override
    public List<ProductVariantResponse> getLowStockVariants(Integer threshold) {
        int th = threshold != null ? threshold : 5;
        return productVariantRepository.findByStockQuantityLessThan(th).stream()
                .map(v -> ProductVariantResponse.builder()
                        .id(v.getId())
                        .sku(v.getSku())
                        .color(v.getColor())
                        .size(v.getSize())
                        .stock(v.getStockQuantity())
                        .priceMultiplier(v.getPriceAdjustment())
                        .originalPrice(v.getOriginalPrice())
                        .finalPrice(v.getFinalPrice())
                        .build())
                .collect(Collectors.toList());
    }

    private InventoryTransactionResponse mapToResponse(InventoryAuditLog transaction) {
        ProductVariant v = transaction.getVariant();
        Product p = v != null ? v.getProduct() : null;

        return InventoryTransactionResponse.builder()
                .id(transaction.getId())
                .productId(p != null ? p.getId() : null)
                .productName(p != null ? p.getName() : null)
                .variantId(v != null ? v.getId() : null)
                .color(v != null ? v.getColor() : null)
                .size(v != null ? v.getSize() : null)
                .sku(v != null ? v.getSku() : null)
                .quantity(Math.abs(transaction.getQuantityChanged()))
                .type(transaction.getQuantityChanged() >= 0 ? "IMPORT" : "EXPORT")
                .note(transaction.getReason())
                .createdAt(transaction.getCreatedAt())
                .build();
    }
}
