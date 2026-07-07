package com.peaksneaker.dto.request;

import com.peaksneaker.enums.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CheckoutRequest {
    
    @NotNull(message = "Địa chỉ giao hàng không được để trống")
    private Long addressId;
    
    @NotNull(message = "Phương thức thanh toán không được để trống")
    private PaymentMethod paymentMethod;
    
    // Tùy chọn
    private String voucherCode;
    
    // Ghi chú đơn hàng (tùy chọn)
    private String note;
    
    // Mua ngay (không qua giỏ hàng)
    private Long buyNowVariantId;
    private Integer buyNowQuantity;
}
