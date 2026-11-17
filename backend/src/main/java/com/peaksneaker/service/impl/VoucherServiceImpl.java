package com.peaksneaker.service.impl;

import com.peaksneaker.dto.request.CreateVoucherRequest;
import com.peaksneaker.dto.request.VoucherCheckRequest;
import com.peaksneaker.dto.request.VoucherRequest;
import com.peaksneaker.dto.response.PaginatedResponse;
import com.peaksneaker.dto.response.VoucherCheckResponse;
import com.peaksneaker.dto.response.VoucherResponse;
import com.peaksneaker.dto.response.VoucherDetailResponse;
import com.peaksneaker.entity.Voucher;
import com.peaksneaker.exception.BadRequestException;
import com.peaksneaker.exception.ConflictException;
import com.peaksneaker.exception.ResourceNotFoundException;
import com.peaksneaker.repository.OrderRepository;
import com.peaksneaker.repository.VoucherRepository;
import com.peaksneaker.service.VoucherService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class VoucherServiceImpl implements VoucherService {

    private final VoucherRepository voucherRepository;
    private final OrderRepository orderRepository;

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("createdAt", "startAt", "expireAt", "code", "name");

    @Override
    @Transactional(readOnly = true)
    public PaginatedResponse<VoucherResponse> getVouchers(VoucherRequest params) {
        int page = Math.max(params.getPage(), 0);
        int size = Math.min(Math.max(params.getSize(), 1), 200);
        String sortBy = params.getSortBy() != null && ALLOWED_SORT_FIELDS.contains(params.getSortBy())
                ? params.getSortBy()
                : "createdAt";
        Sort.Direction direction = "asc".equalsIgnoreCase(params.getSortDirection())
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
        Page<Voucher> vouchers = voucherRepository.search(
                params.getQuery(),
                params.getIsActive(),
                params.getStatus() == null ? null : params.getStatus().name(),
                params.getDiscountType(),
                params.getApplicationScope(),
                params.getApplicationChannel(),
                params.getFromDate() == null ? Instant.EPOCH : params.getFromDate(),
                params.getToDate() == null ? Instant.parse("9999-12-31T23:59:59Z") : params.getToDate(),
                Instant.now(),
                pageable);

        Page<VoucherResponse> responsePage = vouchers.map(this::toResponse);
        return PaginatedResponse.from(responsePage);
    }

    @Override
    @Transactional(readOnly = true)
    public VoucherDetailResponse getVoucher(Long id) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Voucher", "id", id));

        return VoucherDetailResponse.builder()
                .voucher(toResponse(voucher))
                .usageCount(voucher.getUsedCount() == null ? 0 : voucher.getUsedCount())
                .totalDiscountAmount(defaultAmount(orderRepository.calculateVoucherDiscountTotal(id)))
                .generatedRevenue(defaultAmount(orderRepository.calculateVoucherGeneratedRevenue(id)))
                .build();
    }

    @Override
    @Transactional
    public VoucherResponse createVoucher(CreateVoucherRequest request) {
        validateRequest(request, null);
        Voucher voucher = Voucher.builder()
                .code(normalizeCode(request.getCode()))
                .name(request.getName().trim())
                .description(request.getDescription())
                .discountType(request.getDiscountType())
                .discountValue(request.getDiscountValue())
                .minOrderAmount(request.getMinOrderAmount())
                .maxDiscountAmount(request.getMaxDiscountAmount())
                .usageLimit(request.getUsageLimit())
                .perUserLimit(request.getPerUserLimit())
                .startAt(request.getStartAt())
                .expireAt(request.getExpireAt())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .applicationScope(request.getApplicationScope() == null
                        ? com.peaksneaker.enums.VoucherApplicationScope.ALL_PRODUCTS
                        : request.getApplicationScope())
                .applicationChannel(request.getApplicationChannel() == null
                        ? com.peaksneaker.enums.VoucherChannel.WEB
                        : request.getApplicationChannel())
                .isCombinable(Boolean.TRUE.equals(request.getIsCombinable()))
                .build();
        return toResponse(voucherRepository.save(voucher));
    }

    @Override
    @Transactional
    public VoucherResponse updateVoucher(Long id, CreateVoucherRequest request) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Voucher", "id", id));

        validateRequest(request, id);

        voucher.setCode(normalizeCode(request.getCode()));
        voucher.setName(request.getName().trim());
        voucher.setDescription(request.getDescription());
        voucher.setDiscountType(request.getDiscountType());
        voucher.setDiscountValue(request.getDiscountValue());
        voucher.setMinOrderAmount(request.getMinOrderAmount());
        voucher.setMaxDiscountAmount(request.getMaxDiscountAmount());
        voucher.setUsageLimit(request.getUsageLimit());
        voucher.setPerUserLimit(request.getPerUserLimit());
        voucher.setStartAt(request.getStartAt());
        voucher.setExpireAt(request.getExpireAt());
        if (request.getIsActive() != null) {
            voucher.setIsActive(request.getIsActive());
        }
        voucher.setApplicationScope(request.getApplicationScope() == null
                ? com.peaksneaker.enums.VoucherApplicationScope.ALL_PRODUCTS
                : request.getApplicationScope());
        voucher.setApplicationChannel(request.getApplicationChannel() == null
                ? com.peaksneaker.enums.VoucherChannel.WEB
                : request.getApplicationChannel());
        voucher.setIsCombinable(Boolean.TRUE.equals(request.getIsCombinable()));

        return toResponse(voucherRepository.save(voucher));
    }

    @Override
    @Transactional
    public void deleteVoucher(Long id) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Voucher", "id", id));
        if ((voucher.getUsedCount() != null && voucher.getUsedCount() > 0)
                || orderRepository.countByVoucherId(id) > 0) {
            throw new BadRequestException("Không thể xóa khuyến mãi đã phát sinh đơn hàng hoặc lượt sử dụng. Vui lòng tạm ngưng chương trình.");
        }
        voucherRepository.delete(voucher);
    }

    @Override
    @Transactional(readOnly = true)
    public VoucherCheckResponse checkVoucher(VoucherCheckRequest request) {
        Optional<Voucher> voucherOpt = voucherRepository.findByCode(request.getCode());
        
        if (voucherOpt.isEmpty()) {
            return VoucherCheckResponse.builder()
                    .isValid(false)
                    .message("Mã giảm giá không tồn tại")
                    .discountAmount(BigDecimal.ZERO)
                    .build();
        }
        
        Voucher voucher = voucherOpt.get();
        if (!voucher.isValidForOrder(request.getSubtotal())) {
            String msg = "Mã giảm giá không hợp lệ hoặc không đủ điều kiện áp dụng";
            if (voucher.isExpired()) msg = "Mã giảm giá đã hết hạn";
            else if (voucher.isLimitReached()) msg = "Mã giảm giá đã hết lượt sử dụng";
            else if (voucher.getMinOrderAmount() != null && request.getSubtotal().compareTo(voucher.getMinOrderAmount()) < 0) {
                msg = "Đơn hàng chưa đạt giá trị tối thiểu " + String.format("%,.0f", voucher.getMinOrderAmount()) + "đ";
            }
            
            return VoucherCheckResponse.builder()
                    .isValid(false)
                    .message(msg)
                    .discountAmount(BigDecimal.ZERO)
                    .build();
        }
        
        BigDecimal discount = voucher.calculateDiscount(request.getSubtotal());
        return VoucherCheckResponse.builder()
                .isValid(true)
                .message("Áp dụng mã giảm giá thành công")
                .discountAmount(discount)
                .build();
    }

    private VoucherResponse toResponse(Voucher voucher) {
        return VoucherResponse.builder()
                .id(voucher.getId())
                .code(voucher.getCode())
                .name(voucher.getName())
                .description(voucher.getDescription())
                .discountType(voucher.getDiscountType())
                .discountValue(voucher.getDiscountValue())
                .minOrderAmount(voucher.getMinOrderAmount())
                .maxDiscountAmount(voucher.getMaxDiscountAmount())
                .usageLimit(voucher.getUsageLimit())
                .perUserLimit(voucher.getPerUserLimit())
                .usedCount(voucher.getUsedCount())
                .startAt(voucher.getStartAt())
                .expireAt(voucher.getExpireAt())
                .isActive(voucher.getIsActive())
                .applicationScope(voucher.getApplicationScope())
                .applicationChannel(voucher.getApplicationChannel())
                .isCombinable(voucher.getIsCombinable())
                .status(voucher.getStatus())
                .createdAt(voucher.getCreatedAt())
                .updatedAt(voucher.getUpdatedAt())
                .build();
    }

    private void validateRequest(CreateVoucherRequest request, Long currentId) {
        if (request.getStartAt() == null || request.getExpireAt() == null
                || !request.getExpireAt().isAfter(request.getStartAt())) {
            throw new BadRequestException("Thời gian kết thúc phải sau thời gian bắt đầu.");
        }
        if (request.getDiscountType() == com.peaksneaker.enums.DiscountType.PERCENTAGE
                && request.getDiscountValue() != null
                && request.getDiscountValue().compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new BadRequestException("Mức giảm phần trăm không được vượt quá 100%.");
        }
        if (request.getApplicationScope() != null
                && request.getApplicationScope() != com.peaksneaker.enums.VoucherApplicationScope.ALL_PRODUCTS) {
            throw new BadRequestException("Hệ thống hiện chỉ hỗ trợ khuyến mãi áp dụng cho toàn bộ sản phẩm.");
        }
        if (request.getApplicationChannel() != null
                && request.getApplicationChannel() != com.peaksneaker.enums.VoucherChannel.WEB) {
            throw new BadRequestException("Hệ thống hiện chỉ hỗ trợ kênh áp dụng WEB.");
        }
        if (Boolean.TRUE.equals(request.getIsCombinable())) {
            throw new BadRequestException("Checkout hiện chỉ hỗ trợ một voucher cho mỗi đơn hàng.");
        }

        String normalizedCode = normalizeCode(request.getCode());
        voucherRepository.findByCode(normalizedCode).ifPresent(existing -> {
            if (currentId == null || !existing.getId().equals(currentId)) {
                throw new ConflictException("Mã khuyến mãi đã tồn tại.");
            }
        });
    }

    private String normalizeCode(String code) {
        return code == null ? "" : code.trim().toUpperCase(Locale.ROOT);
    }

    private BigDecimal defaultAmount(BigDecimal amount) {
        return amount == null ? BigDecimal.ZERO : amount;
    }
}
