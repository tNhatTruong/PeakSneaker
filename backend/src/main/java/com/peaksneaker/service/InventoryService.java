package com.peaksneaker.service;

import com.peaksneaker.dto.request.CreateTransactionRequest;
import com.peaksneaker.dto.request.CreateVariantRequest;
import com.peaksneaker.dto.response.InventoryTransactionResponse;
import com.peaksneaker.dto.response.PaginatedResponse;
import com.peaksneaker.entity.InventoryTransaction;
import com.peaksneaker.entity.Product;
import com.peaksneaker.entity.ProductVariant;
import com.peaksneaker.enums.InventoryTransactionType;
import com.peaksneaker.repository.InventoryTransactionRepository;
import com.peaksneaker.repository.ProductRepository;
import com.peaksneaker.repository.ProductVariantRepository;
import com.peaksneaker.repository.specification.InventoryTransactionSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InventoryService {

    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final InventoryTransactionRepository inventoryTransactionRepository;

    @Transactional
    public ProductVariant createVariant(Long productId, CreateVariantRequest request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy sản phẩm với ID: " + productId));

        if (productVariantRepository.existsBySku(request.getSku())) {
            throw new IllegalArgumentException("Mã SKU này đã tồn tại trong hệ thống: " + request.getSku());
        }

        BigDecimal priceAdjustment = request.getPriceAdjustment() != null ? request.getPriceAdjustment() : BigDecimal.ZERO;

        ProductVariant variant = ProductVariant.builder()
                .product(product)
                .color(request.getColor())
                .size(request.getSize())
                .sku(request.getSku())
                .stockQuantity(0) // Số lượng ban đầu mặc định là 0
                .priceAdjustment(priceAdjustment)
                .build();

        return productVariantRepository.save(variant);
    }

    @Transactional
    public InventoryTransactionResponse createTransaction(CreateTransactionRequest request) {
        ProductVariant variant = productVariantRepository.findById(request.getVariantId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy biến thể sản phẩm với ID: " + request.getVariantId()));

        if (request.getType() == InventoryTransactionType.IMPORT) {
            variant.increaseStock(request.getQuantity());
        } else if (request.getType() == InventoryTransactionType.EXPORT) {
            if (variant.getStockQuantity() < request.getQuantity()) {
                throw new IllegalArgumentException("Số lượng tồn kho hiện tại không đủ. Hiện có: " 
                        + variant.getStockQuantity() + ", yêu cầu xuất: " + request.getQuantity());
            }
            variant.decreaseStock(request.getQuantity());
        }

        productVariantRepository.save(variant);

        InventoryTransaction transaction = InventoryTransaction.builder()
                .productVariant(variant)
                .quantity(request.getQuantity())
                .type(request.getType())
                .note(request.getNote())
                .build();

        InventoryTransaction saved = inventoryTransactionRepository.save(transaction);
        return mapToResponse(saved);
    }

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
        Specification<InventoryTransaction> spec = InventoryTransactionSpecification.filterTransactions(
                productId, variantId, type, startDate, endDate);
        
        Page<InventoryTransaction> transactionPage = inventoryTransactionRepository.findAll(spec, pageable);
        Page<InventoryTransactionResponse> responsePage = transactionPage.map(this::mapToResponse);
        return PaginatedResponse.from(responsePage);
    }

    private InventoryTransactionResponse mapToResponse(InventoryTransaction transaction) {
        ProductVariant v = transaction.getProductVariant();
        Product p = v.getProduct();

        return InventoryTransactionResponse.builder()
                .id(transaction.getId())
                .productId(p.getId())
                .productName(p.getName())
                .variantId(v.getId())
                .color(v.getColor())
                .size(v.getSize())
                .sku(v.getSku())
                .quantity(transaction.getQuantity())
                .type(transaction.getType().name())
                .note(transaction.getNote())
                .createdAt(transaction.getCreatedAt())
                .build();
    }
}
