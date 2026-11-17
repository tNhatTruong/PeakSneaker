package com.peaksneaker.dto.request;

import com.peaksneaker.enums.PaymentMethod;
import com.peaksneaker.enums.ReturnReasonCode;
import com.peaksneaker.enums.ReturnStatus;
import com.peaksneaker.enums.ReturnType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderReturnFilterDto {
    private String query;
    private ReturnStatus status;
    private ReturnReasonCode reasonCode;
    private ReturnType returnType;
    private PaymentMethod paymentMethod;
    private Long productId;
    private Long orderId;
    private LocalDate from;
    private LocalDate to;
}
