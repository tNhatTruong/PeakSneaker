package com.peaksneaker.controller;


import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.peaksneaker.dto.request.VoucherRequest;
import com.peaksneaker.dto.response.ApiResponse;
import com.peaksneaker.dto.response.VoucherResponse;
import com.peaksneaker.dto.response.PaginatedResponse;
import com.peaksneaker.service.VoucherService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("api/v1/vouchers")
@RequiredArgsConstructor
public class VoucherController {
    private final VoucherService voucherService;   
    
    @PostMapping
    public ResponseEntity<ApiResponse<PaginatedResponse<VoucherResponse>>> getVouchers(@RequestBody VoucherRequest params){
        PaginatedResponse<VoucherResponse> vouchers = voucherService.getVouchers(params);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách voucher thành công", vouchers));
    }

    @PostMapping("/create")
    public ResponseEntity<ApiResponse<VoucherResponse>> createVoucher(@RequestBody com.peaksneaker.dto.request.CreateVoucherRequest request) {
        VoucherResponse voucher = voucherService.createVoucher(request);
        return ResponseEntity.ok(ApiResponse.success("Tạo voucher thành công", voucher));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<VoucherResponse>> updateVoucher(
            @org.springframework.web.bind.annotation.PathVariable Long id,
            @RequestBody com.peaksneaker.dto.request.CreateVoucherRequest request) {
        VoucherResponse voucher = voucherService.updateVoucher(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật voucher thành công", voucher));
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteVoucher(@org.springframework.web.bind.annotation.PathVariable Long id) {
        voucherService.deleteVoucher(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa voucher thành công", null));
    }

    @PostMapping("/check")
    public ResponseEntity<ApiResponse<com.peaksneaker.dto.response.VoucherCheckResponse>> checkVoucher(@RequestBody com.peaksneaker.dto.request.VoucherCheckRequest request) {
        com.peaksneaker.dto.response.VoucherCheckResponse response = voucherService.checkVoucher(request);
        return ResponseEntity.ok(ApiResponse.success("Kiểm tra voucher", response));
    }
}
