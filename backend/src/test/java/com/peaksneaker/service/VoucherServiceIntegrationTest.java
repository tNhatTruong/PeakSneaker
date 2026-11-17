package com.peaksneaker.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import com.peaksneaker.dto.request.VoucherRequest;
import com.peaksneaker.dto.response.PaginatedResponse;
import com.peaksneaker.dto.response.VoucherDetailResponse;
import com.peaksneaker.dto.response.VoucherResponse;
import com.peaksneaker.enums.DiscountType;
import com.peaksneaker.enums.VoucherApplicationScope;
import com.peaksneaker.enums.VoucherChannel;
import com.peaksneaker.enums.VoucherStatus;

@SpringBootTest
class VoucherServiceIntegrationTest {

    @Autowired
    private VoucherService voucherService;

    @Test
    void filtersActivePercentagePromotionsWithoutExplicitSort() {
        VoucherRequest request = VoucherRequest.builder()
                .status(VoucherStatus.ACTIVE)
                .discountType(DiscountType.PERCENTAGE)
                .applicationScope(VoucherApplicationScope.ALL_PRODUCTS)
                .applicationChannel(VoucherChannel.WEB)
                .page(0)
                .size(50)
                .build();

        PaginatedResponse<VoucherResponse> result = voucherService.getVouchers(request);

        assertThat(result.getItems())
                .isNotEmpty()
                .allSatisfy(voucher -> {
                    assertThat(voucher.getStatus()).isEqualTo(VoucherStatus.ACTIVE);
                    assertThat(voucher.getDiscountType()).isEqualTo(DiscountType.PERCENTAGE);
                    assertThat(voucher.getApplicationScope()).isEqualTo(VoucherApplicationScope.ALL_PRODUCTS);
                    assertThat(voucher.getApplicationChannel()).isEqualTo(VoucherChannel.WEB);
                });
    }

    @Test
    void detailIncludesProgramMetadataAndOrderEffectiveness() {
        VoucherRequest request = VoucherRequest.builder().page(0).size(1).build();
        VoucherResponse voucher = voucherService.getVouchers(request).getItems().getFirst();

        VoucherDetailResponse detail = voucherService.getVoucher(voucher.getId());

        assertThat(detail.getVoucher().getName()).isNotBlank();
        assertThat(detail.getVoucher().getCreatedAt()).isNotNull();
        assertThat(detail.getTotalDiscountAmount()).isNotNull().isNotNegative();
        assertThat(detail.getGeneratedRevenue()).isNotNull().isNotNegative();
    }
}
