package com.peaksneaker.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.peaksneaker.dto.request.GhnWebhookRequest;
import com.peaksneaker.entity.Order;
import com.peaksneaker.entity.Payment;
import com.peaksneaker.entity.Shipment;
import com.peaksneaker.enums.OrderStatus;
import com.peaksneaker.enums.PaymentMethod;
import com.peaksneaker.enums.PaymentStatus;
import com.peaksneaker.enums.ShipmentStatus;
import com.peaksneaker.exception.UnauthorizedException;
import com.peaksneaker.repository.InventoryAuditLogRepository;
import com.peaksneaker.repository.OrderRepository;
import com.peaksneaker.repository.PaymentRepository;
import com.peaksneaker.repository.ProductVariantRepository;
import com.peaksneaker.repository.ShipmentEventRepository;
import com.peaksneaker.repository.ShipmentRepository;
import com.peaksneaker.repository.VoucherRepository;
import com.peaksneaker.service.GhnService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ShipmentServiceImplTest {

    @Mock private ShipmentRepository shipmentRepository;
    @Mock private ShipmentEventRepository shipmentEventRepository;
    @Mock private OrderRepository orderRepository;
    @Mock private PaymentRepository paymentRepository;
    @Mock private ProductVariantRepository productVariantRepository;
    @Mock private InventoryAuditLogRepository inventoryAuditLogRepository;
    @Mock private VoucherRepository voucherRepository;
    @Mock private GhnService ghnService;
    @Mock private ObjectMapper objectMapper;

    @InjectMocks
    private ShipmentServiceImpl service;

    @BeforeEach
    void configureWebhookSecret() throws Exception {
        ReflectionTestUtils.setField(service, "webhookSecret", "test-secret");
        lenient().when(objectMapper.writeValueAsString(any())).thenReturn("{}");
    }

    @Test
    void rejectsWebhookWithoutCredential() {
        assertThatThrownBy(() -> service.processGhnWebhook(webhook("ready_to_pick", Instant.now()), null))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessage("Webhook GHN không hợp lệ.");
        verify(shipmentRepository, never()).findByProviderOrderCodeForUpdate(any());
    }

    @Test
    void rejectsWebhookWithWrongCredential() {
        assertThatThrownBy(() -> service.processGhnWebhook(webhook("ready_to_pick", Instant.now()), "wrong-secret"))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessage("Webhook GHN không hợp lệ.");
        verify(shipmentRepository, never()).findByProviderOrderCodeForUpdate(any());
    }

    @Test
    void rejectsWebhookWhenServerSecretIsMissing() {
        ReflectionTestUtils.setField(service, "webhookSecret", " ");

        assertThatThrownBy(() -> service.processGhnWebhook(webhook("ready_to_pick", Instant.now()), "test-secret"))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessage("Webhook GHN chưa được cấu hình secret.");
        verify(shipmentRepository, never()).findByProviderOrderCodeForUpdate(any());
    }

    @Test
    void deliveredWebhookAdvancesOrderAndSynchronizesCodPayment() {
        Instant deliveredAt = Instant.parse("2026-10-27T03:00:00Z");
        Order order = Order.builder()
                .id(10L)
                .orderCode("PS-10")
                .status(OrderStatus.PROCESSING)
                .paymentMethod(PaymentMethod.COD)
                .paymentStatus(PaymentStatus.UNPAID)
                .build();
        Shipment shipment = shipment(order, ShipmentStatus.IN_TRANSIT, "transporting");
        Payment payment = Payment.builder()
                .id(30L)
                .order(order)
                .paymentMethod(PaymentMethod.COD)
                .amount(BigDecimal.valueOf(500_000))
                .status(PaymentStatus.UNPAID)
                .build();
        GhnWebhookRequest request = webhook("delivered", deliveredAt);

        when(shipmentRepository.findByProviderOrderCodeForUpdate("GHN-10")).thenReturn(Optional.of(shipment));
        when(shipmentEventRepository.existsByEventKey(any())).thenReturn(false);
        when(paymentRepository.findFirstByOrderOrderByCreatedAtDesc(order)).thenReturn(Optional.of(payment));

        service.processGhnWebhook(request, "test-secret");

        assertThat(shipment.getStatus()).isEqualTo(ShipmentStatus.DELIVERED);
        assertThat(order.getStatus()).isEqualTo(OrderStatus.DELIVERED);
        assertThat(order.getDeliveredAt()).isEqualTo(deliveredAt);
        assertThat(order.getPaymentStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(payment.getPaidAt()).isEqualTo(deliveredAt);
        verify(paymentRepository).save(payment);
    }

    @Test
    void unknownProviderStatusIsAuditedWithoutCorruptingShipmentState() {
        Order order = Order.builder()
                .id(10L)
                .orderCode("PS-10")
                .status(OrderStatus.PROCESSING)
                .paymentMethod(PaymentMethod.COD)
                .build();
        Shipment shipment = shipment(order, ShipmentStatus.PICKING, "picking");
        GhnWebhookRequest request = webhook("future_status_from_ghn", Instant.parse("2026-10-27T04:00:00Z"));

        when(shipmentRepository.findByProviderOrderCodeForUpdate("GHN-10")).thenReturn(Optional.of(shipment));
        when(shipmentEventRepository.existsByEventKey(any())).thenReturn(false);

        service.processGhnWebhook(request, "test-secret");

        assertThat(shipment.getStatus()).isEqualTo(ShipmentStatus.PICKING);
        assertThat(shipment.getProviderStatus()).isEqualTo("future_status_from_ghn");
        assertThat(order.getStatus()).isEqualTo(OrderStatus.PROCESSING);
        verify(paymentRepository, never()).save(any());
    }

    private Shipment shipment(Order order, ShipmentStatus status, String providerStatus) {
        return Shipment.builder()
                .id(20L)
                .order(order)
                .providerOrderCode("GHN-10")
                .clientOrderCode("PS-10")
                .status(status)
                .providerStatus(providerStatus)
                .build();
    }

    private GhnWebhookRequest webhook(String status, Instant time) {
        GhnWebhookRequest request = new GhnWebhookRequest();
        request.setOrderCode("GHN-10");
        request.setClientOrderCode("PS-10");
        request.setType("switch_status");
        request.setStatus(status);
        request.setTime(time);
        return request;
    }
}
