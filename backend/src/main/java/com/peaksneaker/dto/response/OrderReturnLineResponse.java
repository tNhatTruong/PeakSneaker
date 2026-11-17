package com.peaksneaker.dto.response;

import com.peaksneaker.entity.OrderItem;
import com.peaksneaker.entity.OrderReturnItem;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderReturnLineResponse {
    private Long id;
    private Long orderItemId;
    private Long productVariantId;
    private Long productId;
    private String productName;
    private String sku;
    private String variantName;
    private BigDecimal unitPrice;
    private Integer purchasedQuantity;
    private Integer requestedQuantity;
    private Integer approvedQuantity;
    private Integer receivedQuantity;
    private Integer restockableQuantity;
    private Long replacementVariantId;
    private String replacementSku;
    private String conditionNote;
    private Instant restockedAt;

    public static OrderReturnLineResponse fromEntity(OrderReturnItem entity) {
        OrderItem orderItem = entity.getOrderItem();
        return OrderReturnLineResponse.builder()
                .id(entity.getId())
                .orderItemId(orderItem.getId())
                .productVariantId(orderItem.getProductVariant() != null ? orderItem.getProductVariant().getId() : null)
                .productId(orderItem.getProductVariant() != null && orderItem.getProductVariant().getProduct() != null
                        ? orderItem.getProductVariant().getProduct().getId() : null)
                .productName(orderItem.getProductName())
                .sku(orderItem.getSku())
                .variantName(orderItem.getVariantName())
                .unitPrice(orderItem.getUnitPrice())
                .purchasedQuantity(orderItem.getQuantity())
                .requestedQuantity(entity.getRequestedQuantity())
                .approvedQuantity(entity.getApprovedQuantity())
                .receivedQuantity(entity.getReceivedQuantity())
                .restockableQuantity(entity.getRestockableQuantity())
                .replacementVariantId(entity.getReplacementVariant() != null ? entity.getReplacementVariant().getId() : null)
                .replacementSku(entity.getReplacementVariant() != null ? entity.getReplacementVariant().getSku() : null)
                .conditionNote(entity.getConditionNote())
                .restockedAt(entity.getRestockedAt())
                .build();
    }
}
