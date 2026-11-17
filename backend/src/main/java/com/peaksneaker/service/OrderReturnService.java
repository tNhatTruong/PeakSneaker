package com.peaksneaker.service;

import com.peaksneaker.dto.request.OrderReturnRequest;
import com.peaksneaker.dto.request.OrderReturnFilterDto;
import com.peaksneaker.dto.request.UpdateReturnStatusRequest;
import com.peaksneaker.dto.response.OrderReturnResponse;
import com.peaksneaker.dto.response.OrderReturnFilterOptionsResponse;
import com.peaksneaker.enums.ReturnStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface OrderReturnService {
    OrderReturnResponse createReturnRequest(Long userId, OrderReturnRequest request);
    List<OrderReturnResponse> getUserReturns(Long userId);
    Page<OrderReturnResponse> getUserReturnsPaginated(Long userId, Pageable pageable);
    OrderReturnResponse getReturnById(Long returnId);
    Page<OrderReturnResponse> getAllReturns(Pageable pageable);
    Page<OrderReturnResponse> getReturnsByStatus(ReturnStatus status, Pageable pageable);
    Page<OrderReturnResponse> getReturnsByOrderId(Long orderId, Pageable pageable);
    Page<OrderReturnResponse> searchReturns(OrderReturnFilterDto filter, Pageable pageable);
    OrderReturnFilterOptionsResponse getFilterOptions();
    OrderReturnResponse processReturn(Long returnId, UpdateReturnStatusRequest request, String adminEmail);
}
