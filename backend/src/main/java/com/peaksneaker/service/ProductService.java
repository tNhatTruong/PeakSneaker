package com.peaksneaker.service;

import com.peaksneaker.entity.Product;

import java.util.List;

public interface ProductService {
    Product getProductById(Long id);
    List<Product> getAllProducts();
    void saveProduct(Product product);
    void deleteProduct(Product product);
}
