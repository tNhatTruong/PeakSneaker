package com.peaksneaker.service;

import com.peaksneaker.entity.Order;

public interface EmailService {
    void sendOtpEmail(String toEmail, String otpCode, String recipientName);
    void sendPasswordResetEmail(String toEmail, String resetToken, String recipientName);
    void sendOrderConfirmationEmail(String toEmail, Order order);
    void sendReturnStatusEmail(String toEmail, Long returnId, String status, String note);
}
