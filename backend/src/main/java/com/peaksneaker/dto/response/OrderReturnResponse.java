package com.peaksneaker.dto.response;

import com.peaksneaker.entity.OrderReturn;
import com.peaksneaker.enums.ReturnStatus;
import com.peaksneaker.enums.ReturnType;
import com.peaksneaker.enums.ReturnReasonCode;
import com.peaksneaker.enums.PaymentMethod;
import com.peaksneaker.enums.OrderStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderReturnResponse {
    private Long id;
    private Long orderId;
    private String orderCode;
    private Long userId;
    private String userEmail;
    private String customerName;
    private String customerPhone;
    private ReturnType returnType;
    private ReturnReasonCode reasonCode;
    private String reason;
    private String evidenceImages;
    private ReturnStatus status;
    private BigDecimal refundAmount;
    private String adminNotes;
    private String processedBy;
    private Instant createdAt;
    private Instant updatedAt;
    private PaymentMethod paymentMethod;
    private OrderStatus orderStatus;
    private List<OrderReturnLineResponse> items;

    public static OrderReturnResponse fromEntity(OrderReturn entity) {
        if (entity == null) return null;
        return OrderReturnResponse.builder()
                .id(entity.getId())
                .orderId(entity.getOrder() != null ? entity.getOrder().getId() : null)
                .orderCode(entity.getOrder() != null ? entity.getOrder().getOrderCode() : null)
                .userId(entity.getUser() != null ? entity.getUser().getId() : null)
                .userEmail(entity.getUser() != null ? entity.getUser().getEmail() : null)
                .customerName(entity.getUser() != null ? entity.getUser().getFullname().trim() : null)
                .customerPhone(entity.getUser() != null ? entity.getUser().getPhone() : null)
                .returnType(entity.getReturnType())
                .reasonCode(entity.getReasonCode())
                .reason(entity.getReason())
                .evidenceImages(entity.getEvidenceImages())
                .status(entity.getStatus())
                .refundAmount(entity.getRefundAmount())
                .adminNotes(entity.getAdminNotes())
                .processedBy(entity.getProcessedBy())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .paymentMethod(entity.getOrder() != null ? entity.getOrder().getPaymentMethod() : null)
                .orderStatus(entity.getOrder() != null ? entity.getOrder().getStatus() : null)
                .items(entity.getItems().stream().map(OrderReturnLineResponse::fromEntity).toList())
                .build();
    }
}
