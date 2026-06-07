package com.peaksneaker.controller;

import com.peaksneaker.dto.response.ApiResponse;
import com.peaksneaker.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/payment")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @GetMapping("/vnpay-return")
    public ResponseEntity<ApiResponse<String>> vnpayReturn(@RequestParam Map<String, String> queryParams) {
        boolean isSuccess = paymentService.processVnpayReturn(queryParams);
        if (isSuccess) {
            return ResponseEntity.ok(ApiResponse.success("Thanh toán thành công!", null));
        } else {
            return ResponseEntity.badRequest().body(ApiResponse.<String>builder()
                    .status("error")
                    .message("Thanh toán thất bại hoặc chữ ký không hợp lệ!")
                    .build());
        }
    }
}
