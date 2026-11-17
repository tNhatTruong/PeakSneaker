package com.peaksneaker.service.impl;

import com.peaksneaker.dto.request.AddToCartRequest;
import com.peaksneaker.dto.request.UpdateCartItemRequest;
import com.peaksneaker.dto.response.CartItemResponse;
import com.peaksneaker.dto.response.CartResponse;
import com.peaksneaker.entity.Cart;
import com.peaksneaker.entity.CartItem;
import com.peaksneaker.entity.Image;
import com.peaksneaker.entity.Product;
import com.peaksneaker.entity.ProductVariant;
import com.peaksneaker.entity.User;
import com.peaksneaker.exception.BadRequestException;
import com.peaksneaker.exception.ResourceNotFoundException;
import com.peaksneaker.repository.CartItemRepository;
import com.peaksneaker.repository.CartRepository;
import com.peaksneaker.repository.ProductVariantRepository;
import com.peaksneaker.repository.UserRepository;
import com.peaksneaker.service.CartService;
import com.peaksneaker.service.cloudservice.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {

    private final UserRepository userRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductVariantRepository productVariantRepository;
    private final CloudinaryService cloudinaryService;

    @Override
    @Transactional
    public CartResponse getCart(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", "id", userId));

        Cart cart = cartRepository.findByUser(user)
                .orElseGet(() -> {
                    Cart newCart = Cart.builder()
                            .user(user)
                            .items(new ArrayList<>())
                            .build();
                    return cartRepository.save(newCart);
                });

        return mapToResponse(cart);
    }

    @Override
    @Transactional
    public CartResponse addToCart(Long userId, AddToCartRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", "id", userId));

        Cart cart = cartRepository.findByUser(user)
                .orElseGet(() -> {
                    Cart newCart = Cart.builder()
                            .user(user)
                            .items(new ArrayList<>())
                            .build();
                    return cartRepository.save(newCart);
                });

        ProductVariant variant = productVariantRepository.findById(request.getVariantId())
                .orElseThrow(() -> new ResourceNotFoundException("Biến thể", "id", request.getVariantId()));

        CartItem existingItem = cart.getItems().stream()
                .filter(item -> item.getProductVariant() != null && item.getProductVariant().getId().equals(variant.getId()))
                .findFirst()
                .orElse(null);

        int currentQuantityInCart = existingItem != null ? existingItem.getQuantity() : 0;
        int totalRequestedQuantity = currentQuantityInCart + request.getQuantity();

        if (totalRequestedQuantity > variant.getStockQuantity()) {
            throw new BadRequestException("Tổng số lượng yêu cầu vượt quá tồn kho của biến thể sản phẩm. Hiện có: " 
                    + variant.getStockQuantity() + (currentQuantityInCart > 0 ? " (đã có " + currentQuantityInCart + " trong giỏ)" : ""));
        }

        cart.addItem(variant, request.getQuantity());

        Cart savedCart = cartRepository.save(cart);
        return mapToResponse(savedCart);
    }

    @Override
    @Transactional
    public CartResponse updateCartItem(Long userId, Long itemId, UpdateCartItemRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", "id", userId));

        Cart cart = cartRepository.findByUser(user)
                .orElseThrow(() -> new BadRequestException("Giỏ hàng của người dùng chưa được khởi tạo."));

        CartItem cartItem = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Mục giỏ hàng", "id", itemId));

        if (!cartItem.getCart().getId().equals(cart.getId())) {
            throw new BadRequestException("Sản phẩm này không thuộc giỏ hàng của bạn.");
        }

        ProductVariant variant = cartItem.getProductVariant();
        if (variant == null) {
            throw new BadRequestException("Biến thể sản phẩm liên kết với vật phẩm này không tồn tại.");
        }

        if (request.getQuantity() > variant.getStockQuantity()) {
            throw new BadRequestException("Số lượng yêu cầu vượt quá số lượng tồn kho. Hiện có: " + variant.getStockQuantity());
        }

        cartItem.setQuantity(request.getQuantity());
        cartItemRepository.save(cartItem);

        Cart updatedCart = cartRepository.findById(cart.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Giỏ hàng", "id", cart.getId()));
        return mapToResponse(updatedCart);
    }

    @Override
    @Transactional
    public CartResponse removeCartItem(Long userId, Long itemId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", "id", userId));

        Cart cart = cartRepository.findByUser(user)
                .orElseThrow(() -> new BadRequestException("Giỏ hàng của người dùng chưa được khởi tạo."));

        CartItem cartItem = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Mục giỏ hàng", "id", itemId));

        if (!cartItem.getCart().getId().equals(cart.getId())) {
            throw new BadRequestException("Sản phẩm này không thuộc giỏ hàng của bạn.");
        }

        cart.getItems().remove(cartItem);
        cartItemRepository.delete(cartItem);

        Cart updatedCart = cartRepository.findById(cart.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Giỏ hàng", "id", cart.getId()));
        return mapToResponse(updatedCart);
    }

    private CartResponse mapToResponse(Cart cart) {
        List<CartItemResponse> items = cart.getItems().stream()
                .map(item -> {
                    ProductVariant variant = item.getProductVariant();
                    Product product = variant != null ? variant.getProduct() : null;

                    String thumbnail = null;
                    if (product != null && product.getImages() != null) {
                        thumbnail = product.getImages().stream()
                                .filter(img -> img.getIsPrimary() != null && img.getIsPrimary())
                                .map(this::resolveImageUrl)
                                .findFirst()
                                .orElse(product.getImages().isEmpty() ? null : resolveImageUrl(product.getImages().get(0)));
                    }

                    return CartItemResponse.builder()
                            .id(item.getId())
                            .variantId(variant != null ? variant.getId() : null)
                            .sku(variant != null ? variant.getSku() : null)
                            .color(variant != null ? variant.getColor() : null)
                            .size(variant != null ? variant.getSize() : null)
                            .price(variant != null ? variant.getFinalPrice() : BigDecimal.ZERO)
                            .quantity(item.getQuantity())
                            .subtotal(item.getSubtotal())
                            .productId(product != null ? product.getId() : null)
                            .productName(product != null ? product.getName() : null)
                            .productThumbnail(thumbnail)
                            .stockQuantity(variant != null ? variant.getStockQuantity() : 0)
                            .build();
                })
                .collect(Collectors.toList());

        BigDecimal totalPrice = items.stream()
                .map(CartItemResponse::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int totalQuantity = items.stream()
                .mapToInt(CartItemResponse::getQuantity)
                .sum();

        return CartResponse.builder()
                .id(cart.getId())
                .items(items)
                .totalQuantity(totalQuantity)
                .totalPrice(totalPrice)
                .build();
    }

    private String resolveImageUrl(Image image) {
        String storedUrl = image.getImageUrl();
        return cloudinaryService.creteImageUrl(
                storedUrl != null && !storedUrl.isBlank() ? storedUrl : image.getImageName());
    }
}
