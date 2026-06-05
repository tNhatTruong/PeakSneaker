-- Tạo cơ sở dữ liệu trong posgres trước đã
-- lưu ý cấu hình db có user phải giống trong application.properties
--hien tại là admin

--chạy file trong schema public

DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS vouchers CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS carts CASCADE;
DROP TABLE IF EXISTS images CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;
DROP TABLE IF EXISTS products CASCADE;
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
    created_at    timestamptz         NOT NULL
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
-- PRODUCTS
-- =========================================================
CREATE TABLE products
(
    id           BIGSERIAL PRIMARY KEY,
    category_id  bigint         REFERENCES categories (id) ON DELETE SET NULL,
    name         varchar(255)   NOT NULL,
    brand        varchar(255),
    description  text,
    base_price   decimal(12, 2) NOT NULL,
    gender       varchar(50),
    product_type varchar(50)    NOT NULL,
    is_deleted   boolean        NOT NULL,
    created_at   timestamptz    NOT NULL
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
    created_at       timestamptz         NOT NULL,
    updated_at       timestamptz         NOT NULL
);

-- =========================================================
-- IMAGES
-- =========================================================
CREATE TABLE images
(
    id             BIGSERIAL PRIMARY KEY,
    reference_type varchar(50) NOT NULL, -- PRODUCT | CATEGORY | USER | VARIANT
    reference_id   bigint      NOT NULL,
    image_name     varchar(255),         -- Đồng bộ theo field từ dump gốc của bạn
    is_primary     boolean     NOT NULL
);

CREATE INDEX idx_images_reference ON images (reference_type, reference_id);

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
    created_at          timestamptz        NOT NULL
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
    created_at       timestamptz    NOT NULL,
    updated_at       timestamptz    NOT NULL
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
    created_at     timestamptz    NOT NULL
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
