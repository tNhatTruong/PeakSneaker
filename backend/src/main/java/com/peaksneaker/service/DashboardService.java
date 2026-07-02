package com.peaksneaker.service;

import com.peaksneaker.dto.response.*;
import com.peaksneaker.entity.Image;
import com.peaksneaker.entity.Product;
import com.peaksneaker.enums.OrderStatus;
import com.peaksneaker.enums.Role;
import com.peaksneaker.repository.*;
import com.peaksneaker.service.cloudservice.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class DashboardService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ProductVariantRepository productVariantRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;
    private final CloudinaryService cloudinaryService;

    public DashboardSummaryResponse getSummary() {
        Instant now = Instant.now();
        Instant thirtyDaysAgo = now.minus(30, ChronoUnit.DAYS);
        Instant sixtyDaysAgo = now.minus(60, ChronoUnit.DAYS);

        // 1. Doanh thu (Revenue)
        BigDecimal totalRevenue = orderRepository.calculateTotalRevenue();
        if (totalRevenue == null) {
            totalRevenue = BigDecimal.ZERO;
        }

        BigDecimal currentRevenue = orderRepository.calculateRevenueBetween(thirtyDaysAgo, now);
        if (currentRevenue == null) {
            currentRevenue = BigDecimal.ZERO;
        }
        BigDecimal previousRevenue = orderRepository.calculateRevenueBetween(sixtyDaysAgo, thirtyDaysAgo);
        if (previousRevenue == null) {
            previousRevenue = BigDecimal.ZERO;
        }
        Double revenueChange = calculatePercentageChange(currentRevenue, previousRevenue);

        // 2. Đơn hàng mới (New orders in last 30 days)
        long currentOrders = orderRepository.countByCreatedAtBetween(thirtyDaysAgo, now);
        long previousOrders = orderRepository.countByCreatedAtBetween(sixtyDaysAgo, thirtyDaysAgo);
        Double ordersChange = calculatePercentageChange(currentOrders, previousOrders);

        // 3. Khách hàng mới (New users with role USER in last 30 days)
        long currentCustomers = userRepository.countByRoleAndCreatedAtBetween(Role.USER, thirtyDaysAgo, now);
        long previousCustomers = userRepository.countByRoleAndCreatedAtBetween(Role.USER, sixtyDaysAgo, thirtyDaysAgo);
        Double customersChange = calculatePercentageChange(currentCustomers, previousCustomers);

        // 4. Tỷ lệ chuyển đổi (Conversion Rate)
        // CR = (số đơn hàng hoàn thành / số người dùng đăng ký mới) * 100
        long currentCompletedOrders = orderRepository.countByStatusAndCreatedAtBetween(OrderStatus.COMPLETED, thirtyDaysAgo, now);
        long previousCompletedOrders = orderRepository.countByStatusAndCreatedAtBetween(OrderStatus.COMPLETED, sixtyDaysAgo, thirtyDaysAgo);

        double currentConversionRate = currentCustomers > 0 ? ((double) currentCompletedOrders / currentCustomers) * 100.0 : 0.0;
        double previousConversionRate = previousCustomers > 0 ? ((double) previousCompletedOrders / previousCustomers) * 100.0 : 0.0;

        currentConversionRate = Math.round(currentConversionRate * 10.0) / 10.0;
        previousConversionRate = Math.round(previousConversionRate * 10.0) / 10.0;

        Double conversionRateChange = Math.round((currentConversionRate - previousConversionRate) * 10.0) / 10.0;

        // 5. Sản phẩm sắp hết hàng (Low Stock Count - threshold is 10)
        long lowStockCount = productVariantRepository.countLowStockVariants(10);

        // 6. Top sản phẩm bán chạy (Top 5 selling products)
        List<Object[]> rawTopProducts = orderItemRepository.findTopSellingProducts(PageRequest.of(0, 5));
        List<TopProductResponse> topProducts = new ArrayList<>();
        for (Object[] row : rawTopProducts) {
            Long productId = (Long) row[0];
            String productName = (String) row[1];
            Long quantitySold = (Long) row[2];
            BigDecimal maxUnitPrice = (BigDecimal) row[3];

            Optional<Product> optProduct = productRepository.findById(productId);
            String imageUrl = "";
            BigDecimal price = maxUnitPrice;

            if (optProduct.isPresent()) {
                Product product = optProduct.get();
                price = product.getPrice();
                String defaultImage = product.getImages().stream()
                        .filter(Image::getIsPrimary)
                        .map(Image::getImageName)
                        .findFirst()
                        .orElse(product.getImages().isEmpty() ? null : product.getImages().get(0).getImageName());
                if (defaultImage != null) {
                    imageUrl = cloudinaryService.creteImageUrl(defaultImage);
                }
                productName = product.getName();
            }

            topProducts.add(TopProductResponse.builder()
                    .productId(productId)
                    .productName(productName)
                    .imageUrl(imageUrl)
                    .quantitySold(quantitySold)
                    .price(price)
                    .build());
        }

        return DashboardSummaryResponse.builder()
                .totalRevenue(totalRevenue)
                .revenueChange(revenueChange)
                .totalOrders(currentOrders)
                .ordersChange(ordersChange)
                .newCustomers(currentCustomers)
                .customersChange(customersChange)
                .conversionRate(currentConversionRate)
                .conversionRateChange(conversionRateChange)
                .lowStockCount(lowStockCount)
                .topProducts(topProducts)
                .build();
    }

    public List<RevenueChartResponse> getRevenueChart() {
        List<RevenueChartResponse> chartData = new ArrayList<>();
        LocalDate today = LocalDate.now();

        // Lấy doanh thu của 7 ngày qua
        for (int i = 6; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            Instant startOfDay = date.atStartOfDay(ZoneId.systemDefault()).toInstant();
            Instant endOfDay = date.atTime(23, 59, 59, 999_999_999).atZone(ZoneId.systemDefault()).toInstant();

            BigDecimal revenue = orderRepository.calculateRevenueBetween(startOfDay, endOfDay);
            if (revenue == null) {
                revenue = BigDecimal.ZERO;
            }

            String dayName = getVietnameseDayOfWeek(date.getDayOfWeek());

            chartData.add(RevenueChartResponse.builder()
                    .name(dayName)
                    .date(date.toString())
                    .revenue(revenue)
                    .build());
        }

        return chartData;
    }

    private Double calculatePercentageChange(BigDecimal current, BigDecimal previous) {
        if (previous == null || previous.compareTo(BigDecimal.ZERO) == 0) {
            if (current == null || current.compareTo(BigDecimal.ZERO) == 0) {
                return 0.0;
            }
            return 100.0;
        }
        if (current == null) {
            current = BigDecimal.ZERO;
        }
        BigDecimal diff = current.subtract(previous);
        BigDecimal percent = diff.divide(previous, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100));
        return Math.round(percent.doubleValue() * 10.0) / 10.0;
    }

    private Double calculatePercentageChange(long current, long previous) {
        if (previous == 0) {
            if (current == 0) {
                return 0.0;
            }
            return 100.0;
        }
        double diff = (double) (current - previous);
        double percent = (diff / previous) * 100.0;
        return Math.round(percent * 10.0) / 10.0;
    }

    private String getVietnameseDayOfWeek(java.time.DayOfWeek day) {
        return switch (day) {
            case MONDAY -> "T2";
            case TUESDAY -> "T3";
            case WEDNESDAY -> "T4";
            case THURSDAY -> "T5";
            case FRIDAY -> "T6";
            case SATURDAY -> "T7";
            case SUNDAY -> "CN";
        };
    }
}
