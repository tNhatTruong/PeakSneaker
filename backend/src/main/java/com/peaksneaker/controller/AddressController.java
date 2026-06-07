package com.peaksneaker.controller;

import com.peaksneaker.dto.request.AddressRequest;
import com.peaksneaker.dto.response.AddressResponse;
import com.peaksneaker.dto.response.ApiResponse;
import com.peaksneaker.security.UserDetailsImpl;
import com.peaksneaker.service.AddressService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/addresses")
@RequiredArgsConstructor
public class AddressController {

    private final AddressService addressService;

    @PostMapping
    public ResponseEntity<ApiResponse<AddressResponse>> createAddress(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody AddressRequest request) {
        AddressResponse response = addressService.createAddress(userDetails.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Thêm địa chỉ thành công", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<AddressResponse>>> getUserAddresses(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        List<AddressResponse> responses = addressService.getUserAddresses(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách địa chỉ thành công", responses));
    }
}
