package com.peaksneaker.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateUserRequest {
    
    @NotBlank(message = "Họ không được để trống")
    private String firstName;
    
    @NotBlank(message = "Tên không được để trống")
    private String lastName;
    
    @NotBlank(message = "Số điện thoại không được để trống")
    private String phone;
}
