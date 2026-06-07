-- Tạo cơ sở dữ liệu trong posgres trước đã
-- lưu ý cấu hình db có user phải giống trong application.properties
-- hien tại là admin

-- chạy file trong schema public

DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS vouchers CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS carts CASCADE;
DROP TABLE IF EXISTS images CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS silhouettes CASCADE;
DROP TABLE IF EXISTS brands CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS addresses CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =========================================================
-- USERS
-- =========================================================
CREATE TABLE users
(
    id            BIGSERIAL PRIMARY KEY,
    email         varchar(255) UNIQUE NOT NULL,
    password_hash varchar(255)        NOT NULL,
    first_name    varchar(100)        NOT NULL,
    last_name     varchar(100)        NOT NULL,
    phone         varchar(20) UNIQUE,
    role          varchar(50)         NOT NULL,
    is_verified   boolean             NOT NULL,
    is_active     boolean             NOT NULL,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- ADDRESSES (Sổ địa chỉ)
-- =========================================================
CREATE TABLE addresses
(
    id             BIGSERIAL PRIMARY KEY,
    user_id        bigint         NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    recipient_name varchar(100)   NOT NULL,
    phone          varchar(20)    NOT NULL,
    province_id    varchar(50)    NOT NULL,
    province_name  varchar(100)   NOT NULL,
    district_id    varchar(50)    NOT NULL,
    district_name  varchar(100)   NOT NULL,
    ward_id        varchar(50)    NOT NULL,
    ward_name      varchar(100)   NOT NULL,
    street_detail  text           NOT NULL,
    is_default     boolean        NOT NULL DEFAULT true
);

-- =========================================================
-- CATEGORIES
-- =========================================================
CREATE TABLE categories
(
    id          BIGSERIAL PRIMARY KEY,
    parent_id   bigint              REFERENCES categories (id) ON DELETE SET NULL,
    name        varchar(255)        NOT NULL,
    slug        varchar(255) UNIQUE NOT NULL,
    description text
);

-- =========================================================
-- BRANDS
-- =========================================================
CREATE TABLE brands
(
    id          BIGSERIAL PRIMARY KEY,
    name        varchar(255) UNIQUE NOT NULL,
    logo_url    varchar(500),
    description text,
    is_deleted  boolean NOT NULL DEFAULT FALSE
);

-- =========================================================
-- SILHOUETTES
-- =========================================================
CREATE TABLE silhouettes
(
    id          BIGSERIAL PRIMARY KEY,
    name        varchar(255) NOT NULL,
    image_url   varchar(500),
    brand_id    bigint NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    is_deleted  boolean NOT NULL DEFAULT FALSE
);

-- =========================================================
-- PRODUCTS
-- =========================================================
CREATE TABLE products
(
    id           BIGSERIAL PRIMARY KEY,
    category_id  bigint         REFERENCES categories (id) ON DELETE SET NULL,
    brand_id     bigint         REFERENCES brands (id) ON DELETE SET NULL,
    silhouette_id bigint        REFERENCES silhouettes (id) ON DELETE SET NULL,
    name         varchar(255)   NOT NULL,
    description  text,
    base_price   decimal(12, 2) NOT NULL,
    gender       varchar(50),
    product_type varchar(50)    NOT NULL,
    is_featured  boolean        NOT NULL DEFAULT FALSE,
    is_deleted   boolean        NOT NULL DEFAULT FALSE,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- PRODUCT VARIANTS
-- =========================================================
CREATE TABLE product_variants
(
    id               BIGSERIAL PRIMARY KEY,
    product_id       bigint              NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    sku              varchar(100) UNIQUE NOT NULL,
    color            varchar(100),
    size             varchar(50),
    stock_quantity   integer             NOT NULL,
    price_adjustment decimal(12, 2)      NOT NULL,
    attributes       jsonb,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- IMAGES
-- =========================================================
CREATE TABLE images
(
    id                 BIGSERIAL PRIMARY KEY,
    product_id         bigint      REFERENCES products (id) ON DELETE CASCADE,
    product_variant_id bigint      REFERENCES product_variants (id) ON DELETE CASCADE,
    image_name         varchar(255),
    is_primary         boolean     NOT NULL
);

CREATE INDEX idx_images_product ON images (product_id);
CREATE INDEX idx_images_variant ON images (product_variant_id);

-- =========================================================
-- CARTS
-- =========================================================
CREATE TABLE carts
(
    id      BIGSERIAL PRIMARY KEY,
    user_id bigint UNIQUE NOT NULL REFERENCES users (id) ON DELETE CASCADE
);

-- =========================================================
-- CART ITEMS
-- =========================================================
CREATE TABLE cart_items
(
    id                 BIGSERIAL PRIMARY KEY,
    cart_id            bigint  NOT NULL REFERENCES carts (id) ON DELETE CASCADE,
    product_variant_id bigint  NOT NULL REFERENCES product_variants (id) ON DELETE CASCADE,
    quantity           integer NOT NULL,
    UNIQUE (cart_id, product_variant_id)
);

-- =========================================================
-- VOUCHERS
-- =========================================================
CREATE TABLE vouchers
(
    id                  BIGSERIAL PRIMARY KEY,
    code                varchar(50) UNIQUE NOT NULL,
    discount_type       varchar(20)        NOT NULL,
    discount_value      decimal(12, 2)     NOT NULL,
    min_order_amount    decimal(12, 2),
    max_discount_amount decimal(12, 2),
    usage_limit         integer,
    used_count          integer            NOT NULL,
    start_at            timestamptz,
    expire_at           timestamptz,
    is_active           boolean            NOT NULL,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- ORDERS
-- =========================================================
CREATE TABLE orders
(
    id               BIGSERIAL PRIMARY KEY,
    user_id          bigint         REFERENCES users (id) ON DELETE SET NULL,
    voucher_id       bigint         REFERENCES vouchers (id) ON DELETE SET NULL,
    subtotal_amount  decimal(12, 2) NOT NULL,
    discount_amount  decimal(12, 2) NOT NULL,
    shipping_fee     decimal(12, 2) NOT NULL,
    final_amount     decimal(12, 2) NOT NULL,
    status           varchar(50)    NOT NULL,
    payment_status   varchar(50)    NOT NULL,
    shipping_name    varchar(255)   NOT NULL,
    shipping_phone    varchar(50)    NOT NULL,
    shipping_province varchar(100)   NOT NULL,
    shipping_district varchar(100)   NOT NULL,
    shipping_ward     varchar(100)   NOT NULL,
    shipping_street   text           NOT NULL,
    note              text,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- ORDER ITEMS
-- =========================================================
CREATE TABLE order_items
(
    id                 BIGSERIAL PRIMARY KEY,
    order_id           bigint         NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
    product_variant_id bigint         REFERENCES product_variants (id) ON DELETE SET NULL,
    product_name       varchar(255)   NOT NULL,
    sku                varchar(100),
    variant_name       varchar(255),
    quantity           integer        NOT NULL,
    unit_price         decimal(12, 2) NOT NULL,
    subtotal           decimal(12, 2) NOT NULL
);

-- =========================================================
-- PAYMENTS
-- =========================================================
CREATE TABLE payments
(
    id             BIGSERIAL PRIMARY KEY,
    order_id       bigint         NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
    amount         decimal(12, 2) NOT NULL,
    payment_method varchar(100)   NOT NULL,
    transaction_id varchar(255),
    status         varchar(50)    NOT NULL,
    paid_at        timestamptz,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- INDEXES
-- =========================================================
CREATE INDEX idx_products_category ON products (category_id);
CREATE INDEX idx_product_variants_product ON product_variants (product_id);
CREATE INDEX idx_cart_items_cart ON cart_items (cart_id);
CREATE INDEX idx_order_items_order ON order_items (order_id);
CREATE INDEX idx_orders_user ON orders (user_id);
CREATE INDEX idx_payments_order ON payments (order_id);


-- XÓA SẠCH DỮ LIỆU CŨ TRƯỚC KHI SEED (đảm bảo id không bị rối)
TRUNCATE TABLE order_items, payments, orders, cart_items, carts, images, product_variants, products, silhouettes, brands, categories, addresses, users, vouchers RESTART IDENTITY CASCADE;

-- 1. SEED USERS (Mật khẩu mặc định: 123456 -> BCrypt: $2a$10$wZJ4e.8a8.lFv/yqR1XoZ.b6s5y6.9Qh2L.h6Qy8Pq.2V5e0h4u9e)
INSERT INTO users (email, password_hash, first_name, last_name, phone, role, is_verified, is_active)
VALUES
('admin@peaksneaker.com', '$2a$10$wZJ4e.8a8.lFv/yqR1XoZ.b6s5y6.9Qh2L.h6Qy8Pq.2V5e0h4u9e', 'Admin', 'PeakSneaker', '0901234567', 'ADMIN', true, true),
('truong@gmail.com', '$2a$10$wZJ4e.8a8.lFv/yqR1XoZ.b6s5y6.9Qh2L.h6Qy8Pq.2V5e0h4u9e', 'Nhật', 'Trường', '0912345678', 'USER', true, true),
('hinh@gmail.com', '$2a$10$wZJ4e.8a8.lFv/yqR1XoZ.b6s5y6.9Qh2L.h6Qy8Pq.2V5e0h4u9e', 'Thiết', 'Hình', '0923456789', 'USER', true, true);

-- 2. SEED ADDRESSES
INSERT INTO addresses (user_id, recipient_name, phone, province_id, province_name, district_id, district_name, ward_id, ward_name, street_detail, is_default)
VALUES
(2, 'Nhật Trường', '0912345678', '79', 'Hồ Chí Minh', '760', 'Quận 1', '26734', 'Phường Bến Nghé', '123 Lê Lợi', true),
(3, 'Thiết Hình', '0923456789', '01', 'Hà Nội', '005', 'Quận Cầu Giấy', '00166', 'Phường Dịch Vọng', '456 Xuân Thủy', true);

-- 3. SEED VOUCHERS
INSERT INTO vouchers (code, discount_type, discount_value, min_order_amount, max_discount_amount, usage_limit, used_count, start_at, expire_at, is_active)
VALUES
('WELCOME', 'PERCENTAGE', 10, 500000, 100000, 100, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 days', true),
('FREESHIP', 'FIXED_AMOUNT', 30000, 200000, 30000, 50, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '15 days', true),
('PEAK50', 'FIXED_AMOUNT', 50000, 1000000, 50000, 20, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '7 days', true);

-- 4. SEED CATEGORIES
INSERT INTO categories (name, slug, description)
VALUES
('Giày Nam', 'giay-nam', 'Bộ sưu tập giày thể thao dành cho nam'),
('Giày Nữ', 'giay-nu', 'Bộ sưu tập giày thể thao dành cho nữ'),
('Phụ Kiện', 'phu-kien', 'Tất, dây giày, bình nước, balo...');

-- 4.1 SEED BRANDS
INSERT INTO brands (name, logo_url, description)
VALUES
('Nike', 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg', 'Classic silhouettes and cutting-edge innovation.'),
('Adidas', 'https://upload.wikimedia.org/wikipedia/commons/2/20/Adidas_Logo.svg', 'Sự giao thoa hoàn hảo giữa thể thao chuyên nghiệp và thời trang đường phố.'),
('New Balance', 'https://upload.wikimedia.org/wikipedia/commons/e/ea/New_Balance_logo.svg', 'Vẻ đẹp Dad Shoe cổ điển vượt thời gian kết hợp cùng sự thoải mái tối đa.');

-- 4.2 SEED SILHOUETTES
INSERT INTO silhouettes (name, image_url, brand_id) 
VALUES 
('Air Jordan 1', 'https://images.unsplash.com/photo-1605340537586-0a5a228fdd64?auto=format&fit=crop&q=80&w=300', 1), 
('Air Force 1', 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=300', 1), 
('Dunk', 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&q=80&w=300', 1), 
('Air Max', 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&q=80&w=300', 1), 
('Yeezy Boost', 'https://images.unsplash.com/photo-1620012253295-c15ce331ff61?auto=format&fit=crop&q=80&w=300', 2), 
('Samba', 'https://images.unsplash.com/photo-1588117305388-c2631a279f82?auto=format&fit=crop&q=80&w=300', 2);

-- 5. SEED PRODUCTS
INSERT INTO products (category_id, brand_id, silhouette_id, name, description, base_price, gender, product_type, is_featured, is_deleted, created_at)
VALUES
(1, 1, 2, 'Nike Air Force 1 07', 'Huyền thoại bóng rổ đường phố, thiết kế cổ điển vượt thời gian.', 2500000, 'UNISEX', 'SNEAKER', true, false, CURRENT_TIMESTAMP),
(1, 2, NULL, 'Adidas Ultraboost Light', 'Siêu nhẹ, công nghệ đệm BOOST phản hồi lực cực tốt.', 4500000, 'MALE', 'RUNNING', true, false, CURRENT_TIMESTAMP),
(1, 1, 1, 'Air Jordan 1 Retro High OG', 'Đôi giày thay đổi lịch sử dòng Air Jordan.', 6000000, 'MALE', 'SNEAKER', true, false, CURRENT_TIMESTAMP),
(1, 3, NULL, 'New Balance 550', 'Thiết kế vintage thập niên 80s siêu dễ phối đồ.', 3290000, 'UNISEX', 'SNEAKER', true, false, CURRENT_TIMESTAMP),
(3, 1, NULL, 'Tất Nike Everyday Plus Cushion', 'Tất cổ trung êm ái, thấm hút mồ hôi.', 200000, 'UNISEX', 'ACCESSORY', false, false, CURRENT_TIMESTAMP);

-- 6. SEED PRODUCT VARIANTS
INSERT INTO product_variants (product_id, sku, color, size, stock_quantity, price_adjustment)
VALUES
(1, 'NK-AF1-WHT-40', 'Trắng', '40', 50, 0),
(1, 'NK-AF1-WHT-41', 'Trắng', '41', 30, 0),
(1, 'NK-AF1-BLK-40', 'Đen', '40', 20, 0),
(2, 'AD-UB-BLK-41', 'Đen', '41', 15, 0),
(2, 'AD-UB-WHT-41', 'Trắng', '41', 10, 0),
(3, 'JD-1-RED-41', 'Đỏ/Đen', '41', 5, 0),
(3, 'JD-1-BLU-41', 'Xanh/Đen', '41', 8, 0),
(4, 'NK-SCK-WHT-F', 'Trắng', 'Freesize', 100, 0);

-- 7. SEED IMAGES
INSERT INTO images (product_id, product_variant_id, image_name, is_primary)
VALUES
(1, 1, 'photo-1595950653106-6c9ebd614d3a.avif', true),
(1, 3, 'smart-man.jpg', false),
(2, 4, 'photo-1608231387042-66d1773070a5.avif', true),
(3, 6, 'photo-1606107557195-0e29a4b5b4aa.avif', true),
(4, 8, 'photo-1551028719-00167b16eac5.avif', true);

-- 8. SEED CARTS & CART ITEMS
INSERT INTO carts (user_id) VALUES (2), (3);

INSERT INTO cart_items (cart_id, product_variant_id, quantity)
VALUES
(1, 2, 1),
(1, 8, 2),
(2, 5, 1);

-- 9. SEED ORDERS, ORDER ITEMS, PAYMENTS (Đơn hàng mẫu)
-- Đơn hàng 1 của Nhật Trường (Đã giao)
INSERT INTO orders (user_id, voucher_id, subtotal_amount, discount_amount, shipping_fee, final_amount, status, payment_status, shipping_name, shipping_phone, shipping_province, shipping_district, shipping_ward, shipping_street, note, created_at, updated_at)
VALUES
(2, NULL, 2500000, 0, 30000, 2530000, 'COMPLETED', 'PAID', 'Nhật Trường', '0912345678', 'Hồ Chí Minh', 'Quận 1', 'Phường Bến Nghé', '123 Lê Lợi', 'Giao giờ hành chính', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO order_items (order_id, product_variant_id, product_name, sku, variant_name, quantity, unit_price, subtotal)
VALUES
(1, 1, 'Nike Air Force 1 07', 'NK-AF1-WHT-40', 'Trắng - 40', 1, 2500000, 2500000);

INSERT INTO payments (order_id, amount, payment_method, transaction_id, status, paid_at, created_at)
VALUES
(1, 2530000, 'VNPAY', 'VNP123456789', 'SUCCESS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Đơn hàng 2 của Thiết Hình (Đang xử lý)
INSERT INTO orders (user_id, voucher_id, subtotal_amount, discount_amount, shipping_fee, final_amount, status, payment_status, shipping_name, shipping_phone, shipping_province, shipping_district, shipping_ward, shipping_street, note, created_at, updated_at)
VALUES
(3, 1, 6000000, 100000, 30000, 5930000, 'PENDING', 'PENDING', 'Thiết Hình', '0923456789', 'Hà Nội', 'Quận Cầu Giấy', 'Phường Dịch Vọng', '456 Xuân Thủy', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO order_items (order_id, product_variant_id, product_name, sku, variant_name, quantity, unit_price, subtotal)
VALUES
(2, 6, 'Air Jordan 1 Retro High OG', 'JD-1-RED-41', 'Đỏ/Đen - 41', 1, 6000000, 6000000);

INSERT INTO payments (order_id, amount, payment_method, transaction_id, status, paid_at, created_at)
VALUES
(2, 5930000, 'COD', NULL, 'PENDING', NULL, CURRENT_TIMESTAMP);
