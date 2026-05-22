package com.peaksneaker.service;

import com.peaksneaker.entity.ProductVariant;

import java.util.List;

public interface ProductVariantService {
    ProductVariant getProductVariantById(Long id);
    List<ProductVariant> getAllProductVariants();
    void saveProductVariant(ProductVariant variant);
    void deleteProductVariant(ProductVariant variant);
}
