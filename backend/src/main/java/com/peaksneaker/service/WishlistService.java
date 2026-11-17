package com.peaksneaker.service;

import com.peaksneaker.dto.response.WishlistResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface WishlistService {
    List<WishlistResponse> getUserWishlist(Long userId);
    Page<WishlistResponse> getUserWishlistPaginated(Long userId, Pageable pageable);
    WishlistResponse addToWishlist(Long userId, Long productId);
    void removeFromWishlist(Long userId, Long productId);
    boolean isInWishlist(Long userId, Long productId);
}
