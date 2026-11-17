package com.peaksneaker.service;

import com.peaksneaker.dto.response.GhnCreateOrderResult;
import com.peaksneaker.entity.Order;

import java.math.BigDecimal;

public interface GhnService {
    Object getProvinces();
    Object getDistricts(int provinceId);
    Object getWards(int districtId);
    Object calculateFee(int toDistrictId, String toWardCode);
    BigDecimal calculateFeeAmount(int toDistrictId, String toWardCode);
    GhnCreateOrderResult createOrder(Order order, int toDistrictId, String toWardCode);
}
