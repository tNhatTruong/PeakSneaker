package com.peaksneaker.service;

import com.peaksneaker.dto.request.AdminCreateOrderRequest;
import com.peaksneaker.dto.request.CheckoutRequest;
import com.peaksneaker.dto.request.CreateBatchRequest;
import com.peaksneaker.dto.request.LoginRequest;
import com.peaksneaker.dto.request.UpdateStaffPermissionsRequest;
import com.peaksneaker.dto.request.UpdateStaffRoleRequest;
import com.peaksneaker.dto.response.BatchResponse;
import com.peaksneaker.dto.response.OrderResponse;
import com.peaksneaker.dto.response.VnpayIpnResponse;
import com.peaksneaker.entity.*;
import com.peaksneaker.enums.*;
import com.peaksneaker.exception.BadRequestException;
import com.peaksneaker.repository.*;
import com.peaksneaker.security.UserDetailsServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("postgres")
@Transactional
class ProductionHardeningIntegrationTest {

    @Autowired
    private OrderService orderService;

    @Autowired
    private StaffService staffService;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StaffProfileRepository staffProfileRepository;

    @Autowired
    private ProductVariantRepository productVariantRepository;

    @Autowired
    private InventoryBatchRepository inventoryBatchRepository;

    @Autowired
    private VoucherRepository voucherRepository;

    @Autowired
    private VoucherUsageRepository voucherUsageRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private InventoryService inventoryService;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private AddressRepository addressRepository;

    @Autowired
    private AuthService authService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    @Test
    @DisplayName("P0: Chặn hạ cấp và tự đổi vai trò của Quản trị viên tối cao (SUPER_ADMIN)")
    void testSuperAdminInviolabilityAndSelfRoleModification() {
        User superAdmin = userRepository.findByEmail("admin@peaksneaker.com")
                .orElseGet(() -> userRepository.findAll().stream()
                        .filter(u -> u.getRole() == Role.ROLE_SUPER_ADMIN || u.getRole() == Role.SUPER_ADMIN)
                        .findFirst()
                        .orElseThrow());

        StaffProfile profile = staffProfileRepository.findByUserId(superAdmin.getId())
                .orElseGet(() -> staffProfileRepository.save(StaffProfile.builder()
                        .user(superAdmin)
                        .department("IT")
                        .positionTitle("Super Admin")
                        .staffStatus("ACTIVE")
                        .build()));

        // 1. Thử hạ quyền Super Admin sang SALES -> Phải ném ngoại lệ
        UpdateStaffRoleRequest demoteRequest = new UpdateStaffRoleRequest();
        demoteRequest.setRole("ROLE_SALES");

        assertThrows(BadRequestException.class, () ->
                staffService.updateStaffRole(profile.getId(), demoteRequest, "other_admin@peaksneaker.com"));

        // 2. Thử tự khóa tài khoản chính mình -> Phải ném ngoại lệ
        assertThrows(BadRequestException.class, () ->
                staffService.updateStaffStatus(profile.getId(), "SUSPENDED", superAdmin.getEmail()));
    }

    @Autowired
    private ProductRepository productRepository;

    @Test
    @DisplayName("P1: Tạo đơn đặt hàng tự động khấu trừ lô hàng FIFO và hoàn trả lô khi hủy đơn")
    void testOrderBatchFifoDeductionAndRestorationOnCancel() {
        Product product = productRepository.findAll().stream().findFirst().orElseThrow();
        ProductVariant variant = productVariantRepository.save(ProductVariant.builder()
                .product(product)
                .sku("SKU-FIFO-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase())
                .color("Đen")
                .size("42")
                .stockQuantity(20)
                .priceAdjustment(BigDecimal.ZERO)
                .build());

        // Tạo 1 lô hàng duy nhất cho biến thể này
        String batchCode = "BATCH-TEST-" + UUID.randomUUID().toString().substring(0, 8);
        InventoryBatch batch = inventoryBatchRepository.save(InventoryBatch.builder()
                .variant(variant)
                .batchCode(batchCode)
                .supplierName("Nhà phân phối Nike VN")
                .quantityImported(20)
                .quantityRemaining(20)
                .unitCost(BigDecimal.valueOf(1_500_000))
                .isQuarantined(false)
                .receivedDate(Instant.now().minus(2, ChronoUnit.DAYS))
                .build());

        int initialBatchRemaining = batch.getQuantityRemaining();

        // Admin tạo đơn hộ mua 3 sản phẩm
        AdminCreateOrderRequest request = new AdminCreateOrderRequest();
        request.setShippingName("Khách Hàng Test FIFO");
        request.setShippingPhone("0988776655");
        request.setShippingProvince("Thành phố Hồ Chí Minh");
        request.setShippingDistrict("Quận 1");
        request.setShippingDistrictId(1442);
        request.setShippingWard("Bến Nghé");
        request.setShippingWardCode("20101");
        request.setShippingStreet("123 Lê Lợi");
        request.setPaymentMethod(PaymentMethod.COD);

        AdminCreateOrderRequest.OrderItemInput itemInput = new AdminCreateOrderRequest.OrderItemInput();
        itemInput.setVariantId(variant.getId());
        itemInput.setQuantity(3);
        request.setItems(List.of(itemInput));

        OrderResponse createdOrder = orderService.createOrderAdmin(request);
        assertNotNull(createdOrder);

        // Kiểm tra lô hàng đã bị trừ 3 đơn vị
        InventoryBatch batchAfterOrder = inventoryBatchRepository.findById(batch.getId()).orElseThrow();
        assertEquals(initialBatchRemaining - 3, batchAfterOrder.getQuantityRemaining());

        // Hủy đơn hàng và kiểm tra hoàn lại số lượng lô
        OrderResponse cancelledOrder = orderService.updateOrderStatusAdmin(createdOrder.getId(), OrderStatus.CANCELLED);
        assertEquals(OrderStatus.CANCELLED, cancelledOrder.getStatus());

        InventoryBatch batchAfterCancel = inventoryBatchRepository.findById(batch.getId()).orElseThrow();
        assertEquals(initialBatchRemaining, batchAfterCancel.getQuantityRemaining());
    }

    @Test
    @DisplayName("P1: Kiểm soát hạn ngạch mỗi khách (perUserLimit) và lưu vết voucher_usages")
    void testVoucherUsageTrackingAndPerUserLimit() {
        User customer = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.USER || u.getRole() == Role.ROLE_CUSTOMER)
                .findFirst()
                .orElseThrow();

        // Tạo voucher có perUserLimit = 1
        String code = "VOUCHER-LIMIT-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        Voucher voucher = voucherRepository.save(Voucher.builder()
                .code(code)
                .name("Voucher Test 1 Lượt")
                .discountType(DiscountType.FIXED_AMOUNT)
                .discountValue(BigDecimal.valueOf(50_000))
                .minOrderAmount(BigDecimal.valueOf(100_000))
                .usageLimit(100)
                .usedCount(0)
                .perUserLimit(1)
                .isActive(true)
                .startAt(Instant.now().minus(1, ChronoUnit.DAYS))
                .expireAt(Instant.now().plus(10, ChronoUnit.DAYS))
                .applicationScope(VoucherApplicationScope.ALL_PRODUCTS)
                .applicationChannel(VoucherChannel.WEB)
                .build());

        ProductVariant variant = productVariantRepository.findAll().stream()
                .filter(v -> v.getStockQuantity() != null && v.getStockQuantity() >= 5)
                .findFirst()
                .orElseThrow();

        // Đơn thứ nhất dùng voucher -> Thành công
        AdminCreateOrderRequest request1 = new AdminCreateOrderRequest();
        request1.setUserId(customer.getId());
        request1.setVoucherCode(voucher.getCode());
        request1.setShippingName(customer.getFullname());
        request1.setShippingPhone("0912345678");
        request1.setShippingProvince("TP.HCM");
        request1.setShippingDistrict("Quận 1");
        request1.setShippingDistrictId(1442);
        request1.setShippingWard("Bến Nghé");
        request1.setShippingWardCode("20101");
        request1.setShippingStreet("456 Nguyễn Huệ");
        request1.setPaymentMethod(PaymentMethod.COD);

        AdminCreateOrderRequest.OrderItemInput itemInput = new AdminCreateOrderRequest.OrderItemInput();
        itemInput.setVariantId(variant.getId());
        itemInput.setQuantity(1);
        request1.setItems(List.of(itemInput));

        OrderResponse order1 = orderService.createOrderAdmin(request1);
        assertNotNull(order1);

        // Bản ghi voucher_usages phải có 1 dòng
        long usageCount = voucherUsageRepository.countByVoucherIdAndUserId(voucher.getId(), customer.getId());
        assertEquals(1, usageCount);

        // Đơn thứ hai cùng khách dùng lại voucher đó -> Phải ném ngoại lệ vì vượt perUserLimit = 1
        AdminCreateOrderRequest request2 = new AdminCreateOrderRequest();
        request2.setUserId(customer.getId());
        request2.setVoucherCode(voucher.getCode());
        request2.setShippingName(customer.getFullname());
        request2.setShippingPhone("0912345678");
        request2.setShippingProvince("TP.HCM");
        request2.setShippingDistrict("Quận 1");
        request2.setShippingDistrictId(1442);
        request2.setShippingWard("Bến Nghé");
        request2.setShippingWardCode("20101");
        request2.setShippingStreet("456 Nguyễn Huệ");
        request2.setPaymentMethod(PaymentMethod.COD);
        request2.setItems(List.of(itemInput));

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                orderService.createOrderAdmin(request2));
        assertTrue(ex.getMessage().contains("lượt"));
    }

    @Test
    @DisplayName("P1: Tự động hủy đơn hàng VNPay quá hạn 15 phút (cancelExpiredPendingOrders)")
    void testCancelExpiredPendingOrders() {
        ProductVariant variant = productVariantRepository.findAll().stream()
                .filter(v -> v.getStockQuantity() != null && v.getStockQuantity() >= 5)
                .findFirst()
                .orElseThrow();

        // Giả lập 1 đơn hàng PENDING cách đây 20 phút
        Order expiredOrder = Order.builder()
                .orderCode("PS-EXPIRED-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .checkoutKey("EXPIRED-KEY-" + UUID.randomUUID().toString().substring(0, 8))
                .status(OrderStatus.PENDING)
                .paymentMethod(PaymentMethod.VNPAY)
                .paymentStatus(PaymentStatus.PENDING)
                .shippingName("Khách Quá Hạn")
                .shippingPhone("0909090909")
                .shippingProvince("TP.HCM")
                .shippingDistrict("Quận 3")
                .shippingWard("Phường 1")
                .shippingStreet("789 CMT8")
                .subtotalAmount(BigDecimal.valueOf(1_000_000))
                .discountAmount(BigDecimal.ZERO)
                .shippingFee(BigDecimal.ZERO)
                .finalAmount(BigDecimal.valueOf(1_000_000))
                .createdAt(Instant.now().minus(20, ChronoUnit.MINUTES))
                .build();

        OrderItem item = OrderItem.builder()
                .order(expiredOrder)
                .productVariant(variant)
                .productName("Giày Test")
                .sku(variant.getSku())
                .variantName("Đen 42")
                .quantity(2)
                .unitPrice(BigDecimal.valueOf(500_000))
                .subtotal(BigDecimal.valueOf(1_000_000))
                .build();
        expiredOrder.addItem(item);
        orderRepository.save(expiredOrder);

        // Chạy tiến trình quét hủy đơn quá hạn
        int cancelledCount = orderService.cancelExpiredPendingOrders();
        assertTrue(cancelledCount >= 1);

        Order reloaded = orderRepository.findById(expiredOrder.getId()).orElseThrow();
        assertEquals(OrderStatus.CANCELLED, reloaded.getStatus());
        assertTrue(reloaded.getCancelReason().contains("15 phút"));
    }

    @Test
    @DisplayName("P0: Cart Checkout khấu trừ lô FIFO và Phong tỏa lô hàng (Quarantine) đồng bộ tồn kho biến thể")
    void testCartCheckoutDeductsFifoAndQuarantineSyncsVariantStock() {
        Product product = productRepository.findAll().stream().findFirst().orElseThrow();
        ProductVariant variant = productVariantRepository.save(ProductVariant.builder()
                .product(product)
                .sku("SKU-CART-FIFO-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase())
                .color("Trắng")
                .size("41")
                .stockQuantity(15)
                .priceAdjustment(BigDecimal.ZERO)
                .build());

        InventoryBatch batch = inventoryBatchRepository.save(InventoryBatch.builder()
                .variant(variant)
                .batchCode("BATCH-CART-" + UUID.randomUUID().toString().substring(0, 8))
                .supplierName("Adidas VN")
                .quantityImported(15)
                .quantityRemaining(15)
                .unitCost(BigDecimal.valueOf(1_200_000))
                .isQuarantined(false)
                .receivedDate(Instant.now().minus(1, ChronoUnit.DAYS))
                .build());

        User customer = userRepository.findAll().stream()
                .filter(u -> Boolean.TRUE.equals(u.getIsActive()) && Boolean.TRUE.equals(u.getIsVerified()))
                .findFirst()
                .orElseThrow();

        Address address = addressRepository.save(Address.builder()
                .user(customer)
                .recipientName("Khách Test Giỏ Hàng")
                .phone("0911223344")
                .provinceId(202)
                .provinceName("TP. Hồ Chí Minh")
                .districtId(1442)
                .districtName("Quận 1")
                .wardCode("20101")
                .wardName("Phường Bến Nghé")
                .streetDetail("100 Đồng Khởi")
                .isDefault(false)
                .build());

        Cart cart = cartRepository.findByUser(customer).orElseGet(() -> cartRepository.save(Cart.builder()
                .user(customer)
                .build()));
        cart.clear();
        cart.addItem(variant, 4);
        cartRepository.save(cart);

        CheckoutRequest checkoutReq = new CheckoutRequest();
        checkoutReq.setIdempotencyKey("CART-KEY-" + UUID.randomUUID().toString().substring(0, 12));
        checkoutReq.setAddressId(address.getId());
        checkoutReq.setPaymentMethod(PaymentMethod.COD);

        Order order = orderService.checkout(customer.getId(), checkoutReq);
        assertNotNull(order.getId());

        // 1. Kiểm tra cả tồn kho biến thể và tồn kho lô FIFO đều giảm 4 (từ 15 còn 11)
        ProductVariant variantAfterCheckout = productVariantRepository.findById(variant.getId()).orElseThrow();
        InventoryBatch batchAfterCheckout = inventoryBatchRepository.findById(batch.getId()).orElseThrow();
        assertEquals(11, variantAfterCheckout.getStockQuantity());
        assertEquals(11, batchAfterCheckout.getQuantityRemaining());

        // 2. Phong tỏa lô hàng (Quarantine = true) -> Tồn khả dụng của biến thể phải giảm đi 11 (còn 0)
        BatchResponse quarantined = inventoryService.toggleQuarantine(batch.getId(), true, "Keo đế lỗi hàng loạt", "ADMIN");
        assertTrue(quarantined.getIsQuarantined());
        ProductVariant variantAfterQuarantine = productVariantRepository.findById(variant.getId()).orElseThrow();
        assertEquals(0, variantAfterQuarantine.getStockQuantity());

        // 3. Giải phóng phong tỏa (Quarantine = false) -> Tồn khả dụng của biến thể phục hồi về 11
        BatchResponse unquarantined = inventoryService.toggleQuarantine(batch.getId(), false, "Đã kiểm định lại đạt chuẩn", "ADMIN");
        assertFalse(unquarantined.getIsQuarantined());
        ProductVariant variantAfterRelease = productVariantRepository.findById(variant.getId()).orElseThrow();
        assertEquals(11, variantAfterRelease.getStockQuantity());
    }

    @Test
    @DisplayName("P0: Chặn đăng nhập khi chưa xác thực OTP và đồng bộ quyền tùy biến user_permissions vào Spring Security")
    void testUnverifiedLoginBlockedAndCustomPermissionsSyncedToSecurity() {
        String email = "unverified_" + UUID.randomUUID().toString().substring(0, 6) + "@peaksneaker.com";
        User unverifiedUser = userRepository.save(User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode("ValidPass@123"))
                .firstName("Chưa")
                .lastName("Xác Thực")
                .phone("09" + String.format("%08d", Math.abs(UUID.randomUUID().hashCode()) % 100000000))
                .role(Role.USER)
                .isActive(true)
                .isVerified(false)
                .build());

        LoginRequest loginReq = new LoginRequest();
        loginReq.setEmail(email);
        loginReq.setPassword("ValidPass@123");

        // Chưa verify OTP -> Phải chặn đăng nhập
        assertThrows(BadRequestException.class, () -> authService.login(loginReq));

        // Sau khi kích hoạt OTP -> Đăng nhập thành công
        unverifiedUser.setIsVerified(true);
        userRepository.save(unverifiedUser);
        var loginRes = authService.login(loginReq);
        assertNotNull(loginRes.getToken());

        // Kiểm tra nhân viên được cấp quyền tùy biến qua StaffService có hiệu lực trong UserDetailsServiceImpl
        StaffProfile staffProfile = staffProfileRepository.findAll().stream()
                .filter(sp -> sp.getUser() != null && sp.getUser().getRole() == Role.ROLE_WAREHOUSE)
                .findFirst()
                .orElseThrow();

        UpdateStaffPermissionsRequest permReq = new UpdateStaffPermissionsRequest();
        permReq.setPermissions(List.of("PROMOTION_MANAGE", "INVENTORY_VIEW"));
        staffService.updateStaffPermissions(staffProfile.getId(), permReq, "admin@peaksneaker.com");

        UserDetails loadedDetails = userDetailsService.loadUserByUsername(staffProfile.getUser().getEmail());
        List<String> authorities = loadedDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .toList();
        assertTrue(authorities.contains("PROMOTION_MANAGE"));
    }
}
