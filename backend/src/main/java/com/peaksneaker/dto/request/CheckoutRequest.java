package com.peaksneaker.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CheckoutRequest {
    
    @NotNull(message = "Địa chỉ giao hàng không được để trống")
    private Long addressId;
    
    @NotBlank(message = "Phương thức thanh toán không được để trống")
    private String paymentMethod;
    
    // Tùy chọn
    private String voucherCode;
    
    // Ghi chú đơn hàng (tùy chọn)
    private String note;
}
