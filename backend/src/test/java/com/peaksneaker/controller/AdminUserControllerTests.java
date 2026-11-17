package com.peaksneaker.controller;

import com.peaksneaker.controller.admin.AdminUserController;
import com.peaksneaker.dto.response.PaginatedResponse;
import com.peaksneaker.dto.response.UserResponse;
import com.peaksneaker.exception.BadRequestException;
import com.peaksneaker.service.AdminUserService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminUserControllerTests {

    @Mock
    private AdminUserService adminUserService;

    @InjectMocks
    private AdminUserController adminUserController;

    @Test
    void convertsCustomDateRangeToCompleteLocalDays() {
        PaginatedResponse<UserResponse> emptyPage = PaginatedResponse.<UserResponse>builder()
                .items(List.of())
                .build();
        when(adminUserService.getUsers(any(), any(), any(), any(), any(), anyInt(), anyInt()))
                .thenReturn(emptyPage);

        LocalDate from = LocalDate.of(2026, 10, 1);
        LocalDate to = LocalDate.of(2026, 10, 18);
        adminUserController.getUsers(null, null, null, from, to, null, 0, 10);

        ArgumentCaptor<Instant> startCaptor = ArgumentCaptor.forClass(Instant.class);
        ArgumentCaptor<Instant> endCaptor = ArgumentCaptor.forClass(Instant.class);
        verify(adminUserService).getUsers(
                isNull(), isNull(), isNull(), startCaptor.capture(), endCaptor.capture(), eq(0), eq(10));

        ZoneId zone = ZoneId.systemDefault();
        assertEquals(from.atStartOfDay(zone).toInstant(), startCaptor.getValue());
        assertEquals(to.plusDays(1).atStartOfDay(zone).toInstant().minusNanos(1), endCaptor.getValue());
    }

    @Test
    void rejectsReversedCustomDateRange() {
        LocalDate from = LocalDate.of(2026, 10, 18);
        LocalDate to = LocalDate.of(2026, 10, 1);

        assertThrows(
                BadRequestException.class,
                () -> adminUserController.getUsers(null, null, null, from, to, null, 0, 10));
        verifyNoInteractions(adminUserService);
    }
}
