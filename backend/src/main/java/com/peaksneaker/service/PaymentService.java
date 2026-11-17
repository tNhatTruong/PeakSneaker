package com.peaksneaker.service;

import com.peaksneaker.dto.response.VnpayIpnResponse;
import com.peaksneaker.entity.Order;

import java.util.Map;

public interface PaymentService {
    String createPaymentUrl(Order order, String ipAddress);
    boolean processVnpayReturn(Map<String, String> fields);
    VnpayIpnResponse processVnpayIpn(Map<String, String> fields);
}
