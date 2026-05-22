package com.peaksneaker.service;

import com.peaksneaker.entity.Payment;

import java.util.List;

public interface PaymentService {
    Payment getPaymentById(Long id);
    List<Payment> getAllPayments();
    void savePayment(Payment payment);
    void deletePayment(Payment payment);
}
