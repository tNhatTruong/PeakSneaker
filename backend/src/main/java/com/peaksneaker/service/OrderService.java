package com.peaksneaker.service;

import com.peaksneaker.entity.Order;

import java.util.List;

public interface OrderService {
    Order getOrderById(Long id);
    List<Order> getAllOrders();
    void saveOrder(Order order);
    void deleteOrder(Order order);
}
