package com.peaksneaker.controller;

import com.peaksneaker.dto.request.WishlistRequest;
import com.peaksneaker.dto.response.ApiResponse;
import com.peaksneaker.dto.response.WishlistResponse;
import com.peaksneaker.security.UserDetailsImpl;
import com.peaksneaker.service.WishlistService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/wishlist")
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistService wishlistService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<WishlistResponse>>> getWishlist(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        List<WishlistResponse> list = wishlistService.getUserWishlist(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách yêu thích thành công", list));
    }

    @GetMapping("/paginated")
    public ResponseEntity<ApiResponse<Page<WishlistResponse>>> getWishlistPaginated(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        Page<WishlistResponse> pageResult = wishlistService.getUserWishlistPaginated(
                userDetails.getId(), PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách yêu thích phân trang thành công", pageResult));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<WishlistResponse>> addToWishlist(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody WishlistRequest request) {
        WishlistResponse response = wishlistService.addToWishlist(userDetails.getId(), request.getProductId());
        return ResponseEntity.ok(ApiResponse.success("Đã thêm sản phẩm vào danh sách yêu thích", response));
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<ApiResponse<Void>> removeFromWishlist(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long productId) {
        wishlistService.removeFromWishlist(userDetails.getId(), productId);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa sản phẩm khỏi danh sách yêu thích", null));
    }

    @GetMapping("/check/{productId}")
    public ResponseEntity<ApiResponse<Boolean>> checkInWishlist(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long productId) {
        boolean inWishlist = wishlistService.isInWishlist(userDetails.getId(), productId);
        return ResponseEntity.ok(ApiResponse.success(inWishlist));
    }
}
