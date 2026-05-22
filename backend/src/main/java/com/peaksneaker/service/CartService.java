package com.peaksneaker.service;

import com.peaksneaker.entity.Cart;
import com.peaksneaker.entity.CartItem;
import com.peaksneaker.entity.User;

import java.util.List;

public interface CartService {
    Cart getCartByUser(User user);
    void addItemToCart(Cart cart, CartItem item);
    void removeItemFromCart(Cart cart, CartItem item);
    void clearCart(Cart cart);
    List<CartItem> getCartItems(Cart cart);
}
