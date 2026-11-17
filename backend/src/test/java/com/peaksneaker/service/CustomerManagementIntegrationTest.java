package com.peaksneaker.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import com.peaksneaker.dto.response.CustomerDetailResponse;
import com.peaksneaker.dto.response.PaginatedResponse;
import com.peaksneaker.dto.response.UserResponse;
import com.peaksneaker.enums.Role;

@SpringBootTest
class CustomerManagementIntegrationTest {

    @Autowired
    private AdminUserService adminUserService;

    @Test
    void getUsersFiltersCustomersAndComputesLifecycleTiersAccurately() {
        PaginatedResponse<UserResponse> response = adminUserService.getUsers(
                null, null, Role.USER, null, null, 0, 50);

        assertThat(response.getItems()).isNotEmpty();
        assertThat(response.getItems()).allSatisfy(user -> {
            assertThat(user.getEmail()).isNotBlank();
            assertThat(user.getFullName()).isNotBlank();
            assertThat(user.getOrderCount()).isNotNull().isNotNegative();
            assertThat(user.getTotalSpent()).isNotNull().isNotNegative();
            assertThat(user.getCustomerTier()).isIn("VIP", "LOYAL", "REGULAR");

            // Verify RFM/CLV Tier Formula
            if (user.getTotalSpent().doubleValue() >= 20_000_000 || user.getOrderCount() >= 10) {
                assertThat(user.getCustomerTier()).isEqualTo("VIP");
            } else if (user.getTotalSpent().doubleValue() >= 5_000_000 || user.getOrderCount() >= 3) {
                assertThat(user.getCustomerTier()).isEqualTo("LOYAL");
            } else {
                assertThat(user.getCustomerTier()).isEqualTo("REGULAR");
            }
        });
    }

    @Test
    void getCustomerDetailReturnsAddressBookOrdersAndLifecycleMetrics() {
        PaginatedResponse<UserResponse> list = adminUserService.getUsers(
                null, null, Role.USER, null, null, 0, 1);
        assertThat(list.getItems()).isNotEmpty();

        Long customerId = list.getItems().getFirst().getId();
        CustomerDetailResponse detail = adminUserService.getCustomerDetail(customerId);

        assertThat(detail.getId()).isEqualTo(customerId);
        assertThat(detail.getEmail()).isNotBlank();
        assertThat(detail.getFullName()).isNotBlank();
        assertThat(detail.getCustomerTier()).isIn("VIP", "LOYAL", "REGULAR");
        assertThat(detail.getAddresses()).isNotNull();
        assertThat(detail.getRecentOrders()).isNotNull();
        assertThat(detail.getWishlistCount()).isNotNegative();
    }

    @Test
    void updateUserStatusCanBlockAndReactivateCustomer() {
        PaginatedResponse<UserResponse> list = adminUserService.getUsers(
                null, null, Role.USER, null, null, 0, 1);
        assertThat(list.getItems()).isNotEmpty();

        Long customerId = list.getItems().getFirst().getId();
        boolean originalStatus = Boolean.TRUE.equals(list.getItems().getFirst().getIsActive());

        UserResponse blocked = adminUserService.updateUserStatus(customerId, !originalStatus);
        assertThat(blocked.getIsActive()).isEqualTo(!originalStatus);

        UserResponse restored = adminUserService.updateUserStatus(customerId, originalStatus);
        assertThat(restored.getIsActive()).isEqualTo(originalStatus);
    }
}

