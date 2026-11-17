package com.peaksneaker.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WishlistRequest {
    @NotNull(message = "Product ID không được để trống")
    private Long productId;
}
