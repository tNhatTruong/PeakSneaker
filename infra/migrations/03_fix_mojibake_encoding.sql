-- Migration 03: Fix Mojibake UTF-8 double-encoding in products table
-- Fix product name for ID 256
UPDATE products 
SET name = 'Puma Suede Pokémon Squirtle' 
WHERE id = 256;

-- Fix attributes for Canvas
UPDATE products 
SET attributes = '{"material":"Canvas cao cấp dệt mật độ cao kết hợp da bảo vệ","sole":"Cao su lưu hóa bền bỉ, rãnh ma sát chống trơn trượt","design":"Cổ cao cổ điển, inspired by Chuck Taylor All Star Hi","usage":"Đi học, đi chơi, dạo phố và phối đồ Streetwear thời thượng","care_instructions":"Vệ sinh định kỳ bằng bọt làm sạch chuyên dụng (Jason Markk, Crep Protect). Không giặt máy hoặc ngâm trực tiếp trong nước xà phòng có chất tẩy mạnh. Phơi giày ở nơi khô thoáng, tránh ánh nắng mặt trời trực tiếp hoặc sấy nhiệt độ cao.","return_policy":"Hỗ trợ đổi size miễn phí trong vòng 30 ngày kể từ ngày nhận hàng thành công. Sản phẩm đổi trả phải còn nguyên tem mác, hóa đơn và hộp giày gốc không móp méo."}'
WHERE attributes LIKE '%Canvas%';

-- Fix attributes for Encap
UPDATE products 
SET attributes = '{"material":"Da lộn cao cấp và vải lưới thoáng khí Encap","sole":"Cao su lưu hóa bền bỉ, rãnh ma sát chống trơn trượt","design":"Phom dáng thể thao thời trang, ôm chân vừa vặn","usage":"Đi học, đi chơi, dạo phố và phối đồ Streetwear thời thượng","care_instructions":"Vệ sinh định kỳ bằng bọt làm sạch chuyên dụng (Jason Markk, Crep Protect). Không giặt máy hoặc ngâm trực tiếp trong nước xà phòng có chất tẩy mạnh. Phơi giày ở nơi khô thoáng, tránh ánh nắng mặt trời trực tiếp hoặc sấy nhiệt độ cao.","return_policy":"Hỗ trợ đổi size miễn phí trong vòng 30 ngày kể từ ngày nhận hàng thành công. Sản phẩm đổi trả phải còn nguyên tem mác, hóa đơn và hộp giày gốc không móp méo."}'
WHERE attributes LIKE '%Encap%';

-- Fix attributes for Primeknit
UPDATE products 
SET attributes = '{"material":"Vải dệt Primeknit thoáng khí cùng đế đệm Boost đàn hồi","sole":"Cao su lưu hóa bền bỉ, rãnh ma sát chống trơn trượt","design":"Phom dáng thể thao thời trang, ôm chân vừa vặn","usage":"Đi học, đi chơi, dạo phố và phối đồ Streetwear thời thượng","care_instructions":"Vệ sinh định kỳ bằng bọt làm sạch chuyên dụng (Jason Markk, Crep Protect). Không giặt máy hoặc ngâm trực tiếp trong nước xà phòng có chất tẩy mạnh. Phơi giày ở nơi khô thoáng, tránh ánh nắng mặt trời trực tiếp hoặc sấy nhiệt độ cao.","return_policy":"Hỗ trợ đổi size miễn phí trong vòng 30 ngày kể từ ngày nhận hàng thành công. Sản phẩm đổi trả phải còn nguyên tem mác, hóa đơn và hộp giày gốc không móp méo."}'
WHERE attributes LIKE '%Primeknit%';

-- Fix attributes for Formstrip
UPDATE products 
SET attributes = '{"material":"Da lộn da bò cổ điển kết hợp sọc Formstrip","sole":"Cao su lưu hóa bền bỉ, rãnh ma sát chống trơn trượt","design":"Phom dáng thể thao thời trang, ôm chân vừa vặn","usage":"Đi học, đi chơi, dạo phố và phối đồ Streetwear thời thượng","care_instructions":"Vệ sinh định kỳ bằng bọt làm sạch chuyên dụng (Jason Markk, Crep Protect). Không giặt máy hoặc ngâm trực tiếp trong nước xà phòng có chất tẩy mạnh. Phơi giày ở nơi khô thoáng, tránh ánh nắng mặt trời trực tiếp hoặc sấy nhiệt độ cao.","return_policy":"Hỗ trợ đổi size miễn phí trong vòng 30 ngày kể từ ngày nhận hàng thành công. Sản phẩm đổi trả phải còn nguyên tem mác, hóa đơn và hộp giày gốc không móp méo."}'
WHERE attributes LIKE '%Formstrip%';

-- Fix attributes for Da hat
UPDATE products 
SET attributes = '{"material":"Chất liệu da hạt tự nhiên và đế cao su chống trượt","sole":"Cao su lưu hóa bền bỉ, rãnh ma sát chống trơn trượt","design":"Phom dáng thể thao thời trang, ôm chân vừa vặn","usage":"Đi học, đi chơi, dạo phố và phối đồ Streetwear thời thượng","care_instructions":"Vệ sinh định kỳ bằng bọt làm sạch chuyên dụng (Jason Markk, Crep Protect). Không giặt máy hoặc ngâm trực tiếp trong nước xà phòng có chất tẩy mạnh. Phơi giày ở nơi khô thoáng, tránh ánh nắng mặt trời trực tiếp hoặc sấy nhiệt độ cao.","return_policy":"Hỗ trợ đổi size miễn phí trong vòng 30 ngày kể từ ngày nhận hàng thành công. Sản phẩm đổi trả phải còn nguyên tem mác, hóa đơn và hộp giày gốc không móp méo."}'
WHERE attributes LIKE '%háº¡t%';

-- Fix attributes for Da bo
UPDATE products 
SET attributes = '{"material":"Da bò thật cao cấp kết hợp đệm khí Nike Air","sole":"Cao su lưu hóa bền bỉ, rãnh ma sát chống trơn trượt","design":"Phom dáng thể thao thời trang, ôm chân vừa vặn","usage":"Đi học, đi chơi, dạo phố và phối đồ Streetwear thời thượng","care_instructions":"Vệ sinh định kỳ bằng bọt làm sạch chuyên dụng (Jason Markk, Crep Protect). Không giặt máy hoặc ngâm trực tiếp trong nước xà phòng có chất tẩy mạnh. Phơi giày ở nơi khô thoáng, tránh ánh nắng mặt trời trực tiếp hoặc sấy nhiệt độ cao.","return_policy":"Hỗ trợ đổi size miễn phí trong vòng 30 ngày kể từ ngày nhận hàng thành công. Sản phẩm đổi trả phải còn nguyên tem mác, hóa đơn và hộp giày gốc không móp méo."}'
WHERE attributes LIKE '%Da bÃ²%';

-- Fix attributes for Da cao cap
UPDATE products 
SET attributes = '{"material":"Chất liệu da cao cấp dệt mật độ cao kết hợp da bảo vệ","sole":"Cao su lưu hóa bền bỉ, rãnh ma sát chống trơn trượt","design":"Phom dáng thể thao thời trang, ôm chân vừa vặn","usage":"Đi học, đi chơi, dạo phố và phối đồ Streetwear thời thượng","care_instructions":"Vệ sinh định kỳ bằng bọt làm sạch chuyên dụng (Jason Markk, Crep Protect). Không giặt máy hoặc ngâm trực tiếp trong nước xà phòng có chất tẩy mạnh. Phơi giày ở nơi khô thoáng, tránh ánh nắng mặt trời trực tiếp hoặc sấy nhiệt độ cao.","return_policy":"Hỗ trợ đổi size miễn phí trong vòng 30 ngày kể từ ngày nhận hàng thành công. Sản phẩm đổi trả phải còn nguyên tem mác, hóa đơn và hộp giày gốc không móp méo."}'
WHERE attributes LIKE '%Cháº¥t liá»‡u da cao cáº¥p%';
