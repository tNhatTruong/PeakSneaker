package com.peaksneaker;

import com.peaksneaker.entity.*;
import com.peaksneaker.enums.DiscountType;
import com.peaksneaker.enums.OrderStatus;
import com.peaksneaker.enums.ProductType;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import static org.junit.jupiter.api.Assertions.*;

class DomainLogicTests {

    @Test
    void supportsEveryProductTypeStoredByTheCatalogDump() {
        assertEquals(ProductType.SNEAKER, ProductType.valueOf("SNEAKER"));
        assertEquals(ProductType.ACCESSORY, ProductType.valueOf("ACCESSORY"));
        assertEquals(ProductType.SHOE_CARE, ProductType.valueOf("SHOE_CARE"));
    }

    @Test
    void testProductVariantFinalPrice() {
        Product product = Product.builder()
                .basePrice(BigDecimal.valueOf(100.00))
                .build();

        ProductVariant variant = ProductVariant.builder()
                .product(product)
                .priceAdjustment(BigDecimal.valueOf(15.50))
                .build();

        assertEquals(BigDecimal.valueOf(115.50), variant.getOriginalPrice());
        assertEquals(BigDecimal.valueOf(115.50), variant.getFinalPrice());
    }

    @Test
    void testProductVariantFinalPriceWithDiscount() {
        Product product = Product.builder()
                .basePrice(BigDecimal.valueOf(2860000.00))
                .discountPercent(BigDecimal.valueOf(5.00))
                .build();

        ProductVariant variant = ProductVariant.builder()
                .product(product)
                .priceAdjustment(BigDecimal.ZERO)
                .build();

        assertEquals(BigDecimal.valueOf(2860000.00), variant.getOriginalPrice());
        // 2860000 * (1 - 0.05) = 2717000.00
        assertEquals(0, BigDecimal.valueOf(2717000.00).compareTo(variant.getFinalPrice()));
    }

    @Test
    void testVoucherValidityAndDiscountCalculation() {
        // Active, valid PERCENTAGE voucher (10% off, max discount 15, min order 50)
        Voucher voucher = Voucher.builder()
                .code("SALE10")
                .discountType(DiscountType.PERCENTAGE)
                .discountValue(BigDecimal.valueOf(10.00))
                .minOrderAmount(BigDecimal.valueOf(50.00))
                .maxDiscountAmount(BigDecimal.valueOf(15.00))
                .usageLimit(10)
                .usedCount(0)
                .startAt(Instant.now().minus(1, ChronoUnit.DAYS))
                .expireAt(Instant.now().plus(1, ChronoUnit.DAYS))
                .isActive(true)
                .build();

        // 1. Check order subtotal too low
        assertFalse(voucher.isValidForOrder(BigDecimal.valueOf(40.00)));
        assertEquals(BigDecimal.ZERO, voucher.calculateDiscount(BigDecimal.valueOf(40.00)));

        // 2. Check valid order under cap (10% of 100 = 10)
        assertTrue(voucher.isValidForOrder(BigDecimal.valueOf(100.00)));
        assertEquals(0, BigDecimal.valueOf(10.00).compareTo(voucher.calculateDiscount(BigDecimal.valueOf(100.00))));

        // 3. Check valid order capped (10% of 200 = 20, capped at 15)
        assertEquals(0, BigDecimal.valueOf(15.00).compareTo(voucher.calculateDiscount(BigDecimal.valueOf(200.00))));

        // 4. Check expired voucher
        voucher.setExpireAt(Instant.now().minus(1, ChronoUnit.HOURS));
        assertFalse(voucher.isValidForOrder(BigDecimal.valueOf(100.00)));
        assertEquals(BigDecimal.ZERO, voucher.calculateDiscount(BigDecimal.valueOf(100.00)));

        // 5. Check inactive voucher
        voucher.setExpireAt(Instant.now().plus(1, ChronoUnit.DAYS));
        voucher.setIsActive(false);
        assertFalse(voucher.isValidForOrder(BigDecimal.valueOf(100.00)));

        // 6. Check usage limit reached
        voucher.setIsActive(true);
        voucher.setUsedCount(10);
        assertFalse(voucher.isValidForOrder(BigDecimal.valueOf(100.00)));
        assertThrows(IllegalStateException.class, voucher::incrementUsage);
    }

    @Test
    void testOrderTotalsCalculation() {
        Product product = Product.builder().basePrice(BigDecimal.valueOf(100.00)).build();
        ProductVariant variant1 = ProductVariant.builder().product(product).priceAdjustment(BigDecimal.valueOf(0)).build();
        ProductVariant variant2 = ProductVariant.builder().product(product).priceAdjustment(BigDecimal.valueOf(20.00)).build();

        Voucher voucher = Voucher.builder()
                .code("FIXED50")
                .discountType(DiscountType.FIXED)
                .discountValue(BigDecimal.valueOf(50.00))
                .isActive(true)
                .build();

        Order order = Order.builder()
                .voucher(voucher)
                .build();

        OrderItem item1 = OrderItem.builder()
                .productVariant(variant1)
                .unitPrice(BigDecimal.valueOf(100.00))
                .quantity(2) // subtotal 200
                .build();
        item1.calculateSubtotal();

        OrderItem item2 = OrderItem.builder()
                .productVariant(variant2)
                .unitPrice(BigDecimal.valueOf(120.00))
                .quantity(1) // subtotal 120
                .build();
        item2.calculateSubtotal();

        order.addItem(item1);
        order.addItem(item2);

        // Subtotal = 320, Discount = 50, Shipping = 15, Final = 320 - 50 + 15 = 285
        order.calculateTotals(BigDecimal.valueOf(15.00));

        assertEquals(BigDecimal.valueOf(320.00), order.getSubtotalAmount());
        assertEquals(BigDecimal.valueOf(50.00), order.getDiscountAmount());
        assertEquals(BigDecimal.valueOf(15.00), order.getShippingFee());
        assertEquals(BigDecimal.valueOf(285.00), order.getFinalAmount());
    }

    @Test
    void testOrderLifecycleDoesNotDeductReservedStockAgain() {
        ProductVariant variant = ProductVariant.builder()
                .sku("NK-AF1-WHT-42")
                .stockQuantity(10)
                .build();

        Order order = Order.builder().build();
        OrderItem item = OrderItem.builder()
                .productVariant(variant)
                .quantity(3)
                .unitPrice(BigDecimal.valueOf(100.00))
                .build();
        item.calculateSubtotal();
        order.addItem(item);

        assertEquals(OrderStatus.PENDING, order.getStatus());

        order.advanceStatus(OrderStatus.CONFIRMED);
        order.advanceStatus(OrderStatus.PROCESSING);
        order.advanceStatus(OrderStatus.SHIPPING);
        assertEquals(OrderStatus.SHIPPING, order.getStatus());
        assertEquals(10, variant.getStockQuantity());

        assertThrows(IllegalStateException.class, order::cancel);
        assertThrows(IllegalStateException.class, () -> order.advanceStatus(OrderStatus.PENDING));

        order.advanceStatus(OrderStatus.DELIVERED);
        assertNotNull(order.getDeliveredAt());
        order.advanceStatus(OrderStatus.COMPLETED);
        assertEquals(OrderStatus.COMPLETED, order.getStatus());
        assertFalse(order.canTransitionTo(OrderStatus.CANCELLED));
        assertEquals(10, variant.getStockQuantity());
        
        Order confirmedOrder = Order.builder().build();
        confirmedOrder.advanceStatus(OrderStatus.CONFIRMED);
        confirmedOrder.cancel();
        assertEquals(OrderStatus.CANCELLED, confirmedOrder.getStatus());
    }

    @Test
    void testCartOperationsAndMerging() {
        ProductVariant variant1 = ProductVariant.builder().id(1L).stockQuantity(10).build();
        ProductVariant variant2 = ProductVariant.builder().id(2L).stockQuantity(5).build();

        Cart userCart = Cart.builder().build();
        userCart.addItem(variant1, 2);

        assertEquals(1, userCart.getItems().size());
        assertEquals(2, userCart.getTotalQuantity());

        // Merge guest cart containing variant1 and variant2
        Cart guestCart = Cart.builder().build();
        guestCart.addItem(variant1, 1);
        guestCart.addItem(variant2, 3);

        userCart.merge(guestCart);

        // After merge, userCart should have variant1 with qty 3 (2+1) and variant2 with qty 3
        assertEquals(2, userCart.getItems().size());
        assertEquals(6, userCart.getTotalQuantity());
    }
}
