package com.peaksneaker.service;

import com.peaksneaker.dto.response.BrandResponse;
import com.peaksneaker.entity.Brand;
import com.peaksneaker.repository.BrandRepository;
import com.peaksneaker.service.cloudservice.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class BrandService {
    private final BrandRepository brandRepository;
    private final CloudinaryService cloudService;

    public List<BrandResponse> getAllActiveBrands() {
        return brandRepository.findByIsDeletedFalse().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<BrandResponse> searchBrands(String keyword) {
        return brandRepository.findByIsDeletedFalse().stream()
                .filter(b -> keyword == null || keyword.isEmpty() || b.getName().toLowerCase().contains(keyword.toLowerCase()))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public BrandResponse createBrand(com.peaksneaker.dto.request.BrandRequest request) {
        String logoUrl = null;
        if (request.getLogoImage() != null && !request.getLogoImage().isEmpty()) {
            try {
                String fileName = cloudService.upload(request.getLogoImage());
                logoUrl = cloudService.creteImageUrl(fileName);
            } catch (Exception e) {
                throw new RuntimeException("Lỗi upload ảnh logo: " + e.getMessage());
            }
        }

        Brand brand = Brand.builder()
                .name(request.getName())
                .description(request.getDescription())
                .logoUrl(logoUrl)
                .isDeleted(false)
                .build();
        brand = brandRepository.save(brand);
        return mapToResponse(brand);
    }

    @Transactional
    public BrandResponse updateBrand(Long id, com.peaksneaker.dto.request.BrandRequest request) {
        Brand brand = brandRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Brand not found"));

        if (brand.getIsDeleted() != null && brand.getIsDeleted()) {
            throw new RuntimeException("Brand is deleted");
        }

        brand.setName(request.getName());
        brand.setDescription(request.getDescription());

        if (request.getLogoImage() != null && !request.getLogoImage().isEmpty()) {
            try {
                String fileName = cloudService.upload(request.getLogoImage());
                brand.setLogoUrl(cloudService.creteImageUrl(fileName));
            } catch (Exception e) {
                throw new RuntimeException("Lỗi upload ảnh logo: " + e.getMessage());
            }
        }

        brand = brandRepository.save(brand);
        return mapToResponse(brand);
    }

    @Transactional
    public void deleteBrand(Long id) {
        Brand brand = brandRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Brand not found"));
        brand.setIsDeleted(true);
        brandRepository.save(brand);
    }

    private BrandResponse mapToResponse(Brand brand) {
        List<com.peaksneaker.dto.response.SilhouetteResponse> silhouetteResponses = null;
        if (brand.getSilhouettes() != null) {
            silhouetteResponses = brand.getSilhouettes().stream()
                    .filter(s -> !s.isDeleted())
                    .map(s -> com.peaksneaker.dto.response.SilhouetteResponse.builder()
                            .id(s.getId())
                            .name(s.getName())
                            .imageUrl(s.getImageUrl())
                            .build())
                    .collect(Collectors.toList());
        }

        return BrandResponse.builder()
                .id(brand.getId())
                .name(brand.getName())
                .logoUrl(brand.getLogoUrl())
                .description(brand.getDescription())
                .silhouettes(silhouetteResponses)
                .build();
    }
}
