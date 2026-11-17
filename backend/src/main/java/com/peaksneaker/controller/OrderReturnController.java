package com.peaksneaker.controller;

import com.peaksneaker.dto.request.OrderReturnRequest;
import com.peaksneaker.dto.response.ApiResponse;
import com.peaksneaker.dto.response.OrderReturnResponse;
import com.peaksneaker.dto.response.PaginatedResponse;
import com.peaksneaker.security.UserDetailsImpl;
import com.peaksneaker.service.OrderReturnService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/orders/returns")
@RequiredArgsConstructor
public class OrderReturnController {

    private final OrderReturnService orderReturnService;

    @PostMapping
    public ResponseEntity<ApiResponse<OrderReturnResponse>> createReturnRequest(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody OrderReturnRequest request) {
        OrderReturnResponse response = orderReturnService.createReturnRequest(userDetails.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Yêu cầu đổi/trả đơn hàng đã được gửi thành công!", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<OrderReturnResponse>>> getUserReturns(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        List<OrderReturnResponse> list = orderReturnService.getUserReturns(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách yêu cầu đổi trả thành công", list));
    }

    @GetMapping("/paginated")
    public ResponseEntity<ApiResponse<PaginatedResponse<OrderReturnResponse>>> getUserReturnsPaginated(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<OrderReturnResponse> pageResult = orderReturnService.getUserReturnsPaginated(
                userDetails.getId(), PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách đổi trả thành công", PaginatedResponse.from(pageResult)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OrderReturnResponse>> getReturnDetail(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long id) {
        OrderReturnResponse response = orderReturnService.getReturnById(id);
        if (!response.getUserId().equals(userDetails.getId())) {
            return ResponseEntity.status(403).body(ApiResponse.error("Bạn không có quyền truy cập yêu cầu này"));
        }
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
