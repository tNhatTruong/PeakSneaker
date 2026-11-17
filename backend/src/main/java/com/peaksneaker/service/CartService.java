package com.peaksneaker.service;

import com.peaksneaker.dto.request.AddToCartRequest;
import com.peaksneaker.dto.request.UpdateCartItemRequest;
import com.peaksneaker.dto.response.CartResponse;

public interface CartService {
    CartResponse getCart(Long userId);
    CartResponse addToCart(Long userId, AddToCartRequest request);
    CartResponse updateCartItem(Long userId, Long itemId, UpdateCartItemRequest request);
    CartResponse removeCartItem(Long userId, Long itemId);
}
