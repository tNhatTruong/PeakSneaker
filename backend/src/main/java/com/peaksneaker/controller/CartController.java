// File: backend/src/main/java/com/peaksneaker/controller/CartController.java
package com.peaksneaker.controller;

import com.peaksneaker.dto.request.AddToCartRequest;
import com.peaksneaker.dto.request.UpdateCartItemRequest;
import com.peaksneaker.dto.response.ApiResponse;
import com.peaksneaker.dto.response.CartResponse;
import com.peaksneaker.security.UserDetailsImpl;
import com.peaksneaker.service.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/cart")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class CartController {

    private final CartService cartService;

    @GetMapping
    public ResponseEntity<ApiResponse<CartResponse>> getCart(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        CartResponse response = cartService.getCart(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin giỏ hàng thành công!", response));
    }

    @PostMapping("/items")
    public ResponseEntity<ApiResponse<CartResponse>> addToCart(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody AddToCartRequest request) {
        CartResponse response = cartService.addToCart(userDetails.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Thêm sản phẩm vào giỏ hàng thành công!", response));
    }

    @PutMapping("/items/{itemId}")
    public ResponseEntity<ApiResponse<CartResponse>> updateCartItem(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long itemId,
            @Valid @RequestBody UpdateCartItemRequest request) {
        CartResponse response = cartService.updateCartItem(userDetails.getId(), itemId, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật số lượng sản phẩm thành công!", response));
    }

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<ApiResponse<CartResponse>> removeCartItem(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long itemId) {
        CartResponse response = cartService.removeCartItem(userDetails.getId(), itemId);
        return ResponseEntity.ok(ApiResponse.success("Xóa sản phẩm khỏi giỏ hàng thành công!", response));
    }
}
