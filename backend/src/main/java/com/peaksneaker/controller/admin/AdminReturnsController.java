package com.peaksneaker.controller.admin;

import com.peaksneaker.dto.request.UpdateReturnStatusRequest;
import com.peaksneaker.dto.request.OrderReturnFilterDto;
import com.peaksneaker.dto.response.ApiResponse;
import com.peaksneaker.dto.response.OrderReturnFilterOptionsResponse;
import com.peaksneaker.dto.response.OrderReturnResponse;
import com.peaksneaker.dto.response.PaginatedResponse;
import com.peaksneaker.enums.ReturnReasonCode;
import com.peaksneaker.enums.ReturnStatus;
import com.peaksneaker.enums.ReturnType;
import com.peaksneaker.security.UserDetailsImpl;
import com.peaksneaker.service.OrderReturnService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/admin/returns")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('ROLE_SUPER_ADMIN', 'SUPER_ADMIN', 'ROLE_ADMIN', 'ADMIN', 'ROLE_WAREHOUSE', 'WAREHOUSE', 'ROLE_SUPPORT', 'SUPPORT', 'ROLE_STAFF_MANAGER', 'STAFF_MANAGER', 'ROLE_SALES', 'SALES')")
public class AdminReturnsController {

    private final OrderReturnService orderReturnService;

    @GetMapping
    public ResponseEntity<ApiResponse<PaginatedResponse<OrderReturnResponse>>> getAllReturns(
            @RequestParam(required = false) ReturnStatus status,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) ReturnReasonCode reasonCode,
            @RequestParam(required = false) ReturnType returnType,
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) Long orderId,
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        OrderReturnFilterDto filter = OrderReturnFilterDto.builder()
                .query(query)
                .status(status)
                .reasonCode(reasonCode)
                .returnType(returnType)
                .productId(productId)
                .orderId(orderId)
                .from(from)
                .to(to)
                .build();
        Page<OrderReturnResponse> result = orderReturnService.searchReturns(filter, pageable);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách yêu cầu đổi trả thành công", PaginatedResponse.from(result)));
    }

    @GetMapping("/filter-options")
    public ResponseEntity<ApiResponse<OrderReturnFilterOptionsResponse>> getFilterOptions() {
        return ResponseEntity.ok(ApiResponse.success(orderReturnService.getFilterOptions()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OrderReturnResponse>> getReturnById(@PathVariable Long id) {
        OrderReturnResponse response = orderReturnService.getReturnById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<OrderReturnResponse>> processReturn(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody UpdateReturnStatusRequest request) {
        String adminEmail = userDetails != null ? userDetails.getUsername() : "ADMIN";
        OrderReturnResponse response = orderReturnService.processReturn(id, request, adminEmail);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái đổi trả thành công", response));
    }
}
