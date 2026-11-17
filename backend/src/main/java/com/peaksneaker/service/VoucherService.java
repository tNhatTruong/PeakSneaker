package com.peaksneaker.service;

import com.peaksneaker.dto.request.CreateVoucherRequest;
import com.peaksneaker.dto.request.VoucherCheckRequest;
import com.peaksneaker.dto.request.VoucherRequest;
import com.peaksneaker.dto.response.PaginatedResponse;
import com.peaksneaker.dto.response.VoucherCheckResponse;
import com.peaksneaker.dto.response.VoucherResponse;
import com.peaksneaker.dto.response.VoucherDetailResponse;

public interface VoucherService {
    PaginatedResponse<VoucherResponse> getVouchers(VoucherRequest params);
    VoucherDetailResponse getVoucher(Long id);
    VoucherResponse createVoucher(CreateVoucherRequest request);
    VoucherResponse updateVoucher(Long id, CreateVoucherRequest request);
    void deleteVoucher(Long id);
    VoucherCheckResponse checkVoucher(VoucherCheckRequest request);
}
