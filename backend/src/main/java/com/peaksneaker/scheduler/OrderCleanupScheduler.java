package com.peaksneaker.scheduler;

import com.peaksneaker.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Tien trinh dinh ky quet don hang VNPay chua thanh toan qua han 15 phut de tu dong huy va hoan ton kho.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class OrderCleanupScheduler {

    private final OrderService orderService;

    @Scheduled(fixedRate = 60000) // Chay moi 60 giay
    public void cleanupExpiredOrders() {
        try {
            int cancelled = orderService.cancelExpiredPendingOrders();
            if (cancelled > 0) {
                log.info("OrderCleanupScheduler: Da tu dong huy {} don hang VNPay qua han va hoan tra ton kho.", cancelled);
            }
        } catch (Exception ex) {
            log.error("OrderCleanupScheduler: Gap loi khi quet don qua han: {}", ex.getMessage());
        }
    }
}

