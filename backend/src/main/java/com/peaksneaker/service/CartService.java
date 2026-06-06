package com.peaksneaker.service;

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
import com.peaksneaker.repository.CartItemRepository;
import com.peaksneaker.repository.CartRepository;
import com.peaksneaker.repository.ProductVariantRepository;
import com.peaksneaker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CartService {

    private final UserRepository userRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductVariantRepository productVariantRepository;

    @Transactional(readOnly = true)
    public CartResponse getCart(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thông tin người dùng."));

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

    @Transactional
    public CartResponse addToCart(Long userId, AddToCartRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thông tin người dùng."));

        Cart cart = cartRepository.findByUser(user)
                .orElseGet(() -> {
                    Cart newCart = Cart.builder()
                            .user(user)
                            .items(new ArrayList<>())
                            .build();
                    return cartRepository.save(newCart);
                });

        ProductVariant variant = productVariantRepository.findById(request.getVariantId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy biến thể sản phẩm."));

        // Tìm vật phẩm đã tồn tại trong giỏ hàng để tính tổng số lượng sau khi thêm
        CartItem existingItem = cart.getItems().stream()
                .filter(item -> item.getProductVariant() != null && item.getProductVariant().getId().equals(variant.getId()))
                .findFirst()
                .orElse(null);

        int currentQuantityInCart = existingItem != null ? existingItem.getQuantity() : 0;
        int totalRequestedQuantity = currentQuantityInCart + request.getQuantity();

        // Kiểm tra xem tổng số lượng sau khi thêm có vượt quá tồn kho không
        if (totalRequestedQuantity > variant.getStockQuantity()) {
            throw new IllegalArgumentException("Tổng số lượng yêu cầu vượt quá tồn kho của biến thể sản phẩm. Hiện có: " 
                    + variant.getStockQuantity() + (currentQuantityInCart > 0 ? " (đã có " + currentQuantityInCart + " trong giỏ)" : ""));
        }

        // Gọi phương thức domain để thêm hoặc cộng dồn vào giỏ hàng
        cart.addItem(variant, request.getQuantity());

        Cart savedCart = cartRepository.save(cart);
        return mapToResponse(savedCart);
    }

    @Transactional
    public CartResponse updateCartItem(Long userId, Long itemId, UpdateCartItemRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thông tin người dùng."));

        Cart cart = cartRepository.findByUser(user)
                .orElseThrow(() -> new IllegalArgumentException("Giỏ hàng của người dùng chưa được khởi tạo."));

        CartItem cartItem = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy sản phẩm này trong giỏ hàng."));

        // Xác nhận vật phẩm thuộc giỏ hàng của chính người dùng
        if (!cartItem.getCart().getId().equals(cart.getId())) {
            throw new IllegalArgumentException("Sản phẩm này không thuộc giỏ hàng của bạn.");
        }

        ProductVariant variant = cartItem.getProductVariant();
        if (variant == null) {
            throw new IllegalArgumentException("Biến thể sản phẩm liên kết với vật phẩm này không tồn tại.");
        }

        // Kiểm tra tồn kho
        if (request.getQuantity() > variant.getStockQuantity()) {
            throw new IllegalArgumentException("Số lượng yêu cầu vượt quá số lượng tồn kho. Hiện có: " + variant.getStockQuantity());
        }

        cartItem.setQuantity(request.getQuantity());
        cartItemRepository.save(cartItem);

        // Load lại giỏ hàng từ DB để có dữ liệu chính xác
        Cart updatedCart = cartRepository.findById(cart.getId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy giỏ hàng."));
        return mapToResponse(updatedCart);
    }

    @Transactional
    public CartResponse removeCartItem(Long userId, Long itemId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thông tin người dùng."));

        Cart cart = cartRepository.findByUser(user)
                .orElseThrow(() -> new IllegalArgumentException("Giỏ hàng của người dùng chưa được khởi tạo."));

        CartItem cartItem = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy sản phẩm này trong giỏ hàng."));

        // Xác nhận vật phẩm thuộc giỏ hàng của chính người dùng
        if (!cartItem.getCart().getId().equals(cart.getId())) {
            throw new IllegalArgumentException("Sản phẩm này không thuộc giỏ hàng của bạn.");
        }

        cart.getItems().remove(cartItem);
        cartItemRepository.delete(cartItem);

        // Load lại giỏ hàng từ DB để có dữ liệu chính xác
        Cart updatedCart = cartRepository.findById(cart.getId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy giỏ hàng."));
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
                                .map(Image::getImageUrl)
                                .findFirst()
                                .orElse(product.getImages().isEmpty() ? null : product.getImages().get(0).getImageUrl());
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
}
