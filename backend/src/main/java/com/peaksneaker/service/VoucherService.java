package com.peaksneaker.service;

import com.peaksneaker.dto.request.VoucherRequest;
import com.peaksneaker.dto.response.VoucherResponse;
import com.peaksneaker.entity.Voucher;
import com.peaksneaker.repository.VoucherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import com.peaksneaker.dto.response.PaginatedResponse;
import com.peaksneaker.dto.request.CreateVoucherRequest;

@Service
@RequiredArgsConstructor
public class VoucherService {
    private final VoucherRepository voucherRepository;

    public PaginatedResponse<VoucherResponse> getVouchers(VoucherRequest params) {
        Pageable pageable = PageRequest.of(params.getPage(), params.getSize());
        Page<Voucher> vouchers = voucherRepository.search(
                params.getQuery(),
                params.getIsActive(),
                pageable);

        Page<VoucherResponse> responsePage = vouchers.map(this::toResponse);
        return PaginatedResponse.from(responsePage);
    }

    public VoucherResponse createVoucher(CreateVoucherRequest request) {
        Voucher voucher = Voucher.builder()
                .code(request.getCode())
                .discountType(request.getDiscountType())
                .discountValue(request.getDiscountValue())
                .minOrderAmount(request.getMinOrderAmount())
                .maxDiscountAmount(request.getMaxDiscountAmount())
                .usageLimit(request.getUsageLimit())
                .startAt(request.getStartAt())
                .expireAt(request.getExpireAt())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();
        return toResponse(voucherRepository.save(voucher));
    }

    public VoucherResponse updateVoucher(Long id, CreateVoucherRequest request) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Voucher not found"));

        voucher.setCode(request.getCode());
        voucher.setDiscountType(request.getDiscountType());
        voucher.setDiscountValue(request.getDiscountValue());
        voucher.setMinOrderAmount(request.getMinOrderAmount());
        voucher.setMaxDiscountAmount(request.getMaxDiscountAmount());
        voucher.setUsageLimit(request.getUsageLimit());
        voucher.setStartAt(request.getStartAt());
        voucher.setExpireAt(request.getExpireAt());
        if (request.getIsActive() != null) {
            voucher.setIsActive(request.getIsActive());
        }

        return toResponse(voucherRepository.save(voucher));
    }

    public void deleteVoucher(Long id) {
        voucherRepository.deleteById(id);
    }

    private VoucherResponse toResponse(Voucher voucher) {
        return VoucherResponse.builder()
                .id(voucher.getId())
                .code(voucher.getCode())
                .discountType(voucher.getDiscountType())
                .discountValue(voucher.getDiscountValue())
                .minOrderAmount(voucher.getMinOrderAmount())
                .maxDiscountAmount(voucher.getMaxDiscountAmount())
                .usageLimit(voucher.getUsageLimit())
                .usedCount(voucher.getUsedCount())
                .startAt(voucher.getStartAt())
                .expireAt(voucher.getExpireAt())
                .isActive(voucher.getIsActive())
                .build();
    }
}
