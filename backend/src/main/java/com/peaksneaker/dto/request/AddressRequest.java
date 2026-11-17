package com.peaksneaker.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AddressRequest {
    @NotBlank(message = "Tên người nhận không được để trống")
    @Size(max = 100, message = "Tên người nhận không được vượt quá 100 ký tự")
    private String recipientName;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(
        regexp = "^(0[35789])[0-9]{8}$",
        message = "Số điện thoại không đúng định dạng Việt Nam (10 chữ số, bắt đầu bằng 03, 05, 07, 08, 09)"
    )
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
    @Size(max = 255, message = "Địa chỉ chi tiết không được vượt quá 255 ký tự")
    private String streetDetail;

    private Boolean isDefault = false;
}
