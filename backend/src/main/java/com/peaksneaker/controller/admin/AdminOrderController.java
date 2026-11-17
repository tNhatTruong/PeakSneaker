package com.peaksneaker.controller.admin;

import com.peaksneaker.dto.request.AdminCreateOrderRequest;
import com.peaksneaker.dto.request.OrderFilterDto;
import com.peaksneaker.dto.response.ApiResponse;
import com.peaksneaker.dto.response.OrderResponse;
import com.peaksneaker.dto.response.PaginatedResponse;
import com.peaksneaker.dto.response.ShipmentResponse;
import com.peaksneaker.enums.OrderStatus;
import com.peaksneaker.service.OrderService;
import com.peaksneaker.service.ShipmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/orders")
@RequiredArgsConstructor
public class AdminOrderController {

    private final OrderService orderService;
    private final ShipmentService shipmentService;

    @PostMapping
    public ResponseEntity<ApiResponse<OrderResponse>> createOrder(
            @Valid @RequestBody AdminCreateOrderRequest request) {
        OrderResponse created = orderService.createOrderAdmin(request);
        return ResponseEntity.ok(ApiResponse.success("Tạo đơn hàng thành công", created));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PaginatedResponse<OrderResponse>>> getAllOrders(
            OrderFilterDto filter,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        PaginatedResponse<OrderResponse> orders = orderService.getAllOrdersAdmin(filter, page, size);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách đơn hàng thành công", orders));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderById(@PathVariable Long id) {
        OrderResponse order = orderService.getOrderByIdAdmin(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy chi tiết đơn hàng thành công", order));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<OrderResponse>> updateOrderStatus(
            @PathVariable Long id,
            @RequestParam OrderStatus status) {
        
        OrderResponse updatedOrder = orderService.updateOrderStatusAdmin(id, status);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái đơn hàng thành công", updatedOrder));
    }

    @PostMapping("/{id}/shipment")
    public ResponseEntity<ApiResponse<ShipmentResponse>> dispatchShipment(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Tạo vận đơn GHN thành công", shipmentService.dispatch(id)));
    }

    @GetMapping("/{id}/shipment")
    public ResponseEntity<ApiResponse<ShipmentResponse>> getShipment(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Lấy vận đơn thành công", shipmentService.getForAdmin(id)));
    }
}
