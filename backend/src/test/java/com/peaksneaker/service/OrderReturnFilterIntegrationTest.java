package com.peaksneaker.service;

import com.peaksneaker.dto.request.OrderReturnFilterDto;
import com.peaksneaker.dto.response.OrderReturnResponse;
import com.peaksneaker.enums.PaymentMethod;
import com.peaksneaker.enums.ReturnReasonCode;
import com.peaksneaker.enums.ReturnType;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class OrderReturnFilterIntegrationTest {

    @Autowired
    private OrderReturnService orderReturnService;

    @Test
    void filtersReturnsGloballyByReasonAndType() {
        OrderReturnFilterDto filter = OrderReturnFilterDto.builder()
                .reasonCode(ReturnReasonCode.DEFECTIVE_PRODUCT)
                .returnType(ReturnType.RETURN_REFUND)
                .build();

        Page<OrderReturnResponse> result = orderReturnService.searchReturns(
                filter, PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "createdAt")));

        assertThat(result.getContent())
                .isNotEmpty()
                .allSatisfy(item -> {
                    assertThat(item.getReasonCode()).isEqualTo(ReturnReasonCode.DEFECTIVE_PRODUCT);
                    assertThat(item.getReturnType()).isEqualTo(ReturnType.RETURN_REFUND);
                });
    }

    @Test
    void searchesAcrossRmaOrderCustomerAndProductFields() {
        OrderReturnFilterDto filter = OrderReturnFilterDto.builder()
                .query("40001")
                .build();

        Page<OrderReturnResponse> result = orderReturnService.searchReturns(filter, PageRequest.of(0, 20));

        assertThat(result.getContent()).extracting(OrderReturnResponse::getId).contains(40001L);
    }

    @Test
    void filtersReturnsByOriginalPaymentMethod() {
        OrderReturnFilterDto filter = OrderReturnFilterDto.builder()
                .paymentMethod(PaymentMethod.VNPAY)
                .build();

        Page<OrderReturnResponse> result = orderReturnService.searchReturns(
                filter, PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "createdAt")));

        assertThat(result.getContent())
                .isNotEmpty()
                .allSatisfy(item -> assertThat(item.getPaymentMethod()).isEqualTo(PaymentMethod.VNPAY));
    }

    @Test
    void exposesStatusCountsAndOnlyProductsUsedInReturns() {
        var options = orderReturnService.getFilterOptions();

        assertThat(options.getStatusCounts().values()).allMatch(count -> count >= 0);
        assertThat(options.getProducts()).isNotEmpty();
        assertThat(options.getProducts()).allSatisfy(product -> {
            assertThat(product.getId()).isPositive();
            assertThat(product.getName()).isNotBlank();
        });
    }
}
