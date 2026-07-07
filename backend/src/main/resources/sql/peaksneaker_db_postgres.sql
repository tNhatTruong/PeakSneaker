-- ==============================================================================
-- POSTGRESQL INIT SCRIPT
-- Date: 08/07/2026
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. XÓA CÁC BẢNG NẾU TỒN TẠI (Kèm CASCADE để không lỗi khóa ngoại)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS user_vouchers CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS inventory_transactions CASCADE;
DROP TABLE IF EXISTS images CASCADE;
DROP TABLE IF EXISTS addresses CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS carts CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS silhouettes CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS brands CASCADE;

-- Tạo tạm các bảng gốc bị thiếu trong file dump để tránh lỗi khóa ngoại 
CREATE TABLE IF NOT EXISTS users (id BIGSERIAL PRIMARY KEY);
CREATE TABLE IF NOT EXISTS vouchers (id BIGSERIAL PRIMARY KEY);

-- ------------------------------------------------------------------------------
-- 2. TẠO BẢNG & THÊM DỮ LIỆU (Thứ tự từ gốc đến ngọn)
-- ------------------------------------------------------------------------------

-- BRAND
CREATE TABLE brands (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    logo_url VARCHAR(500) DEFAULT NULL,
    is_deleted BOOLEAN DEFAULT NULL
);

INSERT INTO brands (id, name, description, logo_url, is_deleted) VALUES 
(1, 'Nike', 'Những thiết kế kinh điển kết hợp với sự đổi mới không ngừng, mang đến phong cách thể thao hiện đại và đẳng cấp.', 'nike.jpg', false),
(2, 'Adidas', 'Sự giao thoa hoàn hảo giữa thể thao chuyên nghiệp và thời trang đường phố.', 'adidas.jpg', false),
(3, 'Vans', 'Phong cách streetwear và skateboarding trẻ trung, cá tính.', 'vans.jpg', false),
(4, 'Converse', 'Biểu tượng thời trang thể thao cổ điển với thiết kế canvas vượt thời gian.', 'converse.jpg', false),
(5, 'Puma', 'Sự kết hợp giữa công nghệ thể thao và phong cách hiện đại, mạnh mẽ.', 'puma.jpg', false);

-- CATEGORY
CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id BIGINT DEFAULT NULL,
    CONSTRAINT FK_cat_parent FOREIGN KEY (parent_id) REFERENCES categories (id) ON DELETE RESTRICT ON UPDATE RESTRICT
);

INSERT INTO categories (id, name, slug, description, parent_id) VALUES 
(1, 'Giày Sneker', 'giay-sneaker', 'Bộ sưu tập giày thể thao dành cho nam', NULL),
(3, 'Phụ Kiện', 'phu-kien', 'Tất, dây giày, bình nước, balo...', NULL);

-- SILHOUETTE
CREATE TABLE silhouettes (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    image_url VARCHAR(255) DEFAULT NULL,
    brand_id BIGINT NOT NULL,
    is_deleted BOOLEAN NOT NULL,
    CONSTRAINT FK_sil_brand FOREIGN KEY (brand_id) REFERENCES brands (id) ON DELETE RESTRICT ON UPDATE RESTRICT
);

INSERT INTO silhouettes (id, name, image_url, brand_id, is_deleted) VALUES 
(1, 'Air Force 1', 'air-force-1.jpeg', 1, false),
(2, 'Air Zoom Pegasus 40', 'air-zoom-pegasus.jpeg', 1, false),
(3, 'Stan Smith', 'stan-smith.webp', 2, false),
(4, 'Ultraboost Light', 'ultraboost-light.webp', 2, false),
(5, 'Vans Old Skool', 'vans-old-skool.jpg', 3, false),
(6, 'Vans Slip-On Checkerboard', 'converse-run-star-hike.webp', 3, false),
(7, 'Converse Chuck Taylor All Star', 'converse-chuck-taylor-all-star.jpg', 4, false),
(8, 'Converse Run Star Hike', 'converse-run-star-hike.webp', 4, false),
(9, 'Puma Suede Classic', 'puma-suede-classic.webp', 5, false),
(10, 'Puma RS-X Toys', 'puma-rs-x-toys.jpeg', 5, false),
(11, 'Adidas Socks', 'adidas-socks.jpg', 2, false);

-- PRODUCT
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    attribute JSONB NULL,
    gender VARCHAR(50) DEFAULT NULL,
    product_type VARCHAR(50) NOT NULL,
    base_price NUMERIC(12, 2) NOT NULL,
    discount_percent NUMERIC(5, 2) DEFAULT NULL,
    price NUMERIC(12, 2) NOT NULL,
    category_id BIGINT DEFAULT NULL,
    silhouette_id BIGINT NOT NULL,
    is_featured BOOLEAN NOT NULL,
    is_deleted BOOLEAN NOT NULL,
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT FK_p_cat FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT FK_p_sil FOREIGN KEY (silhouette_id) REFERENCES silhouettes (id) ON DELETE RESTRICT ON UPDATE RESTRICT
);

INSERT INTO products (id, name, description, attribute, gender, product_type, base_price, discount_percent, price, category_id, silhouette_id, is_featured, is_deleted, created_at) VALUES 
(1, 'Nike Air Force 1 07', 'Giày sneaker cổ điển form dáng huyền thoại', '{"phong_cách": "Phong cách thường ngày năng động, phù hợp nhiều hoàn cảnh sử dụng", "chất_liệu": "Da tổng hợp cao cấp mềm mại, bền đẹp và dễ vệ sinh"}', 'UNISEX', 'SNEAKER', 2800000.00, 12.00, 2464000.00, 1, 1, false, false, '2026-06-25 02:30:36.000000'),
(2, 'Nike Air Zoom Pegasus 40', 'Giày chạy bộ êm ái, thoáng khí.', '{"phong_cách": "Phong cách thể thao chạy bộ, tối ưu cho vận động và tập luyện", "chất_liệu": "Vải lưới thoáng khí nhẹ nhàng, hỗ trợ lưu thông không khí tốt"}', 'MEN', 'SNEAKER', 3500000.00, 0.10, 3150000.00, 1, 2, false, false, '2026-06-25 02:30:36.000000'),
(3, 'Adidas Stan Smith', 'Giày tennis phong cách tối giản.', '{"phong_cách": "Phong cách thường ngày hiện đại, dễ phối với many loại trang phục", "chất_liệu": "Da thuần chay thân thiện với môi trường, mềm mại và bền bỉ"}', 'UNISEX', 'SNEAKER', 2600000.00, 0.00, 2600000.00, 1, 3, false, false, '2026-06-25 02:30:36.000000'),
(4, 'Adidas Ultraboost Light', 'Giày chạy bộ công nghệ đệm Boost nhẹ nhất.', '{"phong_cách": "Phong cách chạy bộ chuyên dụng, mang lại cảm giác nhẹ và thoải mái", "chất_liệu": "Vải dệt Primeknit co giãn linh hoạt, ôm chân và thoáng khí"}', 'WOMEN', 'SNEAKER', 5000000.00, 0.20, 4000000.00, 1, 4, false, false, '2026-06-25 02:30:36.000000'),
(5, 'Vans Old Skool', 'Giày trượt ván mũi lộn, sọc jazz kinh điển.', '{"phong_cách": "Phong cách trượt ván cá tính, phù hợp với giới trẻ năng động", "chất_liệu": "Sự kết hợp giữa vải canvas và da lộn, tạo độ bền và tính thẩm mỹ cao"}', 'UNISEX', 'SNEAKER', 1900000.00, 0.10, 1710000.00, 1, 5, false, false, '2026-06-25 02:30:36.000000'),
(6, 'Vans Slip-On Checkerboard', 'Giày lười họa tiết caro.', '{"phong_cách": "Phong cách thường ngày trẻ trung, phù hợp cho các hoạt động hằng ngày", "chất_liệu": "Vải canvas chắc chắn, thoáng mát và dễ bảo quản"}', 'UNISEX', 'SNEAKER', 1700000.00, 0.10, 1530000.00, 1, 6, false, false, '2026-06-25 02:30:36.000000'),
(7, 'Converse Chuck Taylor All Star', 'Giày cổ cao vải canvas truyền thống.', '{"phong_cách": "Phong cách thường ngày đơn giản, dễ dàng phối hợp với many trang phục", "chất_liệu": "Vải canvas bền bỉ với khả năng chống mài mòn tốt"}', 'UNISEX', 'SNEAKER', 1500000.00, 0.00, 1500000.00, 1, 7, false, false, '2026-06-25 02:30:36.000000'),
(8, 'Converse Run Star Hike', 'Giày đế độn phong cách cá tính.', '{"phong_cách": "Phong cách đế dày thời trang, tạo điểm nhấn nổi bật và cá tính", "chất_liệu": "Vải canvas chất lượng cao, mang lại cảm giác thoải mái khi sử dụng"}', 'WOMEN', 'SNEAKER', 2800000.00, 0.10, 2520000.00, 1, 8, false, false, '2026-06-25 02:30:36.000000'),
(9, 'Puma Suede Classic', 'Giày da lộn phong cách retro.', '{"phong_cách": "Phong cách thường ngày thanh lịch, phù hợp cho nhiều dịp khác nhau", "chất_liệu": "Da lộn mềm mại với bề mặt sang trọng và tinh tế"}', 'MEN', 'SNEAKER', 2200000.00, 0.00, 2200000.00, 1, 9, false, false, '2026-06-25 02:30:36.000000'),
(10, 'Puma RS-X Toys', 'Giày sneaker phom dáng chunky hầm hố.', '{"phong_cách": "Phong cách đế dày hiện đại, mang lại vẻ ngoài nổi bật và thời thượng", "chất_liệu": "Kết hợp giữa vải lưới thoáng khí và da bền chắc, tăng độ ổn định khi mang"}', 'UNISEX', 'SNEAKER', 3000000.00, 0.30, 2100000.00, 1, 10, true, false, '2026-06-25 02:30:36.000000'),
(12, 'Tất Nike Sportswear Dri-FIT', 'Tất Nike Sportswear Dri-FIT là một lựa chọn tuyệt vời cho những ai tìm kiếm sự thoải mái và hiệu suất trong việc luyện tập thể thao hoặc sử dụng hàng ngày.', NULL, 'UNISEX', 'ACCESSORY', 490000.00, 0.00, 490000.00, 3, 11, false, false, '2026-07-07 18:08:16.201814');

-- PRODUCT VARIANT
CREATE TABLE product_variants (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL,
    sku VARCHAR(100) NOT NULL,
    color VARCHAR(100) DEFAULT NULL,
    size VARCHAR(50) DEFAULT NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    price_adjustment NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT UK_variant_sku UNIQUE (sku),
    CONSTRAINT FK_variant_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE RESTRICT ON UPDATE RESTRICT
);

INSERT INTO product_variants (id, product_id, sku, color, size, stock_quantity, price_adjustment, created_at, updated_at) VALUES 
(1, 1, 'P1-WH-40', 'Trắng', '40', 48, 0.00, '2026-06-25 02:33:58.000000', '2026-06-25 02:33:58.000000'),
(2, 1, 'P1-WH-41', 'Trắng', '41', 45, 0.00, '2026-06-25 02:33:58.000000', '2026-06-25 02:33:58.000000'),
(3, 1, 'P1-BK-40', 'Đen', '40', 20, 0.00, '2026-06-25 02:33:58.000000', '2026-06-25 02:33:58.000000'),
(4, 2, 'P2-BW-42', 'Đen/Trắng', '42', 25, 0.00, '2026-06-25 02:33:58.000000', '2026-07-03 10:33:48.600262'),
(5, 2, 'P2-BW-43', 'Đen/Trắng', '43', 25, 0.00, '2026-06-25 02:33:58.000000', '2026-06-25 02:33:58.000000'),
(6, 2, 'P2-BL-42', 'Xanh dương', '42', 15, 0.00, '2026-06-25 02:33:58.000000', '2026-06-25 02:33:58.000000'),
(7, 3, 'P3-WG-39', 'Trắng/Xanh lá', '39', 40, 0.00, '2026-06-25 02:33:58.000000', '2026-06-25 02:33:58.000000'),
(8, 3, 'P3-WG-40', 'Trắng/Xanh lá', '40', 63, 0.00, '2026-06-25 02:33:58.000000', '2026-06-25 02:33:58.000000'),
(9, 3, 'P3-WN-39', 'Trắng/Xanh navy', '39', 20, 0.00, '2026-06-25 02:33:58.000000', '2026-06-25 02:33:58.000000'),
(10, 4, 'P4-CB-37', 'Đen tuyền', '37', 15, 0.00, '2026-06-25 02:33:58.000000', '2026-06-25 02:33:58.000000'),
(11, 4, 'P4-CB-38', 'Đen tuyền', '38', 20, 0.00, '2026-06-25 02:33:58.000000', '2026-06-25 02:33:58.000000'),
(12, 4, 'P4-CW-38', 'Trắng mây', '38', 10, 0.00, '2026-06-25 02:33:58.000000', '2026-06-25 02:33:58.000000'),
(13, 5, 'P5-BW-40', 'Đen/Trắng', '40', 100, 0.00, '2026-06-25 02:33:58.000000', '2026-06-25 02:33:58.000000'),
(14, 5, 'P5-BW-41', 'Đen/Trắng', '41', 120, 0.00, '2026-06-25 02:33:58.000000', '2026-06-25 02:33:58.000000'),
(15, 5, 'P5-NV-40', 'Xanh navy', '40', 40, 0.00, '2026-06-25 02:33:58.000000', '2026-06-25 02:33:58.000000'),
(16, 6, 'P6-BWC-39', 'Caro Đen/Trắng', '39', 55, 0.00, '2026-06-25 02:33:58.000000', '2026-06-25 02:33:58.000000'),
(17, 6, 'P6-BWC-40', 'Caro Đen/Trắng', '40', 65, 0.00, '2026-06-25 02:33:58.000000', '2026-06-25 02:33:58.000000'),
(18, 6, 'P6-RC-39', 'Caro Đỏ', '39', 15, 0.00, '2026-06-25 02:33:58.000000', '2026-06-25 02:33:58.000000'),
(19, 7, 'P7-BK-41', 'Đen', '41', 80, 0.00, '2026-06-25 02:33:58.000000', '2026-06-25 02:33:58.000000'),
(20, 7, 'P7-BK-42', 'Đen', '42', 75, 0.00, '2026-06-25 02:33:58.000000', '2026-06-25 02:33:58.000000'),
(21, 7, 'P7-OW-41', 'Trắng', '41', 50, 0.00, '2026-06-25 02:33:58.000000', '2026-06-25 02:33:58.000000'),
(22, 8, 'P8-BK-36', 'Đen', '36', 30, 0.00, '2026-06-25 02:33:58.000000', '2026-06-25 02:33:58.000000'),
(23, 8, 'P8-BK-37', 'Đen', '37', 45, 0.00, '2026-06-25 02:33:58.000000', '2026-06-25 02:33:58.000000'),
(24, 8, 'P8-WH-37', 'Trắng', '37', 25, 0.00, '2026-06-25 02:33:58.000000', '2026-06-25 02:33:58.000000'),
(25, 9, 'P9-BW-42', 'Đen/Trắng', '42', 20, 0.00, '2026-06-25 02:33:58.000000', '2026-06-25 02:33:58.000000'),
(26, 9, 'P9-BW-43', 'Đen/Trắng', '43', 15, 0.00, '2026-06-25 02:33:58.000000', '2026-06-25 02:33:58.000000'),
(27, 9, 'P9-RW-42', 'Đỏ/Trắng', '42', 10, 0.00, '2026-06-25 02:33:58.000000', '2026-06-25 02:33:58.000000'),
(28, 10, 'P10-MC-40', 'Đa màu', '40', 35, 0.00, '2026-06-25 02:33:58.000000', '2026-06-25 02:33:58.000000'),
(29, 10, 'P10-MC-41', 'Đa màu', '41', 40, 0.00, '2026-06-25 02:33:58.000000', '2026-06-25 02:33:58.000000'),
(30, 10, 'P10-BR-41', 'Đen/Đỏ', '41', 20, 0.00, '2026-06-25 02:33:58.000000', '2026-06-25 02:33:58.000000'),
(35, 12, 'ADD-SOCK-HIGH-BLACK', 'Đen', '10', 5, 0.00, '2026-07-07 18:09:15.208003', '2026-07-07 18:09:27.921162');

-- CARTS
CREATE TABLE carts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    CONSTRAINT UK_cart_user UNIQUE (user_id),
    CONSTRAINT FK_cart_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT ON UPDATE RESTRICT
);

INSERT INTO carts (id, user_id) VALUES (1, 1);

-- ORDERS
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT DEFAULT NULL,
    voucher_id BIGINT DEFAULT NULL,
    subtotal_amount NUMERIC(12, 2) NOT NULL,
    discount_amount NUMERIC(12, 2) NOT NULL,
    shipping_fee NUMERIC(12, 2) NOT NULL,
    final_amount NUMERIC(12, 2) NOT NULL,
    shipping_name VARCHAR(255) NOT NULL,
    shipping_phone VARCHAR(50) NOT NULL,
    shipping_province VARCHAR(100) NOT NULL,
    shipping_district VARCHAR(100) NOT NULL,
    shipping_ward VARCHAR(100) NOT NULL,
    shipping_street TEXT NOT NULL,
    note TEXT,
    status VARCHAR(50) NOT NULL,
    payment_status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT FK_order_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT FK_order_voucher FOREIGN KEY (voucher_id) REFERENCES vouchers (id) ON DELETE RESTRICT ON UPDATE RESTRICT
);

INSERT INTO orders (id, user_id, voucher_id, subtotal_amount, discount_amount, shipping_fee, final_amount, shipping_name, shipping_phone, shipping_province, shipping_district, shipping_ward, shipping_street, note, status, payment_status, created_at, updated_at) VALUES 
(1, 1, NULL, 5000000.00, 0.00, 30000.00, 5030000.00, 'Hinh', '0866501455', 'Phú Yên', 'Huyện Sông Hinh', 'Xã Ea Bá', 'ap 5', 'can than', 'PENDING', 'PENDING', '2026-07-02 13:13:21.769011', '2026-07-02 13:13:21.775879'),
(2, 1, NULL, 3500000.00, 0.00, 30000.00, 3530000.00, 'Hinh', '0866501455', 'Phú Yên', 'Huyện Sơn Hòa', 'Xã Sơn Hà', 'ap 5', 'can than', 'SHIPPING', 'PENDING', '2026-07-02 13:13:59.598953', '2026-07-02 17:32:58.263628');

-- ADDRESSES
CREATE TABLE addresses (
    id BIGSERIAL PRIMARY KEY,
    is_default BOOLEAN NOT NULL,
    user_id BIGINT NOT NULL,
    phone VARCHAR(20) NOT NULL,
    district_id VARCHAR(50) NOT NULL,
    province_id VARCHAR(50) NOT NULL,
    ward_id VARCHAR(50) NOT NULL,
    district_name VARCHAR(100) NOT NULL,
    province_name VARCHAR(100) NOT NULL,
    ward_name VARCHAR(100) NOT NULL,
    recipient_name VARCHAR(100) NOT NULL,
    street_detail TEXT DEFAULT NULL,
    CONSTRAINT FK_addr_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT ON UPDATE RESTRICT
);

INSERT INTO addresses (id, is_default, user_id, phone, district_id, province_id, ward_id, district_name, province_name, ward_name, recipient_name, street_detail) VALUES 
(1, false, 1, '086501452', '1778', '258', '471006', 'Thị xã La Gi', 'Bình Thuận', 'Xã Tân Bình', 'Nguyễn Thiết Hinh', 'Ấp 6'),
(2, false, 1, '086501452', '1778', '258', '471006', 'Thị xã La Gi', 'Bình Thuận', 'Xã Tân Bình', 'Nguyễn Thiết Hinh', 'Ấp 6'),
(3, false, 1, '086501452', '1778', '258', '471006', 'Thị xã La Gi', 'Bình Thuận', 'Xã Tân Bình', 'Nguyễn Thiết Hinh', 'Ấp 6'),
(4, false, 1, '086501452', '1778', '258', '471006', 'Thị xã La Gi', 'Bình Thuận', 'Xã Tân Bình', 'Nguyễn Thiết Hinh', 'Ấp 6'),
(5, false, 1, '086501452', '1778', '258', '471006', 'Thị xã La Gi', 'Bình Thuận', 'Xã Tân Bình', 'Nguyễn Thiết Hinh', 'Ấp 6'),
(6, false, 1, '086501452', '1778', '258', '471006', 'Thị xã La Gi', 'Bình Thuận', 'Xã Tân Bình', 'Nguyễn Thiết Hinh', 'Ấp 6'),
(7, false, 1, '0866501452', '1779', '258', '470704', 'Huyện Đức Linh', 'Bình Thuận', 'Xã Đông Hà', 'Hinh', 'ap 5'),
(9, true, 1, '0866501455', '2211', '260', '390507', 'Huyện Sơn Hòa', 'Phú Yên', 'Xã Sơn Hà', 'Hinh', 'ap 5');

-- IMAGES
CREATE TABLE images (
    id BIGSERIAL PRIMARY KEY,
    image_name VARCHAR(500) NOT NULL,
    is_primary BOOLEAN NOT NULL,
    product_id BIGINT NOT NULL,
    product_variant_id BIGINT DEFAULT NULL,
    CONSTRAINT FK_image_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT FK_image_variant FOREIGN KEY (product_variant_id) REFERENCES product_variants (id) ON DELETE RESTRICT ON UPDATE RESTRICT
);

INSERT INTO images (id, image_name, is_primary, product_id, product_variant_id) VALUES 
(1, 'af1_white.jpg', true, 1, 1),
(2, 'af1_white.jpg', false, 1, 2),
(3, 'af1_black.jpg', false, 1, 3),
(4, 'pegasus_black_white.jpg', true, 2, 4),
(5, 'pegasus_black_white.jpg', false, 2, 5),
(6, 'pegasus_blue.jpg', false, 2, 6),
(7, 'stansmith_white_green.jpg', true, 3, 7),
(8, 'stansmith_white_green.jpg', false, 3, 8),
(9, 'stansmith_white_navy.jpg', false, 3, 9),
(10, 'ultraboost_black.jpg', true, 4, 10),
(11, 'ultraboost_black.jpg', false, 4, 11),
(12, 'ultraboost_white.jpg', false, 4, 12),
(13, 'oldskool_black_white.jpg', true, 5, 13),
(14, 'oldskool_black_white.jpg', false, 5, 14),
(15, 'oldskool_navy.jpg', false, 5, 15),
(16, 'slipon_checkerboard.jpg', true, 6, 16),
(17, 'slipon_checkerboard.jpg', false, 6, 17),
(18, 'slipon_red_check.jpg', false, 6, 18),
(19, 'chuck_black.jpg', true, 7, 19),
(20, 'chuck_black.jpg', false, 7, 20),
(21, 'chuck_white.jpg', false, 7, 21),
(22, 'runstar_black.jpg', true, 8, 22),
(23, 'runstar_black.jpg', false, 8, 23),
(24, 'runstar_white.jpg', false, 8, 24),
(25, 'suede_black_white.jpg', true, 9, 25),
(26, 'suede_black_white.jpg', false, 9, 26),
(27, 'suede_red_white.jpg', false, 9, 27),
(28, 'rsx_multicolor.jpg', true, 10, 28),
(29, 'rsx_multicolor.jpg', false, 10, 29),
(30, 'rsx_black_red.jpg', false, 10, 30),
(32, 'Tat-Nike-Sportswear-Dri-FIT.jpg', true, 12, NULL);

-- INVENTORY TRANSACTIONS
CREATE TABLE inventory_transactions (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL,
    note TEXT,
    quantity INT NOT NULL,
    type VARCHAR(20) NOT NULL, -- Thay cho enum('EXPORT','IMPORT')
    variant_id BIGINT NOT NULL,
    CONSTRAINT FK_inv_variant FOREIGN KEY (variant_id) REFERENCES product_variants (id) ON DELETE RESTRICT ON UPDATE RESTRICT
);

INSERT INTO inventory_transactions (id, created_at, note, quantity, type, variant_id) VALUES 
(1, '2026-07-03 10:33:48.544482', 'thêm đơn hàng tháng 7', 4, 'IMPORT', 4),
(3, '2026-07-07 18:09:27.907448', 'Nhập tất', 5, 'IMPORT', 35);

-- CART ITEMS
CREATE TABLE cart_items (
    id BIGSERIAL PRIMARY KEY,
    cart_id BIGINT NOT NULL,
    product_variant_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    CONSTRAINT UK_cart_item UNIQUE (cart_id, product_variant_id),
    CONSTRAINT FK_cart_item_cart FOREIGN KEY (cart_id) REFERENCES carts (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT FK_cart_item_variant FOREIGN KEY (product_variant_id) REFERENCES product_variants (id) ON DELETE RESTRICT ON UPDATE RESTRICT
);

-- ORDER ITEMS
CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL,
    product_variant_id BIGINT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    variant_name VARCHAR(255) DEFAULT NULL,
    sku VARCHAR(100) DEFAULT NULL,
    quantity INT NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL,
    image_url VARCHAR(255) DEFAULT NULL,
    CONSTRAINT FK_oi_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT FK_oi_variant FOREIGN KEY (product_variant_id) REFERENCES product_variants (id) ON DELETE RESTRICT ON UPDATE RESTRICT
);

INSERT INTO order_items (id, order_id, product_variant_id, product_name, variant_name, sku, quantity, unit_price, subtotal, image_url) VALUES 
(1, 1, 11, 'Adidas Ultraboost Light', 'Core Black 38', 'P4-CB-38', 1, 5000000.00, 5000000.00, NULL),
(2, 2, 4, 'Nike Air Zoom Pegasus 40', 'Black/White 42', 'P2-BW-42', 1, 3500000.00, 3500000.00, NULL);

-- PAYMENTS
CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    transaction_id VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP NOT NULL,
    paid_at TIMESTAMP DEFAULT NULL,
    CONSTRAINT FK_payment_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE RESTRICT ON UPDATE RESTRICT
);

-- REVIEWS
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    rating INT NOT NULL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT NULL,
    is_deleted BOOLEAN DEFAULT NULL,
    is_edited BOOLEAN DEFAULT NULL,
    CONSTRAINT FK_review_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT FK_review_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE RESTRICT ON UPDATE RESTRICT
);

-- USER VOUCHERS 
CREATE TABLE user_vouchers (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    voucher_id BIGINT NOT NULL,
    order_id BIGINT DEFAULT NULL,
    is_used BOOLEAN NOT NULL,
    used_at TIMESTAMP DEFAULT NULL,
    CONSTRAINT FK_uv_voucher FOREIGN KEY (voucher_id) REFERENCES vouchers (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT FK_uv_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT FK_uv_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE RESTRICT ON UPDATE RESTRICT
);

-- ------------------------------------------------------------------------------
-- 3. CẬP NHẬT LẠI SEQUENCE CHO CÁC KHÓA CHÍNH ()
-- ------------------------------------------------------------------------------
SELECT setval('addresses_id_seq', coalesce((SELECT MAX(id) FROM addresses), 1));
SELECT setval('brands_id_seq', coalesce((SELECT MAX(id) FROM brands), 1));
SELECT setval('carts_id_seq', coalesce((SELECT MAX(id) FROM carts), 1));
SELECT setval('categories_id_seq', coalesce((SELECT MAX(id) FROM categories), 1));
SELECT setval('images_id_seq', coalesce((SELECT MAX(id) FROM images), 1));
SELECT setval('inventory_transactions_id_seq', coalesce((SELECT MAX(id) FROM inventory_transactions), 1));
SELECT setval('order_items_id_seq', coalesce((SELECT MAX(id) FROM order_items), 1));
SELECT setval('orders_id_seq', coalesce((SELECT MAX(id) FROM orders), 1));
SELECT setval('product_variants_id_seq', coalesce((SELECT MAX(id) FROM product_variants), 1));
SELECT setval('products_id_seq', coalesce((SELECT MAX(id) FROM products), 1));
SELECT setval('silhouettes_id_seq', coalesce((SELECT MAX(id) FROM silhouettes), 1));