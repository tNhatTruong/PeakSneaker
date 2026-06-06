package com.peaksneaker.service;

import com.peaksneaker.dto.request.CheckoutRequest;
import com.peaksneaker.dto.response.PaginatedResponse;
import com.peaksneaker.entity.Order;

public interface OrderService {
    Order checkout(Long userId, CheckoutRequest request);
    PaginatedResponse<Order> getOrders(Long userId, int page, int size);
}
