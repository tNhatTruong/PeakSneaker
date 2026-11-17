package com.peaksneaker.dto.response;

import com.peaksneaker.entity.Image;
import com.peaksneaker.entity.InventoryBatch;
import com.peaksneaker.entity.Product;
import com.peaksneaker.entity.ProductVariant;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchResponse {
    private Long id;
    private Long variantId;
    private String variantSku;
    private String variantColor;
    private String variantSize;
    private Long productId;
    private String productName;
    private String productImageUrl;
    private String brandName;
    private String batchCode;
    private String supplierName;
    private Integer quantityImported;
    private Integer quantityRemaining;
    private BigDecimal unitCost;
    private BigDecimal retailPrice;
    private LocalDate manufacturingDate;
    private LocalDate expiryDate;
    private String poNumber;
    private String invoiceNumber;
    private String paymentStatus;
    private Boolean isQuarantined;
    private String quarantineReason;
    private Instant receivedDate;

    public static BatchResponse fromEntity(InventoryBatch batch) {
        if (batch == null) return null;
        ProductVariant variant = batch.getVariant();
        Product product = variant != null ? variant.getProduct() : null;
        String imageUrl = product != null && product.getImages() != null
                ? product.getImages().stream()
                        .filter(image -> Boolean.TRUE.equals(image.getIsPrimary()))
                        .findFirst()
                        .or(() -> product.getImages().stream().findFirst())
                        .map(Image::getImageUrl)
                        .orElse(null)
                : null;
        return BatchResponse.builder()
                .id(batch.getId())
                .variantId(variant != null ? variant.getId() : null)
                .variantSku(variant != null ? variant.getSku() : null)
                .variantColor(variant != null ? variant.getColor() : null)
                .variantSize(variant != null ? variant.getSize() : null)
                .productId(product != null ? product.getId() : null)
                .productName(product != null ? product.getName() : null)
                .productImageUrl(imageUrl)
                .brandName(product != null && product.getBrand() != null ? product.getBrand().getName() : null)
                .batchCode(batch.getBatchCode())
                .supplierName(batch.getSupplierName())
                .quantityImported(batch.getQuantityImported())
                .quantityRemaining(batch.getQuantityRemaining())
                .unitCost(batch.getUnitCost())
                .retailPrice(variant != null ? variant.getFinalPrice() : null)
                .manufacturingDate(batch.getManufacturingDate())
                .expiryDate(batch.getExpiryDate())
                .poNumber(batch.getPoNumber())
                .invoiceNumber(batch.getInvoiceNumber())
                .paymentStatus(batch.getPaymentStatus())
                .isQuarantined(batch.getIsQuarantined())
                .quarantineReason(batch.getQuarantineReason())
                .receivedDate(batch.getReceivedDate())
                .build();
    }
}
