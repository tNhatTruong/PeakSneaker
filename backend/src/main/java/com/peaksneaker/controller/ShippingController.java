package com.peaksneaker.controller;

import com.peaksneaker.service.GhnService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/shipping")
@RequiredArgsConstructor
public class ShippingController {

    private final GhnService ghnService;

    @GetMapping("/provinces")
    public ResponseEntity<Object> getProvinces() {
        return ResponseEntity.ok(ghnService.getProvinces());
    }

    @GetMapping("/districts")
    public ResponseEntity<Object> getDistricts(@RequestParam int provinceId) {
        return ResponseEntity.ok(ghnService.getDistricts(provinceId));
    }

    @GetMapping("/wards")
    public ResponseEntity<Object> getWards(@RequestParam int districtId) {
        return ResponseEntity.ok(ghnService.getWards(districtId));
    }

    @PostMapping("/fee")
    public ResponseEntity<Object> calculateFee(
            @RequestParam int toDistrictId,
            @RequestParam String toWardCode) {
        return ResponseEntity.ok(ghnService.calculateFee(toDistrictId, toWardCode));
    }
}
