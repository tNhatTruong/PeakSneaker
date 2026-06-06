// File: backend/src/main/java/com/peaksneaker/dto/request/RegisterRequest.java
package com.peaksneaker.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank(message = "Chưa nhập tên")
    private String firstName;

    @NotBlank(message = "Chưa nhập họ")
    private String lastName;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không đúng định dạng")
    private String email;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 6, message = "Mật khẩu phải từ 6 ký tự trở lên")
    private String password;

    @NotBlank(message = "Số điện thoại không được để trống")
    private String phone;
}
