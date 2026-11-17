package com.peaksneaker.service.impl;

import com.peaksneaker.dto.response.WishlistResponse;
import com.peaksneaker.entity.Product;
import com.peaksneaker.entity.User;
import com.peaksneaker.entity.Wishlist;
import com.peaksneaker.exception.ConflictException;
import com.peaksneaker.exception.ResourceNotFoundException;
import com.peaksneaker.repository.ImageRepository;
import com.peaksneaker.repository.ProductRepository;
import com.peaksneaker.repository.UserRepository;
import com.peaksneaker.repository.WishlistRepository;
import com.peaksneaker.service.WishlistService;
import com.peaksneaker.service.cloudservice.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WishlistServiceImpl implements WishlistService {

    private final WishlistRepository wishlistRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final ImageRepository imageRepository;
    private final CloudinaryService cloudinaryService;

    @Override
    @Transactional(readOnly = true)
    public List<WishlistResponse> getUserWishlist(Long userId) {
        return wishlistRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WishlistResponse> getUserWishlistPaginated(Long userId, Pageable pageable) {
        return wishlistRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional
    public WishlistResponse addToWishlist(Long userId, Long productId) {
        if (wishlistRepository.existsByUserIdAndProductId(userId, productId)) {
            throw new ConflictException("Sản phẩm đã có trong danh sách yêu thích");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", "id", userId));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm", "id", productId));

        Wishlist wishlist = Wishlist.builder()
                .user(user)
                .product(product)
                .build();

        wishlist = wishlistRepository.save(wishlist);
        return mapToResponse(wishlist);
    }

    @Override
    @Transactional
    public void removeFromWishlist(Long userId, Long productId) {
        Wishlist wishlist = wishlistRepository.findByUserIdAndProductId(userId, productId)
                .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm không có trong danh sách yêu thích"));
        wishlistRepository.delete(wishlist);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isInWishlist(Long userId, Long productId) {
        return wishlistRepository.existsByUserIdAndProductId(userId, productId);
    }

    private WishlistResponse mapToResponse(Wishlist wishlist) {
        String imageUrl = null;
        if (wishlist.getProduct() != null) {
            imageUrl = imageRepository.findByProductIdAndIsPrimaryTrue(wishlist.getProduct().getId())
                    .map(img -> cloudinaryService.creteImageUrl(
                            img.getImageUrl() != null && !img.getImageUrl().isBlank()
                                    ? img.getImageUrl()
                                    : img.getImageName()))
                    .orElse(null);
        }
        return WishlistResponse.fromEntity(wishlist, imageUrl);
    }
}
