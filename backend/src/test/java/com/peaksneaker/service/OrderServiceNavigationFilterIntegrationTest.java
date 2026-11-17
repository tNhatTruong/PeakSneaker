package com.peaksneaker.service;

import com.peaksneaker.dto.request.OrderFilterDto;
import com.peaksneaker.dto.response.OrderResponse;
import com.peaksneaker.dto.response.PaginatedResponse;
import com.peaksneaker.enums.PaymentMethod;
import com.peaksneaker.enums.PaymentStatus;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class OrderServiceNavigationFilterIntegrationTest {

    @Autowired
    private OrderService orderService;

    @Test
    void adminOrderFiltersShouldSupportDashboardPaymentNavigation() {
        OrderFilterDto failedPaymentFilter = new OrderFilterDto();
        failedPaymentFilter.setPaymentStatus(PaymentStatus.FAILED);

        PaginatedResponse<OrderResponse> failedPayments =
                orderService.getAllOrdersAdmin(failedPaymentFilter, 0, 100);

        assertThat(failedPayments.getItems())
                .isNotEmpty()
                .allSatisfy(order -> assertThat(order.getPaymentStatus()).isEqualTo(PaymentStatus.FAILED));

        OrderFilterDto vnpayFilter = new OrderFilterDto();
        vnpayFilter.setPaymentMethod(PaymentMethod.VNPAY);

        PaginatedResponse<OrderResponse> vnpayOrders =
                orderService.getAllOrdersAdmin(vnpayFilter, 0, 100);

        assertThat(vnpayOrders.getItems())
                .isNotEmpty()
                .allSatisfy(order -> assertThat(order.getPaymentMethod()).isEqualTo(PaymentMethod.VNPAY));
    }

    @Test
    void adminOrderFiltersShouldSupportAmountRange() {
        OrderFilterDto amountFilter = new OrderFilterDto();
        amountFilter.setMinAmount(new BigDecimal("3000000"));
        amountFilter.setMaxAmount(new BigDecimal("4000000"));

        PaginatedResponse<OrderResponse> orders = orderService.getAllOrdersAdmin(amountFilter, 0, 100);

        assertThat(orders.getItems())
                .isNotEmpty()
                .allSatisfy(order -> assertThat(order.getFinalAmount())
                        .isBetween(new BigDecimal("3000000"), new BigDecimal("4000000")));
    }
}
