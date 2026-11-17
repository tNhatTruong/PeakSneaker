package com.peaksneaker.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.peaksneaker.dto.request.UpdateReturnItemRequest;
import com.peaksneaker.dto.request.UpdateReturnStatusRequest;
import com.peaksneaker.entity.Order;
import com.peaksneaker.entity.OrderItem;
import com.peaksneaker.entity.OrderReturn;
import com.peaksneaker.entity.OrderReturnItem;
import com.peaksneaker.enums.PaymentMethod;
import com.peaksneaker.enums.PaymentStatus;
import com.peaksneaker.enums.ReturnReasonCode;
import com.peaksneaker.enums.ReturnStatus;
import com.peaksneaker.enums.ReturnType;
import com.peaksneaker.exception.BadRequestException;
import com.peaksneaker.repository.InventoryAuditLogRepository;
import com.peaksneaker.repository.OrderRepository;
import com.peaksneaker.repository.OrderReturnItemRepository;
import com.peaksneaker.repository.OrderReturnRepository;
import com.peaksneaker.repository.ProductVariantRepository;
import com.peaksneaker.repository.UserRepository;
import com.peaksneaker.service.EmailService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderReturnServiceImplTest {

    @Mock private OrderReturnRepository orderReturnRepository;
    @Mock private OrderRepository orderRepository;
    @Mock private UserRepository userRepository;
    @Mock private ProductVariantRepository productVariantRepository;
    @Mock private OrderReturnItemRepository orderReturnItemRepository;
    @Mock private InventoryAuditLogRepository inventoryAuditLogRepository;
    @Mock private EmailService emailService;
    @Mock private ObjectMapper objectMapper;

    @InjectMocks
    private OrderReturnServiceImpl service;

    @Test
    void cannotSkipRequiredRmaSteps() {
        OrderReturn orderReturn = OrderReturn.builder()
                .id(1L)
                .status(ReturnStatus.REQUESTED)
                .items(new ArrayList<>())
                .build();
        when(orderReturnRepository.findById(1L)).thenReturn(Optional.of(orderReturn));

        UpdateReturnStatusRequest request = new UpdateReturnStatusRequest();
        request.setStatus(ReturnStatus.COMPLETED);

        assertThatThrownBy(() -> service.processReturn(1L, request, "admin@peaksneaker.com"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Không thể chuyển RMA");
        verify(orderReturnRepository, never()).save(orderReturn);
    }

    @Test
    void terminalRmaCannotBeProcessedAgain() {
        OrderReturn orderReturn = OrderReturn.builder()
                .id(2L)
                .status(ReturnStatus.COMPLETED)
                .items(new ArrayList<>())
                .build();
        when(orderReturnRepository.findById(2L)).thenReturn(Optional.of(orderReturn));

        UpdateReturnStatusRequest request = new UpdateReturnStatusRequest();
        request.setStatus(ReturnStatus.APPROVED);

        assertThatThrownBy(() -> service.processReturn(2L, request, "admin@peaksneaker.com"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Không thể chuyển RMA");
        verify(orderReturnRepository, never()).save(orderReturn);
    }

    @Test
    void completingRefundReturnPreservesPriorStepQuantitiesAndMarksOrderRefunded() {
        Order order = Order.builder()
                .id(10L)
                .orderCode("PS-TEST-010")
                .subtotalAmount(new BigDecimal("2900000"))
                .discountAmount(BigDecimal.ZERO)
                .paymentMethod(PaymentMethod.VNPAY)
                .paymentStatus(PaymentStatus.PAID)
                .build();
        OrderItem orderItem = OrderItem.builder()
                .id(100L)
                .order(order)
                .productName("Nike Air Force 1")
                .quantity(2)
                .unitPrice(new BigDecimal("1450000"))
                .build();
        OrderReturnItem returnItem = OrderReturnItem.builder()
                .id(200L)
                .orderItem(orderItem)
                .requestedQuantity(2)
                .approvedQuantity(1)
                .receivedQuantity(1)
                .restockableQuantity(0)
                .build();
        OrderReturn orderReturn = OrderReturn.builder()
                .id(3L)
                .order(order)
                .returnType(ReturnType.RETURN_REFUND)
                .reasonCode(ReturnReasonCode.DEFECTIVE_PRODUCT)
                .reason("Keo đế bị hở")
                .status(ReturnStatus.GOODS_RECEIVED)
                .refundAmount(BigDecimal.ZERO)
                .items(new ArrayList<>(List.of(returnItem)))
                .build();
        when(orderReturnRepository.findById(3L)).thenReturn(Optional.of(orderReturn));
        when(orderReturnRepository.save(orderReturn)).thenReturn(orderReturn);

        UpdateReturnItemRequest decision = new UpdateReturnItemRequest();
        decision.setReturnItemId(200L);
        decision.setApprovedQuantity(2);
        decision.setReceivedQuantity(2);
        decision.setRestockableQuantity(1);

        UpdateReturnStatusRequest request = new UpdateReturnStatusRequest();
        request.setStatus(ReturnStatus.COMPLETED);
        request.setRefundAmount(new BigDecimal("1450000"));
        request.setItems(List.of(decision));

        service.processReturn(3L, request, "admin@peaksneaker.com");

        assertThat(returnItem.getApprovedQuantity()).isEqualTo(1);
        assertThat(returnItem.getReceivedQuantity()).isEqualTo(1);
        assertThat(returnItem.getRestockableQuantity()).isZero();
        assertThat(order.getPaymentStatus()).isEqualTo(PaymentStatus.REFUNDED);
        verify(orderRepository).save(order);
    }
}
