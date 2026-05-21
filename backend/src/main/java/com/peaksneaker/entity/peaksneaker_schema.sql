-- Tạo cơ sở dữ liệu (chạy lệnh này trước nếu bạn chưa có db)
-- CREATE DATABASE peaksneaker;
-- \c peaksneaker;

--chạy file trong schema public


-- =========================================================
-- USERS
-- =========================================================
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email varchar(255) UNIQUE NOT NULL,
    password_hash varchar(255) NOT NULL,
    first_name varchar(100) NOT NULL,
    last_name varchar(100) NOT NULL,
    phone varchar(20) UNIQUE,
    role varchar(50) NOT NULL DEFAULT 'USER', -- USER | ADMIN
    is_verified boolean NOT NULL DEFAULT false,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- =========================================================
-- CATEGORIES
-- =========================================================
CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    parent_id bigint REFERENCES categories(id) ON DELETE SET NULL,
    name varchar(255) NOT NULL,
    slug varchar(255) UNIQUE NOT NULL, -- e.g. giay-nam, nike-jordan
    description text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- =========================================================
-- PRODUCTS
-- =========================================================
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    category_id bigint REFERENCES categories(id) ON DELETE SET NULL,
    name varchar(255) NOT NULL,
    slug varchar(255) UNIQUE NOT NULL, -- e.g. nike-air-force-1-07
    brand varchar(255),
    description text,
    base_price decimal(12,2) NOT NULL CHECK (base_price >= 0),
    gender varchar(50), -- MEN | WOMEN | UNISEX
    product_type varchar(50) NOT NULL DEFAULT 'SNEAKER', -- SNEAKER | ACCESSORY
    is_deleted boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- =========================================================
-- PRODUCT VARIANTS
-- =========================================================
CREATE TABLE product_variants (
    id BIGSERIAL PRIMARY KEY,
    product_id bigint NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku varchar(100) UNIQUE NOT NULL, -- e.g. NK-AF1-WHT-42
    color varchar(100),
    size varchar(50),
    stock_quantity integer NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    price_adjustment decimal(12,2) NOT NULL DEFAULT 0 CHECK (price_adjustment >= 0),
    attributes jsonb, -- lưu thông số linh hoạt dạng json: {thể tích : 100ml}
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- =========================================================
-- IMAGES
-- =========================================================
CREATE TABLE images (
    id BIGSERIAL PRIMARY KEY,
    reference_type varchar(50) NOT NULL, -- PRODUCT | CATEGORY | USER | VARIANT
    reference_id bigint NOT NULL,
    image_url text NOT NULL,
    is_primary boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_images_reference ON images(reference_type, reference_id);

-- =========================================================
-- CARTS
-- =========================================================
CREATE TABLE carts (
    id BIGSERIAL PRIMARY KEY,
    user_id bigint UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- =========================================================
-- CART ITEMS
-- =========================================================
CREATE TABLE cart_items (
    id BIGSERIAL PRIMARY KEY,
    cart_id bigint NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_variant_id bigint NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(cart_id, product_variant_id)
);

-- =========================================================
-- COUPONS
-- =========================================================
CREATE TABLE coupons (
    id BIGSERIAL PRIMARY KEY,
    code varchar(50) UNIQUE NOT NULL,
    discount_type varchar(20) NOT NULL, -- PERCENTAGE | FIXED
    discount_value decimal(12,2) NOT NULL CHECK (discount_value >= 0),
    min_order_amount decimal(12,2) CHECK (min_order_amount >= 0),
    max_discount_amount decimal(12,2) CHECK (max_discount_amount >= 0),
    usage_limit integer CHECK (usage_limit >= 0),
    used_count integer NOT NULL DEFAULT 0 CHECK (used_count >= 0),
    starts_at timestamptz,
    expires_at timestamptz,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- =========================================================
-- ORDERS
-- =========================================================
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    user_id bigint REFERENCES users(id) ON DELETE SET NULL,
    coupon_id bigint REFERENCES coupons(id) ON DELETE SET NULL,
    coupon_code varchar(50),
    subtotal_amount decimal(12,2) NOT NULL CHECK (subtotal_amount >= 0),
    discount_amount decimal(12,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    shipping_fee decimal(12,2) NOT NULL DEFAULT 0 CHECK (shipping_fee >= 0),
    final_amount decimal(12,2) NOT NULL CHECK (final_amount >= 0),
    status varchar(50) NOT NULL DEFAULT 'PENDING', -- PENDING | CONFIRMED | SHIPPING | COMPLETED | CANCELLED
    payment_status varchar(50) NOT NULL DEFAULT 'PENDING', -- PENDING | PAID | FAILED | REFUNDED
    shipping_name varchar(255) NOT NULL,
    shipping_phone varchar(50) NOT NULL,
    shipping_address text NOT NULL,
    note text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- =========================================================
-- ORDER ITEMS
-- snapshot historical data
-- =========================================================
CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id bigint NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_variant_id bigint REFERENCES product_variants(id) ON DELETE SET NULL,
    product_name varchar(255) NOT NULL,
    sku varchar(100), -- NK-AF1-WHT-42 
    variant_name varchar(255), -- White / Size 42
    quantity integer NOT NULL CHECK (quantity > 0),
    unit_price decimal(12,2) NOT NULL CHECK (unit_price >= 0),
    subtotal decimal(12,2) NOT NULL CHECK (subtotal >= 0),
    created_at timestamptz NOT NULL DEFAULT now()
);

-- =========================================================
-- PAYMENTS
-- =========================================================
CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    order_id bigint NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    amount decimal(12,2) NOT NULL CHECK (amount >= 0),
    payment_method varchar(100) NOT NULL, -- COD | VNPAY
    transaction_id varchar(255),
    status varchar(50) NOT NULL DEFAULT 'PENDING', -- PENDING | SUCCESS | FAILED | REFUNDED
    paid_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- =========================================================
-- INDEXES
-- =========================================================
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_product_variants_product ON product_variants(product_id);
CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_payments_order ON payments(order_id);
