package com.peaksneaker.controller;

import com.peaksneaker.dto.request.CheckoutRequest;
import com.peaksneaker.dto.response.ApiResponse;
import com.peaksneaker.entity.Order;
import com.peaksneaker.enums.PaymentMethod;
import com.peaksneaker.security.UserDetailsImpl;
import com.peaksneaker.service.OrderService;
import com.peaksneaker.service.PaymentService;
import com.peaksneaker.dto.response.CheckoutResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final PaymentService paymentService;

    @PostMapping("/checkout")
    public ResponseEntity<ApiResponse<CheckoutResponse>> checkout(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody CheckoutRequest request,
            HttpServletRequest httpRequest) {

        Order order = orderService.checkout(userDetails.getId(), request);
        String paymentUrl = null;

        if (request.getPaymentMethod() == PaymentMethod.VNPAY) {
            // Lấy địa chỉ IP của client
            String ipAddress = httpRequest.getHeader("X-FORWARDED-FOR");
            if (ipAddress == null) {
                ipAddress = httpRequest.getRemoteAddr();
            }
            paymentUrl = paymentService.createPaymentUrl(order, ipAddress);
        }

        CheckoutResponse response = CheckoutResponse.builder()
                .orderId(order.getId())
                .paymentUrl(paymentUrl)
                .build();

        return ResponseEntity.ok(
                ApiResponse.success("Tạo đơn hàng thành công!", response)
        );
    }

    @GetMapping
    public ResponseEntity<ApiResponse<com.peaksneaker.dto.response.PaginatedResponse<com.peaksneaker.dto.response.OrderResponse>>> getOrders(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        var orders = orderService.getOrders(userDetails.getId(), page, size);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách đơn hàng thành công!", orders));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<com.peaksneaker.dto.response.OrderResponse>> getOrderById(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long id) {
        
        var order = orderService.getOrderById(userDetails.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Lấy chi tiết đơn hàng thành công!", order));
    }
}
