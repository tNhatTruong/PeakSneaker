package com.peaksneaker.service.impl;

import com.peaksneaker.config.VnpayConfig;
import com.peaksneaker.dto.response.VnpayIpnResponse;
import com.peaksneaker.entity.Order;
import com.peaksneaker.entity.Payment;
import com.peaksneaker.enums.PaymentStatus;
import com.peaksneaker.exception.BadRequestException;
import com.peaksneaker.repository.OrderRepository;
import com.peaksneaker.repository.PaymentRepository;
import com.peaksneaker.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TimeZone;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {
    private final VnpayConfig vnpayConfig;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;

    @Override
    public String createPaymentUrl(Order order, String ipAddress) {
        Payment payment = paymentRepository.findFirstByOrderOrderByCreatedAtDesc(order)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy giao dịch thanh toán của đơn hàng."));

        Map<String, String> params = new HashMap<>();
        params.put("vnp_Version", "2.1.0");
        params.put("vnp_Command", "pay");
        params.put("vnp_TmnCode", vnpayConfig.vnp_TmnCode);
        params.put("vnp_Amount", String.valueOf(order.getFinalAmount().longValue() * 100));
        params.put("vnp_CurrCode", "VND");
        params.put("vnp_TxnRef", payment.getTransactionId());
        params.put("vnp_OrderInfo", "Thanh toan don hang " + order.getOrderCode());
        params.put("vnp_OrderType", "other");
        params.put("vnp_Locale", "vn");
        params.put("vnp_ReturnUrl", vnpayConfig.vnp_ReturnUrl);
        params.put("vnp_IpAddr", ipAddress == null || ipAddress.isBlank() ? "127.0.0.1" : ipAddress);

        Calendar calendar = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        params.put("vnp_CreateDate", formatter.format(calendar.getTime()));
        calendar.add(Calendar.MINUTE, 15);
        params.put("vnp_ExpireDate", formatter.format(calendar.getTime()));

        String hashData = buildEncodedParameters(params);
        String secureHash = vnpayConfig.hmacSHA512(vnpayConfig.vnp_HashSecret, hashData);
        return vnpayConfig.vnp_PayUrl + "?" + hashData + "&vnp_SecureHash=" + secureHash;
    }

    @Override
    @Transactional
    public boolean processVnpayReturn(Map<String, String> requestFields) {
        Map<String, String> fields = new HashMap<>(requestFields);
        String secureHash = fields.remove("vnp_SecureHash");
        fields.remove("vnp_SecureHashType");

        String signedData = buildEncodedParameters(fields);
        String expectedHash = vnpayConfig.hmacSHA512(vnpayConfig.vnp_HashSecret, signedData);
        if (secureHash == null || !expectedHash.equalsIgnoreCase(secureHash)) {
            return false;
        }

        Payment payment = paymentRepository.findByTransactionId(fields.get("vnp_TxnRef")).orElse(null);
        if (payment == null || !String.valueOf(payment.getAmount().longValue() * 100)
                .equals(fields.get("vnp_Amount"))) {
            return false;
        }

        payment.setProviderResponse(fields.toString());
        if ("00".equals(fields.get("vnp_ResponseCode"))) {
            if (payment.getStatus() != PaymentStatus.PAID) {
                payment.markSuccess(payment.getTransactionId());
                paymentRepository.save(payment);
                orderRepository.save(payment.getOrder());
            }
            return true;
        }

        if (payment.getStatus() != PaymentStatus.PAID) {
            payment.markFailed();
            paymentRepository.save(payment);
            orderRepository.save(payment.getOrder());
        }
        return false;
    }

    @Override
    @Transactional
    public VnpayIpnResponse processVnpayIpn(Map<String, String> requestFields) {
        Map<String, String> fields = new HashMap<>(requestFields);
        String secureHash = fields.remove("vnp_SecureHash");
        fields.remove("vnp_SecureHashType");

        String signedData = buildEncodedParameters(fields);
        String expectedHash = vnpayConfig.hmacSHA512(vnpayConfig.vnp_HashSecret, signedData);
        if (secureHash == null || !expectedHash.equalsIgnoreCase(secureHash)) {
            return new VnpayIpnResponse("97", "Invalid Checksum");
        }

        String txnRef = fields.get("vnp_TxnRef");
        Payment payment = paymentRepository.findByTransactionId(txnRef).orElse(null);
        if (payment == null) {
            return new VnpayIpnResponse("01", "Order not found");
        }

        if (!String.valueOf(payment.getAmount().longValue() * 100).equals(fields.get("vnp_Amount"))) {
            return new VnpayIpnResponse("04", "Invalid Amount");
        }

        if (payment.getStatus() == PaymentStatus.PAID) {
            return new VnpayIpnResponse("02", "Order already confirmed");
        }

        payment.setProviderResponse(fields.toString());
        if ("00".equals(fields.get("vnp_ResponseCode"))) {
            payment.markSuccess(payment.getTransactionId());
            paymentRepository.save(payment);
            orderRepository.save(payment.getOrder());
            return new VnpayIpnResponse("00", "Confirm Success");
        } else {
            payment.markFailed();
            paymentRepository.save(payment);
            orderRepository.save(payment.getOrder());
            return new VnpayIpnResponse("00", "Confirm Success");
        }
    }

    private String buildEncodedParameters(Map<String, String> params) {
        return params.entrySet().stream()
                .filter(entry -> entry.getValue() != null && !entry.getValue().isEmpty())
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> URLEncoder.encode(entry.getKey(), StandardCharsets.US_ASCII)
                        + "=" + URLEncoder.encode(entry.getValue(), StandardCharsets.US_ASCII))
                .reduce((left, right) -> left + "&" + right)
                .orElse("");
    }
}
