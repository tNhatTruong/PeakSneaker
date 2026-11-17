package com.peaksneaker.service.impl;

import com.peaksneaker.dto.response.BrandSalesResponse;
import com.peaksneaker.dto.response.DashboardSummaryResponse;
import com.peaksneaker.dto.response.LowStockItemResponse;
import com.peaksneaker.dto.response.RevenueChartResponse;
import com.peaksneaker.dto.response.TopProductResponse;
import com.peaksneaker.entity.Image;
import com.peaksneaker.entity.Product;
import com.peaksneaker.entity.ProductVariant;
import com.peaksneaker.enums.OrderStatus;
import com.peaksneaker.enums.PaymentMethod;
import com.peaksneaker.enums.PaymentStatus;
import com.peaksneaker.enums.Role;
import com.peaksneaker.exception.BadRequestException;
import com.peaksneaker.repository.InventoryBatchRepository;
import com.peaksneaker.repository.OrderItemRepository;
import com.peaksneaker.repository.OrderRepository;
import com.peaksneaker.repository.PaymentRepository;
import com.peaksneaker.repository.ProductRepository;
import com.peaksneaker.repository.ProductVariantRepository;
import com.peaksneaker.repository.UserRepository;
import com.peaksneaker.service.DashboardService;
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
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private static final int DEFAULT_PERIOD_DAYS = 30;
    private static final int MAX_PERIOD_DAYS = 366;
    private static final int LOW_STOCK_THRESHOLD = 10;
    private static final int AGED_BATCH_DAYS = 90;

    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final ProductVariantRepository productVariantRepository;
    private final InventoryBatchRepository inventoryBatchRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;
    private final CloudinaryService cloudinaryService;

    @Override
    public DashboardSummaryResponse getSummary(LocalDate startDate, LocalDate endDate) {
        DashboardPeriod period = resolvePeriod(startDate, endDate);
        DashboardPeriod previousPeriod = period.previous();

        BigDecimal currentRevenue = zeroIfNull(
                orderRepository.calculateRevenueBetween(period.startInstant(), period.endInstant()));
        BigDecimal previousRevenue = zeroIfNull(
                orderRepository.calculateRevenueBetween(previousPeriod.startInstant(), previousPeriod.endInstant()));

        long currentOrders = orderRepository.countByCreatedAtBetween(period.startInstant(), period.endInstant());
        long previousOrders = orderRepository.countByCreatedAtBetween(
                previousPeriod.startInstant(), previousPeriod.endInstant());

        long currentCustomers = countCustomers(period);
        long previousCustomers = countCustomers(previousPeriod);

        long processingOrders = countOrdersByStatuses(
                period,
                OrderStatus.PENDING,
                OrderStatus.CONFIRMED,
                OrderStatus.PROCESSING);
        long shippingOrders = countOrdersByStatuses(period, OrderStatus.SHIPPING, OrderStatus.DELIVERED);
        long completedOrders = countOrdersByStatuses(period, OrderStatus.COMPLETED);
        long previousCompletedOrders = countOrdersByStatuses(previousPeriod, OrderStatus.COMPLETED);
        long cancelledOrders = countOrdersByStatuses(period, OrderStatus.CANCELLED);
        long previousCancelledOrders = countOrdersByStatuses(previousPeriod, OrderStatus.CANCELLED);
        long paidOrders = orderRepository.countByPaymentStatusAndCreatedAtBetween(
                PaymentStatus.PAID, period.startInstant(), period.endInstant());
        long failedPaymentCount = paymentRepository.countByStatusAndCreatedAtBetween(
                PaymentStatus.FAILED, period.startInstant(), period.endInstant());
        long codOrders = orderRepository.countByPaymentMethodAndCreatedAtBetween(
                PaymentMethod.COD, period.startInstant(), period.endInstant());
        long vnpayOrders = orderRepository.countByPaymentMethodAndCreatedAtBetween(
                PaymentMethod.VNPAY, period.startInstant(), period.endInstant());

        double completionRate = percentage(completedOrders, currentOrders);
        double previousCompletionRate = percentage(previousCompletedOrders, previousOrders);
        double cancellationRate = percentage(cancelledOrders, currentOrders);
        double previousCancellationRate = percentage(previousCancelledOrders, previousOrders);
        BigDecimal averageOrderValue = averageValue(currentRevenue, completedOrders);
        BigDecimal previousAverageOrderValue = averageValue(previousRevenue, previousCompletedOrders);

        long lowStockCount = productVariantRepository.countLowStockVariants(LOW_STOCK_THRESHOLD);
        long agedBatchCount = inventoryBatchRepository
                .countByQuantityRemainingGreaterThanAndReceivedDateBefore(
                        0,
                        Instant.now().minus(AGED_BATCH_DAYS, ChronoUnit.DAYS));

        List<TopProductResponse> topProducts = buildTopProducts(period);
        List<BrandSalesResponse> brandSales = buildBrandSales(period);
        List<LowStockItemResponse> lowStockItems = buildLowStockItems();
        Map<String, Long> orderStatusCounts = buildOrderStatusCounts(period);
        Map<String, Long> paymentMethodCounts = buildPaymentMethodCounts(period);

        return DashboardSummaryResponse.builder()
                .periodStart(period.startDate())
                .periodEnd(period.endDate())
                .totalRevenue(currentRevenue)
                .revenueChange(calculatePercentageChange(currentRevenue, previousRevenue))
                .totalOrders(currentOrders)
                .ordersChange(calculatePercentageChange(currentOrders, previousOrders))
                .processingOrders(processingOrders)
                .shippingOrders(shippingOrders)
                .completedOrders(completedOrders)
                .cancelledOrders(cancelledOrders)
                .paidOrders(paidOrders)
                .failedPaymentCount(failedPaymentCount)
                .codOrders(codOrders)
                .vnpayOrders(vnpayOrders)
                .averageOrderValue(averageOrderValue)
                .averageOrderValueChange(calculatePercentageChange(averageOrderValue, previousAverageOrderValue))
                .newCustomers(currentCustomers)
                .customersChange(calculatePercentageChange(currentCustomers, previousCustomers))
                .conversionRate(completionRate)
                .conversionRateChange(roundOneDecimal(completionRate - previousCompletionRate))
                .cancellationRate(cancellationRate)
                .cancellationRateChange(roundOneDecimal(cancellationRate - previousCancellationRate))
                .lowStockCount(lowStockCount)
                .agedBatchCount(agedBatchCount)
                .topProducts(topProducts)
                .brandSales(brandSales)
                .lowStockItems(lowStockItems)
                .orderStatusCounts(orderStatusCounts)
                .paymentMethodCounts(paymentMethodCounts)
                .build();
    }

    @Override
    public List<RevenueChartResponse> getRevenueChart(LocalDate startDate, LocalDate endDate) {
        DashboardPeriod period = resolvePeriod(startDate, endDate);
        long totalDays = ChronoUnit.DAYS.between(period.startDate(), period.endDate()) + 1;
        int bucketDays = totalDays <= 45 ? 1 : totalDays <= 180 ? 7 : 30;
        List<RevenueChartResponse> chartData = new ArrayList<>();

        LocalDate bucketStart = period.startDate();
        while (!bucketStart.isAfter(period.endDate())) {
            LocalDate bucketEnd = bucketStart.plusDays(bucketDays - 1L);
            if (bucketEnd.isAfter(period.endDate())) {
                bucketEnd = period.endDate();
            }

            BigDecimal revenue = zeroIfNull(orderRepository.calculateRevenueBetween(
                    startOfDay(bucketStart), endOfDay(bucketEnd)));
            long orderCount = orderRepository.countByCreatedAtBetween(
                    startOfDay(bucketStart), endOfDay(bucketEnd));
            chartData.add(RevenueChartResponse.builder()
                    .name(formatBucketLabel(bucketStart, bucketDays, totalDays))
                    .date(bucketStart.toString())
                    .revenue(revenue)
                    .orderCount(orderCount)
                    .build());
            bucketStart = bucketEnd.plusDays(1);
        }

        return chartData;
    }

    private DashboardPeriod resolvePeriod(LocalDate startDate, LocalDate endDate) {
        LocalDate resolvedEnd = endDate != null ? endDate : LocalDate.now();
        LocalDate resolvedStart = startDate != null
                ? startDate
                : resolvedEnd.minusDays(DEFAULT_PERIOD_DAYS - 1L);

        if (resolvedEnd.isBefore(resolvedStart)) {
            throw new BadRequestException("Ngày kết thúc không được đứng trước ngày bắt đầu.");
        }

        long periodDays = ChronoUnit.DAYS.between(resolvedStart, resolvedEnd) + 1;
        if (periodDays > MAX_PERIOD_DAYS) {
            throw new BadRequestException("Dashboard chỉ hỗ trợ khoảng thời gian tối đa 366 ngày.");
        }

        return new DashboardPeriod(resolvedStart, resolvedEnd);
    }

    private long countCustomers(DashboardPeriod period) {
        return userRepository.countByRoleAndCreatedAtBetween(
                Role.USER, period.startInstant(), period.endInstant())
                + userRepository.countByRoleAndCreatedAtBetween(
                        Role.ROLE_CUSTOMER, period.startInstant(), period.endInstant());
    }

    private long countOrdersByStatuses(DashboardPeriod period, OrderStatus... statuses) {
        long total = 0;
        for (OrderStatus status : statuses) {
            total += orderRepository.countByStatusAndCreatedAtBetween(
                    status, period.startInstant(), period.endInstant());
        }
        return total;
    }

    private List<TopProductResponse> buildTopProducts(DashboardPeriod period) {
        List<Object[]> rawTopProducts = orderItemRepository.findTopSellingProductsBetween(
                period.startInstant(), period.endInstant(), PageRequest.of(0, 5));
        List<TopProductResponse> topProducts = new ArrayList<>();

        for (Object[] row : rawTopProducts) {
            Long productId = row[0] != null ? ((Number) row[0]).longValue() : null;
            String productName = (String) row[1];
            Long quantitySold = row[2] != null ? ((Number) row[2]).longValue() : 0L;
            BigDecimal maxUnitPrice = row[3] instanceof BigDecimal value ? value : BigDecimal.ZERO;
            BigDecimal grossSales = row[4] instanceof BigDecimal value ? value : BigDecimal.ZERO;
            Optional<Product> product = productId != null
                    ? productRepository.findById(productId)
                    : Optional.empty();
            String imageUrl = "";
            BigDecimal price = maxUnitPrice;

            if (product.isPresent()) {
                Product entity = product.get();
                price = entity.getPrice();
                imageUrl = entity.getImages().stream()
                        .filter(Image::getIsPrimary)
                        .map(this::resolveImageUrl)
                        .findFirst()
                        .orElse(entity.getImages().isEmpty() ? "" : resolveImageUrl(entity.getImages().get(0)));
                productName = entity.getName();
            }

            topProducts.add(TopProductResponse.builder()
                    .productId(productId)
                    .productName(productName)
                    .imageUrl(imageUrl)
                    .quantitySold(quantitySold)
                    .price(price)
                    .grossSales(grossSales)
                    .build());
        }

        return topProducts;
    }

    private List<BrandSalesResponse> buildBrandSales(DashboardPeriod period) {
        return orderItemRepository.findBrandSalesBetween(
                        period.startInstant(), period.endInstant(), PageRequest.of(0, 5))
                .stream()
                .map(row -> BrandSalesResponse.builder()
                        .brandName((String) row[0])
                        .grossSales(row[1] instanceof BigDecimal value ? value : BigDecimal.ZERO)
                        .build())
                .toList();
    }

    private List<LowStockItemResponse> buildLowStockItems() {
        return productVariantRepository.findLowStockVariants(
                        LOW_STOCK_THRESHOLD,
                        PageRequest.of(0, 5))
                .stream()
                .map(this::mapLowStockItem)
                .toList();
    }

    private LowStockItemResponse mapLowStockItem(ProductVariant variant) {
        Product product = variant.getProduct();
        String imageUrl = product.getImages().stream()
                .filter(Image::getIsPrimary)
                .map(this::resolveImageUrl)
                .findFirst()
                .orElse(product.getImages().isEmpty() ? "" : resolveImageUrl(product.getImages().get(0)));

        return LowStockItemResponse.builder()
                .variantId(variant.getId())
                .productId(product.getId())
                .productName(product.getName())
                .imageUrl(imageUrl)
                .sku(variant.getSku())
                .color(variant.getColor())
                .size(variant.getSize())
                .stock(variant.getStockQuantity())
                .safetyStockThreshold(variant.getSafetyStockThreshold())
                .build();
    }

    private Map<String, Long> buildOrderStatusCounts(DashboardPeriod period) {
        Map<String, Long> counts = new LinkedHashMap<>();
        for (OrderStatus status : OrderStatus.values()) {
            counts.put(status.name(), countOrdersByStatuses(period, status));
        }
        return counts;
    }

    private Map<String, Long> buildPaymentMethodCounts(DashboardPeriod period) {
        Map<String, Long> counts = new LinkedHashMap<>();
        for (PaymentMethod method : PaymentMethod.values()) {
            counts.put(method.name(), orderRepository.countByPaymentMethodAndCreatedAtBetween(
                    method,
                    period.startInstant(),
                    period.endInstant()));
        }
        return counts;
    }

    private String resolveImageUrl(Image image) {
        String storedUrl = image.getImageUrl();
        return cloudinaryService.creteImageUrl(
                storedUrl != null && !storedUrl.isBlank() ? storedUrl : image.getImageName());
    }

    private BigDecimal zeroIfNull(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private BigDecimal averageValue(BigDecimal total, long count) {
        return count > 0
                ? zeroIfNull(total).divide(BigDecimal.valueOf(count), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
    }

    private double percentage(long value, long total) {
        return total > 0 ? roundOneDecimal(((double) value / total) * 100.0) : 0.0;
    }

    private Double calculatePercentageChange(BigDecimal current, BigDecimal previous) {
        if (previous == null || previous.compareTo(BigDecimal.ZERO) == 0) {
            return current == null || current.compareTo(BigDecimal.ZERO) == 0 ? 0.0 : 100.0;
        }
        BigDecimal resolvedCurrent = current != null ? current : BigDecimal.ZERO;
        BigDecimal percent = resolvedCurrent.subtract(previous)
                .divide(previous, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100));
        return roundOneDecimal(percent.doubleValue());
    }

    private Double calculatePercentageChange(long current, long previous) {
        if (previous == 0) {
            return current == 0 ? 0.0 : 100.0;
        }
        return roundOneDecimal(((double) (current - previous) / previous) * 100.0);
    }

    private double roundOneDecimal(double value) {
        return Math.round(value * 10.0) / 10.0;
    }

    private String formatBucketLabel(LocalDate date, int bucketDays, long totalDays) {
        if (bucketDays == 1) {
            if (totalDays <= 7) {
                return getVietnameseDayOfWeek(date) + " (" + date.format(DateTimeFormatter.ofPattern("dd/MM")) + ")";
            }
            return date.format(DateTimeFormatter.ofPattern("dd/MM"));
        }
        if (bucketDays == 7) {
            return date.format(DateTimeFormatter.ofPattern("dd/MM"));
        }
        return date.format(DateTimeFormatter.ofPattern("MM/yyyy"));
    }

    private String getVietnameseDayOfWeek(LocalDate date) {
        return switch (date.getDayOfWeek()) {
            case MONDAY -> "T2";
            case TUESDAY -> "T3";
            case WEDNESDAY -> "T4";
            case THURSDAY -> "T5";
            case FRIDAY -> "T6";
            case SATURDAY -> "T7";
            case SUNDAY -> "CN";
        };
    }

    private static Instant startOfDay(LocalDate date) {
        return date.atStartOfDay(ZoneId.systemDefault()).toInstant();
    }

    private static Instant endOfDay(LocalDate date) {
        return date.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant().minusNanos(1);
    }

    private record DashboardPeriod(LocalDate startDate, LocalDate endDate) {
        private Instant startInstant() {
            return startOfDay(startDate);
        }

        private Instant endInstant() {
            return endOfDay(endDate);
        }

        private DashboardPeriod previous() {
            long dayCount = ChronoUnit.DAYS.between(startDate, endDate) + 1;
            LocalDate previousEnd = startDate.minusDays(1);
            return new DashboardPeriod(previousEnd.minusDays(dayCount - 1), previousEnd);
        }
    }
}
