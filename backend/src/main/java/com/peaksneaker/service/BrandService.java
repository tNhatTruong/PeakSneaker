package com.peaksneaker.service;

import com.peaksneaker.dto.response.BrandResponse;
import com.peaksneaker.entity.Brand;
import com.peaksneaker.repository.BrandRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class BrandService {

    @Autowired
    private BrandRepository brandRepository;

    public List<BrandResponse> getAllActiveBrands() {
        return brandRepository.findByIsDeletedFalse().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
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
