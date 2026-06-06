package com.peaksneaker.controller;

import com.peaksneaker.dto.request.CheckoutRequest;
import com.peaksneaker.dto.response.ApiResponse;
import com.peaksneaker.entity.Order;
import com.peaksneaker.security.UserDetailsImpl;
import com.peaksneaker.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping("/checkout")
    public ResponseEntity<ApiResponse<Order>> checkout(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody CheckoutRequest request) {

        Order order = orderService.checkout(userDetails.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Tạo đơn hàng thành công!", order));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<com.peaksneaker.dto.response.PaginatedResponse<Order>>> getOrders(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        var orders = orderService.getOrders(userDetails.getId(), page, size);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách đơn hàng thành công!", orders));
    }
}
