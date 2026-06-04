package com.peaksneaker.repository;

import com.peaksneaker.entity.Cart;
import com.peaksneaker.entity.CartItem;
import com.peaksneaker.entity.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    List<CartItem> findByCart(Cart cart);

    @Modifying
    @Transactional
    void deleteByCartAndProductVariant(Cart cart, ProductVariant productVariant);
}
