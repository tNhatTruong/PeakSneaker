package com.peaksneaker.service;

import com.peaksneaker.dto.request.BrandRequest;
import com.peaksneaker.dto.response.BrandResponse;

import java.util.List;

public interface BrandService {
    List<BrandResponse> getAllActiveBrands();
    List<BrandResponse> searchBrands(String keyword);
    BrandResponse createBrand(BrandRequest request);
    BrandResponse updateBrand(Long id, BrandRequest request);
    BrandResponse updateVisibility(Long id, Boolean isActive);
    void deleteBrand(Long id);
}
