package com.peaksneaker.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AddressRequest {
    @NotBlank(message = "Tên người nhận không được để trống")
    private String recipientName;

    @NotBlank(message = "Số điện thoại không được để trống")
    private String phone;

    @NotBlank(message = "ID Tỉnh/Thành phố không được để trống")
    private String provinceId;

    @NotBlank(message = "Tỉnh/Thành phố không được để trống")
    private String provinceName;

    @NotBlank(message = "ID Quận/Huyện không được để trống")
    private String districtId;

    @NotBlank(message = "Quận/Huyện không được để trống")
    private String districtName;

    @NotBlank(message = "Mã Phường/Xã không được để trống")
    private String wardId;

    @NotBlank(message = "Phường/Xã không được để trống")
    private String wardName;

    @NotBlank(message = "Chi tiết đường không được để trống")
    private String streetDetail;

    private Boolean isDefault = false;
}
