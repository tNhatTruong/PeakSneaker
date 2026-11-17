package com.peaksneaker.dto.request;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;

import com.peaksneaker.enums.OrderStatus;
import com.peaksneaker.enums.PaymentMethod;
import com.peaksneaker.enums.PaymentStatus;

@Data
public class OrderFilterDto {
    private OrderStatus status;
    private PaymentStatus paymentStatus;
    private PaymentMethod paymentMethod;
    private BigDecimal minAmount;
    private BigDecimal maxAmount;
    private LocalDate from;
    private LocalDate to;
    private LocalDate specificDay;
    private YearMonth specificMonth;
    private String query;
}
