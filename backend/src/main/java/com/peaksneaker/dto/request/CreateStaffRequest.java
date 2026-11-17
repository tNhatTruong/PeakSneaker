package com.peaksneaker.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateStaffRequest {

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không đúng định dạng")
    @Size(max = 100, message = "Email không được vượt quá 100 ký tự")
    private String email;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 10, max = 72, message = "Mật khẩu nhân viên phải từ 10 đến 72 ký tự")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@#$%^&+=!._*~-]).{10,72}$",
        message = "Mật khẩu nhân viên phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt (@#$%^&+=!._*~-)"
    )
    private String password;

    @NotBlank(message = "Họ không được để trống")
    @Size(max = 50, message = "Họ không được vượt quá 50 ký tự")
    private String firstName;

    @NotBlank(message = "Tên không được để trống")
    @Size(max = 50, message = "Tên không được vượt quá 50 ký tự")
    private String lastName;

    @Pattern(
        regexp = "^$|^(0[35789])[0-9]{8}$",
        message = "Số điện thoại không đúng định dạng Việt Nam (10 chữ số, bắt đầu bằng 03, 05, 07, 08, 09)"
    )
    private String phone;

    @NotBlank(message = "Vai trò không được để trống")
    private String role; // ROLE_WAREHOUSE, ROLE_SALES, etc.

    @NotBlank(message = "Phòng ban không được để trống")
    private String department; // BAN_GIAM_DOC, KHO_VAN, BAN_HANG, CSKH, MARKETING, TAI_CHINH

    @NotBlank(message = "Chức danh không được để trống")
    @Size(max = 100, message = "Chức danh không được vượt quá 100 ký tự")
    private String positionTitle;

    @Size(max = 500, message = "Ghi chú không được vượt quá 500 ký tự")
    private String notes;

    private List<String> customPermissions;
}

