package com.peaksneaker.service;

import com.peaksneaker.entity.OrderItem;

import java.util.List;

public interface OrderItemService {
    OrderItem getOrderItemById(Long id);
    List<OrderItem> getAllOrderItems();
    void saveOrderItem(OrderItem item);
    void deleteOrderItem(OrderItem item);
}
