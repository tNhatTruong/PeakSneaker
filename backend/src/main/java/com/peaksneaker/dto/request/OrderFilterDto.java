package com.peaksneaker.dto.request;

import lombok.Data;
import java.time.LocalDate;
import java.time.YearMonth;

import com.peaksneaker.enums.OrderStatus;

@Data
public class OrderFilterDto {
    private OrderStatus status;
    private LocalDate specificDay;
    private YearMonth specificMonth;
    private String query;
}
