package com.peaksneaker.dto.request;

import com.peaksneaker.enums.PaymentMethod;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class AdminCreateOrderRequest {

    private Long userId;

    @NotBlank(message = "Họ tên người nhận không được để trống")
    private String shippingName;

    @NotBlank(message = "Số điện thoại người nhận không được để trống")
    private String shippingPhone;

    @NotBlank(message = "Tỉnh/Thành phố không được để trống")
    private String shippingProvince;

    @NotBlank(message = "Quận/Huyện không được để trống")
    private String shippingDistrict;

    @NotNull(message = "Mã Quận/Huyện GHN không được để trống")
    private Integer shippingDistrictId;

    @NotBlank(message = "Phường/Xã không được để trống")
    private String shippingWard;

    @NotBlank(message = "Mã Phường/Xã GHN không được để trống")
    private String shippingWardCode;

    @NotBlank(message = "Địa chỉ chi tiết không được để trống")
    private String shippingStreet;

    private PaymentMethod paymentMethod = PaymentMethod.COD;

    private String voucherCode;

    private String note;

    @NotEmpty(message = "Đơn hàng phải có ít nhất 1 sản phẩm")
    @Valid
    private List<OrderItemInput> items;

    @Data
    public static class OrderItemInput {
        @NotNull(message = "Biến thể sản phẩm không được để trống")
        private Long variantId;

        @NotNull(message = "Số lượng không được để trống")
        @Min(value = 1, message = "Số lượng tối thiểu là 1")
        private Integer quantity;
    }
}

