package com.peaksneaker.service;

import com.peaksneaker.entity.CartItem;
import com.peaksneaker.entity.Cart;
import com.peaksneaker.entity.ProductVariant;

import java.util.List;

public interface CartItemService {
    CartItem getCartItemById(Long id);
    void saveCartItem(CartItem item);
    void deleteCartItem(CartItem item);
    List<CartItem> getCartItemsByCart(Cart cart);
}
