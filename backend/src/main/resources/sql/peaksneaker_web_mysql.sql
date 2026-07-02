/*
 Navicat Premium Dump SQL

 Source Server         : Sneaker
 Source Server Type    : MySQL
 Source Server Version : 80410 (8.4.10)
 Source Host           : localhost:3306
 Source Schema         : peaksneaker

 Target Server Type    : MySQL
 Target Server Version : 80410 (8.4.10)
 File Encoding         : 65001

 Date: 02/07/2026 19:09:36
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for addresses
-- ----------------------------
DROP TABLE IF EXISTS `addresses`;
CREATE TABLE `addresses`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `is_default` bit(1) NOT NULL,
  `user_id` bigint NOT NULL,
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `district_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `province_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ward_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `district_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `province_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ward_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `recipient_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `street_detail` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `FK_addr_user`(`user_id` ASC) USING BTREE,
  CONSTRAINT `FK_addr_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of addresses
-- ----------------------------

-- ----------------------------
-- Table structure for brands
-- ----------------------------
DROP TABLE IF EXISTS `brands`;
CREATE TABLE `brands`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `logo_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `is_deleted` bit(1) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 6 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of brands
-- ----------------------------
INSERT INTO `brands` VALUES (1, 'Nike', 'Những thiết kế kinh điển kết hợp với sự đổi mới không ngừng, mang đến phong cách thể thao hiện đại và đẳng cấp.', 'Logo_NIKE.svg', b'0');
INSERT INTO `brands` VALUES (2, 'Adidas', 'Sự giao thoa hoàn hảo giữa thể thao chuyên nghiệp và thời trang đường phố.', 'Adidas_Logo.svg', b'0');
INSERT INTO `brands` VALUES (3, 'Vans', 'Phong cách streetwear và skateboarding trẻ trung, cá tính.', 'Vans_Logo.svg', b'0');
INSERT INTO `brands` VALUES (4, 'Converse', 'Biểu tượng thời trang thể thao cổ điển với thiết kế canvas vượt thời gian.', 'Converse_Logo.svg', b'0');
INSERT INTO `brands` VALUES (5, 'Puma', 'Sự kết hợp giữa công nghệ thể thao và phong cách hiện đại, mạnh mẽ.', 'Puma_Logo.svg', b'0');

-- ----------------------------
-- Table structure for cart_items
-- ----------------------------
DROP TABLE IF EXISTS `cart_items`;
CREATE TABLE `cart_items`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `cart_id` bigint NOT NULL,
  `product_variant_id` bigint NOT NULL,
  `quantity` int NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `UKgsd2omh6dn3xdhlr5ta36gu4o`(`cart_id` ASC, `product_variant_id` ASC) USING BTREE,
  INDEX `FKn1s4l7h0vm4o259wpu7ft0y2y`(`product_variant_id` ASC) USING BTREE,
  CONSTRAINT `FK_cart_item_cart` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `FKn1s4l7h0vm4o259wpu7ft0y2y` FOREIGN KEY (`product_variant_id`) REFERENCES `product_variants` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of cart_items
-- ----------------------------

-- ----------------------------
-- Table structure for carts
-- ----------------------------
DROP TABLE IF EXISTS `carts`;
CREATE TABLE `carts`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `user_id`(`user_id` ASC) USING BTREE,
  CONSTRAINT `FK_cart_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of carts
-- ----------------------------
INSERT INTO `carts` VALUES (1, 1);

-- ----------------------------
-- Table structure for categories
-- ----------------------------
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `parent_id` bigint NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `FKsaok720gsu4u2wrgbk10b5n8d`(`parent_id` ASC) USING BTREE,
  CONSTRAINT `FKsaok720gsu4u2wrgbk10b5n8d` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of categories
-- ----------------------------
INSERT INTO `categories` VALUES (1, 'Giày Nam', 'giay-nam', 'Bộ sưu tập giày thể thao dành cho nam', NULL);
INSERT INTO `categories` VALUES (2, 'Giày Nữ', 'giay-nu', 'Bộ sưu tập giày thể thao dành cho nữ', NULL);
INSERT INTO `categories` VALUES (3, 'Phụ Kiện', 'phu-kien', 'Tất, dây giày, bình nước, balo...', NULL);

-- ----------------------------
-- Table structure for images
-- ----------------------------
DROP TABLE IF EXISTS `images`;
CREATE TABLE `images`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `image_name` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_primary` bit(1) NOT NULL,
  `product_id` bigint NOT NULL,
  `product_variant_id` bigint NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `FKghwsjbjo7mg3iufxruvq6iu3q`(`product_id` ASC) USING BTREE,
  INDEX `FKq4m09wgn47ymx4wgldqt24mes`(`product_variant_id` ASC) USING BTREE,
  CONSTRAINT `FKghwsjbjo7mg3iufxruvq6iu3q` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `FKq4m09wgn47ymx4wgldqt24mes` FOREIGN KEY (`product_variant_id`) REFERENCES `product_variants` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 31 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of images
-- ----------------------------
INSERT INTO `images` VALUES (1, 'af1_white.jpg', b'1', 1, 1);
INSERT INTO `images` VALUES (2, 'af1_white.jpg', b'0', 1, 2);
INSERT INTO `images` VALUES (3, 'af1_black.jpg', b'0', 1, 3);
INSERT INTO `images` VALUES (4, 'pegasus_black_white.jpg', b'1', 2, 4);
INSERT INTO `images` VALUES (5, 'pegasus_black_white.jpg', b'0', 2, 5);
INSERT INTO `images` VALUES (6, 'pegasus_blue.jpg', b'0', 2, 6);
INSERT INTO `images` VALUES (7, 'stansmith_white_green.jpg', b'1', 3, 7);
INSERT INTO `images` VALUES (8, 'stansmith_white_green.jpg', b'0', 3, 8);
INSERT INTO `images` VALUES (9, 'stansmith_white_navy.jpg', b'0', 3, 9);
INSERT INTO `images` VALUES (10, 'ultraboost_black.jpg', b'1', 4, 10);
INSERT INTO `images` VALUES (11, 'ultraboost_black.jpg', b'0', 4, 11);
INSERT INTO `images` VALUES (12, 'ultraboost_white.jpg', b'0', 4, 12);
INSERT INTO `images` VALUES (13, 'oldskool_black_white.jpg', b'1', 5, 13);
INSERT INTO `images` VALUES (14, 'oldskool_black_white.jpg', b'0', 5, 14);
INSERT INTO `images` VALUES (15, 'oldskool_navy.jpg', b'0', 5, 15);
INSERT INTO `images` VALUES (16, 'slipon_checkerboard.jpg', b'1', 6, 16);
INSERT INTO `images` VALUES (17, 'slipon_checkerboard.jpg', b'0', 6, 17);
INSERT INTO `images` VALUES (18, 'slipon_red_check.jpg', b'0', 6, 18);
INSERT INTO `images` VALUES (19, 'chuck_black.jpg', b'1', 7, 19);
INSERT INTO `images` VALUES (20, 'chuck_black.jpg', b'0', 7, 20);
INSERT INTO `images` VALUES (21, 'chuck_white.jpg', b'0', 7, 21);
INSERT INTO `images` VALUES (22, 'runstar_black.jpg', b'1', 8, 22);
INSERT INTO `images` VALUES (23, 'runstar_black.jpg', b'0', 8, 23);
INSERT INTO `images` VALUES (24, 'runstar_white.jpg', b'0', 8, 24);
INSERT INTO `images` VALUES (25, 'suede_black_white.jpg', b'1', 9, 25);
INSERT INTO `images` VALUES (26, 'suede_black_white.jpg', b'0', 9, 26);
INSERT INTO `images` VALUES (27, 'suede_red_white.jpg', b'0', 9, 27);
INSERT INTO `images` VALUES (28, 'rsx_multicolor.jpg', b'1', 10, 28);
INSERT INTO `images` VALUES (29, 'rsx_multicolor.jpg', b'0', 10, 29);
INSERT INTO `images` VALUES (30, 'rsx_black_red.jpg', b'0', 10, 30);

-- ----------------------------
-- Table structure for order_items
-- ----------------------------
DROP TABLE IF EXISTS `order_items`;
CREATE TABLE `order_items`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `order_id` bigint NOT NULL,
  `product_variant_id` bigint NOT NULL,
  `product_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `variant_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `sku` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `quantity` int NOT NULL,
  `unit_price` decimal(12, 2) NOT NULL,
  `subtotal` decimal(12, 2) NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `FK_oi_order`(`order_id` ASC) USING BTREE,
  INDEX `FKltmtlue0wixrg1cf0xo7x0l4d`(`product_variant_id` ASC) USING BTREE,
  CONSTRAINT `FK_oi_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `FKltmtlue0wixrg1cf0xo7x0l4d` FOREIGN KEY (`product_variant_id`) REFERENCES `product_variants` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of order_items
-- ----------------------------

-- ----------------------------
-- Table structure for orders
-- ----------------------------
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NULL DEFAULT NULL,
  `voucher_id` bigint NULL DEFAULT NULL,
  `subtotal_amount` decimal(12, 2) NOT NULL,
  `discount_amount` decimal(12, 2) NOT NULL,
  `shipping_fee` decimal(12, 2) NOT NULL,
  `final_amount` decimal(12, 2) NOT NULL,
  `shipping_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `shipping_phone` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `shipping_province` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `shipping_district` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `shipping_ward` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `shipping_street` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `payment_status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `FK32ql8ubntj5uh44ph9659tiih`(`user_id` ASC) USING BTREE,
  INDEX `FKdimvsocblb17f45ikjr6xn1wj`(`voucher_id` ASC) USING BTREE,
  CONSTRAINT `FK32ql8ubntj5uh44ph9659tiih` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `FKdimvsocblb17f45ikjr6xn1wj` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of orders
-- ----------------------------

-- ----------------------------
-- Table structure for payments
-- ----------------------------
DROP TABLE IF EXISTS `payments`;
CREATE TABLE `payments`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `order_id` bigint NOT NULL,
  `amount` decimal(12, 2) NOT NULL,
  `payment_method` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `transaction_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `paid_at` datetime(6) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `FK81gagumt0r8y3rmudcgpbk42l`(`order_id` ASC) USING BTREE,
  CONSTRAINT `FK81gagumt0r8y3rmudcgpbk42l` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of payments
-- ----------------------------

-- ----------------------------
-- Table structure for product_variants
-- ----------------------------
DROP TABLE IF EXISTS `product_variants`;
CREATE TABLE `product_variants`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `product_id` bigint NOT NULL,
  `sku` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `color` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `size` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `stock_quantity` int NOT NULL DEFAULT 0,
  `price_adjustment` decimal(12, 2) NOT NULL DEFAULT 0.00,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `UK_variant_sku`(`sku` ASC) USING BTREE,
  INDEX `FK_variant_product`(`product_id` ASC) USING BTREE,
  CONSTRAINT `FK_variant_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 31 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of product_variants
-- ----------------------------
INSERT INTO `product_variants` VALUES (1, 1, 'P1-WH-40', 'White', '40', 48, 0.00, '2026-06-25 02:33:58.000000', '2026-06-25 02:33:58.000000');
INSERT INTO `product_variants` VALUES (2, 1, 'P1-WH-41', 'White', '41', 45, 0.00, '2026-06-25 02:33:58.000000', '2026-06-25 02:33:58.000000');
INSERT INTO `product_variants` VALUES (3, 1, 'P1-BK-40', 'Black', '40', 20, 0.00, '2026-06-25 02:33:58.000000', '2026-06-25 02:33:58.000000');
INSERT INTO `product_variants` VALUES (4, 2, 'P2-BW-42', 'Black/White', '42', 22, 0.00, '2026-06-25 02:33:58.000000', '2026-06-25 02:33:58.000000');
INSERT INTO `product_variants` VALUES (5, 2, 'P2-BW-43', 'Black/White', '43', 25, 0.00, '2026-06-25 02:33:58.000000', '2026-06-25 02:33:58.000000');
INSERT INTO `product_variants` VALUES (6, 2, 'P2-BL-42', 'Blue', '42', 15, 0.00, '2026-06-25 02:33:58.000000', '2026-06-25 02:33:58.000000');
INSERT INTO `product_variants` VALUES (7, 3, 'P3-WG-39', 'White/Green', '39', 40, 0.00, '2026-06-25 02:33:58.000000', '2026-06-25 02:33:58.000000');
INSERT INTO `product_variants` VALUES (8, 3, 'P3-WG-40', 'White/Green', '40', 63, 0.00, '2026-06-25 02:33:58.000000', '2026-06-25 02:33:58.000000');
INSERT INTO `product_variants` VALUES (9, 3, 'P3-WN-39', 'White/Navy', '39', 20, 0.00, '2026-06-25 02:33:58.000000', '2026-06-25 02:33:58.000000');
INSERT INTO `product_variants` VALUES (10, 4, 'P4-CB-37', 'Core Black', '37', 15, 0.00, '2026-06-25 02:33:58.000000', '2026-06-25 02:33:58.000000');
INSERT INTO `product_variants` VALUES (11, 4, 'P4-CB-38', 'Core Black', '38', 20, 0.00, '2026-06-25 02:33:58.000000', '2026-06-25 02:33:58.000000');
INSERT INTO `product_variants` VALUES (12, 4, 'P4-CW-38', 'Cloud White', '38', 10, 0.00, '2026-06-25 02:33:58.000000', '2026-06-25 02:33:58.000000');
INSERT INTO `product_variants` VALUES (13, 5, 'P5-BW-40', 'Black/White', '40', 100, 0.00, '2026-06-25 02:33:58.000000', '2026-06-25 02:33:58.000000');
INSERT INTO `product_variants` VALUES (14, 5, 'P5-BW-41', 'Black/White', '41', 120, 0.00, '2026-06-25 02:33:58.000000', '2026-06-25 02:33:58.000000');
INSERT INTO `product_variants` VALUES (15, 5, 'P5-NV-40', 'Navy', '40', 40, 0.00, '2026-06-25 02:33:58.000000', '2026-06-25 02:33:58.000000');
INSERT INTO `product_variants` VALUES (16, 6, 'P6-BWC-39', 'Black/White Check', '39', 55, 0.00, '2026-06-25 02:33:58.000000', '2026-06-25 02:33:58.000000');
INSERT INTO `product_variants` VALUES (17, 6, 'P6-BWC-40', 'Black/White Check', '40', 65, 0.00, '2026-06-25 02:33:58.000000', '2026-06-25 02:33:58.000000');
INSERT INTO `product_variants` VALUES (18, 6, 'P6-RC-39', 'Red Check', '39', 15, 0.00, '2026-06-25 02:33:58.000000', '2026-06-25 02:33:58.000000');
INSERT INTO `product_variants` VALUES (19, 7, 'P7-BK-41', 'Black', '41', 80, 0.00, '2026-06-25 02:33:58.000000', '2026-06-25 02:33:58.000000');
INSERT INTO `product_variants` VALUES (20, 7, 'P7-BK-42', 'Black', '42', 75, 0.00, '2026-06-25 02:33:58.000000', '2026-06-25 02:33:58.000000');
INSERT INTO `product_variants` VALUES (21, 7, 'P7-OW-41', 'Optical White', '41', 50, 0.00, '2026-06-25 02:33:58.000000', '2026-06-25 02:33:58.000000');
INSERT INTO `product_variants` VALUES (22, 8, 'P8-BK-36', 'Black', '36', 30, 0.00, '2026-06-25 02:33:58.000000', '2026-06-25 02:33:58.000000');
INSERT INTO `product_variants` VALUES (23, 8, 'P8-BK-37', 'Black', '37', 45, 0.00, '2026-06-25 02:33:58.000000', '2026-06-25 02:33:58.000000');
INSERT INTO `product_variants` VALUES (24, 8, 'P8-WH-37', 'White', '37', 25, 0.00, '2026-06-25 02:33:58.000000', '2026-06-25 02:33:58.000000');
INSERT INTO `product_variants` VALUES (25, 9, 'P9-BW-42', 'Black/White', '42', 20, 0.00, '2026-06-25 02:33:58.000000', '2026-06-25 02:33:58.000000');
INSERT INTO `product_variants` VALUES (26, 9, 'P9-BW-43', 'Black/White', '43', 15, 0.00, '2026-06-25 02:33:58.000000', '2026-06-25 02:33:58.000000');
INSERT INTO `product_variants` VALUES (27, 9, 'P9-RW-42', 'Red/White', '42', 10, 0.00, '2026-06-25 02:33:58.000000', '2026-06-25 02:33:58.000000');
INSERT INTO `product_variants` VALUES (28, 10, 'P10-MC-40', 'Multicolor', '40', 35, 0.00, '2026-06-25 02:33:58.000000', '2026-06-25 02:33:58.000000');
INSERT INTO `product_variants` VALUES (29, 10, 'P10-MC-41', 'Multicolor', '41', 40, 0.00, '2026-06-25 02:33:58.000000', '2026-06-25 02:33:58.000000');
INSERT INTO `product_variants` VALUES (30, 10, 'P10-BR-41', 'Black/Red', '41', 20, 0.00, '2026-06-25 02:33:58.000000', '2026-06-25 02:33:58.000000');

-- ----------------------------
-- Table structure for products
-- ----------------------------
DROP TABLE IF EXISTS `products`;
CREATE TABLE `products`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `attribute` json NULL,
  `gender` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `product_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `base_price` decimal(12, 2) NOT NULL,
  `discount_percent` decimal(5, 2) NULL DEFAULT NULL,
  `price` decimal(12, 2) NOT NULL,
  `category_id` bigint NULL DEFAULT NULL,
  `silhouette_id` bigint NOT NULL,
  `is_featured` bit(1) NOT NULL,
  `is_deleted` bit(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `FK_p_cat`(`category_id` ASC) USING BTREE,
  INDEX `FK_p_sil`(`silhouette_id` ASC) USING BTREE,
  CONSTRAINT `FK_p_cat` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `FK_p_sil` FOREIGN KEY (`silhouette_id`) REFERENCES `silhouettes` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 11 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of products
-- ----------------------------
INSERT INTO `products` VALUES (1, 'Nike Air Force 1 07', 'Giày sneaker cổ điển form dáng huyền thoại', '{\"phong_cách\": \"Phong cách thường ngày năng động, phù hợp nhiều hoàn cảnh sử dụng\", \"chất_liệu\": \"Da tổng hợp cao cấp mềm mại, bền đẹp và dễ vệ sinh\"}', 'UNISEX', 'SNEAKER', 2900000.00, 0.00, 2900000.00, 1, 1, b'0', b'0', '2026-06-25 02:30:36.000000');
INSERT INTO `products` VALUES (2, 'Nike Air Zoom Pegasus 40', 'Giày chạy bộ êm ái, thoáng khí.', '{\"phong_cách\": \"Phong cách thể thao chạy bộ, tối ưu cho vận động và tập luyện\", \"chất_liệu\": \"Vải lưới thoáng khí nhẹ nhàng, hỗ trợ lưu thông không khí tốt\"}', 'MEN', 'SNEAKER', 3500000.00, 0.10, 3150000.00, 1, 2, b'0', b'0', '2026-06-25 02:30:36.000000');
INSERT INTO `products` VALUES (3, 'Adidas Stan Smith', 'Giày tennis phong cách tối giản.', '{\"phong_cách\": \"Phong cách thường ngày hiện đại, dễ phối với many loại trang phục\", \"chất_liệu\": \"Da thuần chay thân thiện với môi trường, mềm mại và bền bỉ\"}', 'UNISEX', 'SNEAKER', 2600000.00, 0.00, 2600000.00, 1, 3, b'0', b'0', '2026-06-25 02:30:36.000000');
INSERT INTO `products` VALUES (4, 'Adidas Ultraboost Light', 'Giày chạy bộ công nghệ đệm Boost nhẹ nhất.', '{\"phong_cách\": \"Phong cách chạy bộ chuyên dụng, mang lại cảm giác nhẹ và thoải mái\", \"chất_liệu\": \"Vải dệt Primeknit co giãn linh hoạt, ôm chân và thoáng khí\"}', 'WOMEN', 'SNEAKER', 5000000.00, 0.20, 4000000.00, 2, 4, b'0', b'0', '2026-06-25 02:30:36.000000');
INSERT INTO `products` VALUES (5, 'Vans Old Skool', 'Giày trượt ván mũi lộn, sọc jazz kinh điển.', '{\"phong_cách\": \"Phong cách trượt ván cá tính, phù hợp với giới trẻ năng động\", \"chất_liệu\": \"Sự kết hợp giữa vải canvas và da lộn, tạo độ bền và tính thẩm mỹ cao\"}', 'UNISEX', 'SNEAKER', 1900000.00, 0.10, 1710000.00, 1, 5, b'0', b'0', '2026-06-25 02:30:36.000000');
INSERT INTO `products` VALUES (6, 'Vans Slip-On Checkerboard', 'Giày lười họa tiết caro.', '{\"phong_cách\": \"Phong cách thường ngày trẻ trung, phù hợp cho các hoạt động hằng ngày\", \"chất_liệu\": \"Vải canvas chắc chắn, thoáng mát và dễ bảo quản\"}', 'UNISEX', 'SNEAKER', 1700000.00, 0.10, 1530000.00, 1, 6, b'0', b'0', '2026-06-25 02:30:36.000000');
INSERT INTO `products` VALUES (7, 'Converse Chuck Taylor All Star', 'Giày cổ cao vải canvas truyền thống.', '{\"phong_cách\": \"Phong cách thường ngày đơn giản, dễ dàng phối hợp với many trang phục\", \"chất_liệu\": \"Vải canvas bền bỉ với khả năng chống mài mòn tốt\"}', 'UNISEX', 'SNEAKER', 1500000.00, 0.00, 1500000.00, 1, 7, b'0', b'0', '2026-06-25 02:30:36.000000');
INSERT INTO `products` VALUES (8, 'Converse Run Star Hike', 'Giày đế độn phong cách cá tính.', '{\"phong_cách\": \"Phong cách đế dày thời trang, tạo điểm nhấn nổi bật và cá tính\", \"chất_liệu\": \"Vải canvas chất lượng cao, mang lại cảm giác thoải mái khi sử dụng\"}', 'WOMEN', 'SNEAKER', 2800000.00, 0.10, 2520000.00, 2, 8, b'0', b'0', '2026-06-25 02:30:36.000000');
INSERT INTO `products` VALUES (9, 'Puma Suede Classic', 'Giày da lộn phong cách retro.', '{\"phong_cách\": \"Phong cách thường ngày thanh lịch, phù hợp cho nhiều dịp khác nhau\", \"chất_liệu\": \"Da lộn mềm mại với bề mặt sang trọng và tinh tế\"}', 'MEN', 'SNEAKER', 2200000.00, 0.00, 2200000.00, 1, 9, b'0', b'0', '2026-06-25 02:30:36.000000');
INSERT INTO `products` VALUES (10, 'Puma RS-X Toys', 'Giày sneaker phom dáng chunky hầm hố.', '{\"phong_cách\": \"Phong cách đế dày hiện đại, mang lại vẻ ngoài nổi bật và thời thượng\", \"chất_liệu\": \"Kết hợp giữa vải lưới thoáng khí và da bền chắc, tăng độ ổn định khi mang\"}', 'UNISEX', 'SNEAKER', 3000000.00, 0.30, 2100000.00, 1, 10, b'1', b'0', '2026-06-25 02:30:36.000000');

-- ----------------------------
-- Table structure for reviews
-- ----------------------------
DROP TABLE IF EXISTS `reviews`;
CREATE TABLE `reviews`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `product_id` bigint NOT NULL,
  `rating` int NOT NULL,
  `comment` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `created_at` datetime(6) NULL DEFAULT NULL,
  `is_deleted` bit(1) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `FKpl51cejpw4gy5swfar8br9ngi`(`product_id` ASC) USING BTREE,
  INDEX `FKcgy7qjc1r99dp117y9en6lxye`(`user_id` ASC) USING BTREE,
  CONSTRAINT `FKcgy7qjc1r99dp117y9en6lxye` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `FKpl51cejpw4gy5swfar8br9ngi` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of reviews
-- ----------------------------

-- ----------------------------
-- Table structure for silhouettes
-- ----------------------------
DROP TABLE IF EXISTS `silhouettes`;
CREATE TABLE `silhouettes`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `image_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `brand_id` bigint NOT NULL,
  `is_deleted` bit(1) NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `FK_sil_brand`(`brand_id` ASC) USING BTREE,
  CONSTRAINT `FK_sil_brand` FOREIGN KEY (`brand_id`) REFERENCES `brands` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 11 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of silhouettes
-- ----------------------------
INSERT INTO `silhouettes` VALUES (1, 'Air Force 1', 'https://images.unsplash.com/photo-1605340537586-0a5a228fdd64?auto=format&fit=crop&q=80&w=300', 1, b'0');
INSERT INTO `silhouettes` VALUES (2, 'Air Zoom Pegasus 40', 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&q=80&w=300', 1, b'0');
INSERT INTO `silhouettes` VALUES (3, 'Stan Smith', NULL, 2, b'0');
INSERT INTO `silhouettes` VALUES (4, 'Ultraboost Light', NULL, 2, b'0');
INSERT INTO `silhouettes` VALUES (5, 'Vans Old Skool', NULL, 3, b'0');
INSERT INTO `silhouettes` VALUES (6, 'Vans Slip-On Checkerboard', NULL, 3, b'0');
INSERT INTO `silhouettes` VALUES (7, 'Converse Chuck Taylor All Star', NULL, 4, b'0');
INSERT INTO `silhouettes` VALUES (8, 'Converse Run Star Hike', NULL, 4, b'0');
INSERT INTO `silhouettes` VALUES (9, 'Puma Suede Classic', NULL, 5, b'0');
INSERT INTO `silhouettes` VALUES (10, 'Puma RS-X Toys', NULL, 5, b'0');

-- ----------------------------
-- Table structure for user_vouchers
-- ----------------------------
DROP TABLE IF EXISTS `user_vouchers`;
CREATE TABLE `user_vouchers`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `voucher_id` bigint NOT NULL,
  `order_id` bigint NULL DEFAULT NULL,
  `is_used` bit(1) NOT NULL,
  `used_at` datetime(6) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `FKsinwa2gat7e7x970yuw56tefs`(`order_id` ASC) USING BTREE,
  INDEX `FK90ahc2var0yrghyxr9tapdokg`(`user_id` ASC) USING BTREE,
  INDEX `FK40ig7khk2v79rbqaj98mf1g2q`(`voucher_id` ASC) USING BTREE,
  CONSTRAINT `FK40ig7khk2v79rbqaj98mf1g2q` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `FK90ahc2var0yrghyxr9tapdokg` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `FKsinwa2gat7e7x970yuw56tefs` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of user_vouchers
-- ----------------------------

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `first_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` bit(1) NOT NULL,
  `is_verified` bit(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `UK_user_email`(`email` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of users
-- ----------------------------
INSERT INTO `users` VALUES (1, 'thiethinh789@gmail.com', '0866501452', 'Hinh', 'Thiết', '$2a$10$t4jO/WZSlutujGnY0AMw2uxaQ4xeDTFpKwzJkvwQfy5kdkB.J294q', 'USER', b'1', b'0', '2026-07-01 20:44:45.320539');

-- ----------------------------
-- Table structure for vouchers
-- ----------------------------
DROP TABLE IF EXISTS `vouchers`;
CREATE TABLE `vouchers`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `discount_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `discount_value` decimal(12, 2) NOT NULL,
  `is_active` bit(1) NOT NULL,
  `used_count` int NOT NULL,
  `usage_limit` int NULL DEFAULT NULL,
  `min_order_amount` decimal(12, 2) NULL DEFAULT NULL,
  `max_discount_amount` decimal(12, 2) NULL DEFAULT NULL,
  `start_at` datetime(6) NULL DEFAULT NULL,
  `expire_at` datetime(6) NULL DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 6 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of vouchers
-- ----------------------------
INSERT INTO `vouchers` VALUES (1, 'GIAMGIA50K', 'FIXED', 50000.00, b'1', 0, 1000, 500000.00, NULL, '2026-06-20 00:00:00.000000', '2100-06-20 23:59:59.000000', '2026-06-29 16:53:43.000000');
INSERT INTO `vouchers` VALUES (2, 'GIAMGIA100K', 'FIXED', 100000.00, b'1', 0, 1000, 500000.00, NULL, '2026-06-20 00:00:00.000000', '2100-06-20 23:59:59.000000', '2026-06-29 16:53:43.000000');
INSERT INTO `vouchers` VALUES (3, 'GIAMGIA150K', 'FIXED', 150000.00, b'1', 0, 1000, 1000000.00, NULL, '2026-06-20 00:00:00.000000', '2100-06-20 23:59:59.000000', '2026-06-29 16:53:43.000000');
INSERT INTO `vouchers` VALUES (4, 'GIAMGIA200K', 'FIXED', 200000.00, b'1', 0, 1000, 1000000.00, NULL, '2026-06-20 00:00:00.000000', '2100-06-20 23:59:59.000000', '2026-06-29 16:53:43.000000');
INSERT INTO `vouchers` VALUES (5, 'GIAMGIA250K', 'FIXED', 250000.00, b'1', 0, 1000, 1000000.00, NULL, '2026-06-20 00:00:00.000000', '2100-06-20 23:59:59.000000', '2026-06-29 16:53:43.000000');

SET FOREIGN_KEY_CHECKS = 1;
