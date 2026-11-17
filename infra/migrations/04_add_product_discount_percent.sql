-- Migration 04: Add discount_percent to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(5,2) DEFAULT 0 
CHECK (discount_percent >= 0 AND discount_percent <= 100);

-- Update sample discounts for selected products for realistic storefront testing
-- 1. Nike Air Force 1 07 Triple White (ID 1) -> 10% discount
UPDATE products SET discount_percent = 10.00 WHERE id = 1;

-- 2. Air Jordan 1 Low SE Black Multi-Color (ID 170) -> 15% discount
UPDATE products SET discount_percent = 15.00 WHERE id = 170;

-- 3. Puma Suede Pokémon Squirtle (ID 256) -> 20% discount
UPDATE products SET discount_percent = 20.00 WHERE id = 256;

-- 4. Adidas Samba OG (ID 198) -> 5% discount
UPDATE products SET discount_percent = 5.00 WHERE id = 198;
