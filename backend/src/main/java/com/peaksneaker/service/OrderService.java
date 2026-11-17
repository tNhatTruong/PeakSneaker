package com.peaksneaker.service;

import com.peaksneaker.dto.request.AdminCreateOrderRequest;
import com.peaksneaker.dto.request.CheckoutRequest;
import com.peaksneaker.dto.request.OrderFilterDto;
import com.peaksneaker.dto.response.OrderResponse;
import com.peaksneaker.dto.response.PaginatedResponse;
import com.peaksneaker.entity.Order;
import com.peaksneaker.enums.OrderStatus;

public interface OrderService {
    Order checkout(Long userId, CheckoutRequest request);
    OrderResponse createOrderAdmin(AdminCreateOrderRequest request);
    PaginatedResponse<OrderResponse> getOrders(Long userId, int page, int size);
    OrderResponse getOrderById(Long userId, Long orderId);
    OrderResponse cancelOrder(Long userId, Long orderId);
    PaginatedResponse<OrderResponse> getAllOrdersAdmin(OrderFilterDto filter, int page, int size);
    OrderResponse updateOrderStatusAdmin(Long id, OrderStatus nextStatus);
    OrderResponse getOrderByIdAdmin(Long id);
    int cancelExpiredPendingOrders();
}
