package com.peaksneaker;

import com.peaksneaker.dto.request.CreateVariantRequest;
import com.peaksneaker.exception.BadRequestException;
import com.peaksneaker.service.InventoryService;
import com.peaksneaker.service.ProductService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
class BackendApplicationTests {

	@Autowired
	private ProductService productService;

	@Autowired
	private InventoryService inventoryService;

	@Test
	void contextLoads() {
	}

	@Test
	void filtersCatalogByAvailableVariantSize() {
		assertTrue(productService.getAvailableSizes(null, null, null).contains("42"));

		var result = productService.filterProducts(
				null, null, null, "42", null, null,
				null, 0, 12, "createdAt", "desc");

		assertFalse(result.getItems().isEmpty());
		result.getItems().forEach(product -> {
			var detail = productService.getProductById(product.getId());
			assertTrue(detail.getVariants().stream()
					.anyMatch(variant -> "42".equals(variant.getSize()) && variant.getStock() > 0));
		});
	}

	@Test
	void rejectsNonStandardSneakerSize() {
		CreateVariantRequest request = new CreateVariantRequest();
		request.setColor("Validation Test");
		request.setSize("42.5");
		request.setSku("VALIDATION-ONLY-42-5");

		assertThrows(BadRequestException.class, () -> inventoryService.createVariant(1L, request));
	}
}
