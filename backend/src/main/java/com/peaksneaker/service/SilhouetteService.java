package com.peaksneaker.service;

import com.peaksneaker.dto.request.SilhouetteRequest;
import com.peaksneaker.dto.response.SilhouetteResponse;
import com.peaksneaker.entity.Brand;
import com.peaksneaker.entity.Silhouette;
import com.peaksneaker.repository.BrandRepository;
import com.peaksneaker.repository.SilhouetteRepository;
import com.peaksneaker.service.cloudservice.CloudinaryService;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SilhouetteService {

    private final SilhouetteRepository silhouetteRepository;
    private final BrandRepository brandRepository;
    private final CloudinaryService cloudService;

    @Transactional(readOnly = true)
    public List<SilhouetteResponse> getSilhouettesByBrandId(Long brandId) {
        return silhouetteRepository.findByBrandIdAndIsDeletedFalse(brandId).stream()
                .map(this::convertToResponseWithFullUrl)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SilhouetteResponse> getAllSilhouettes() {
        return silhouetteRepository.findByIsDeletedFalse().stream()
                .map(this::convertToResponseWithFullUrl)
                .collect(Collectors.toList());
    }

    @Transactional
    public SilhouetteResponse createSilhouette(SilhouetteRequest request) {
        Brand brand = brandRepository.findById(request.getBrandId())
                .orElseThrow(() -> new RuntimeException("Brand not found"));

        String imageName = null;
        if (request.getImage() != null && !request.getImage().isEmpty()) {
            try {
                // Chỉ lấy và lưu tên file ảnh gốc
                imageName = cloudService.upload(request.getImage());
            } catch (Exception e) {
                throw new RuntimeException("Lỗi upload ảnh dòng giày: " + e.getMessage());
            }
        }

        Silhouette silhouette = Silhouette.builder()
                .name(request.getName())
                .brand(brand)
                .imageUrl(imageName)
                .isDeleted(false)
                .build();

        silhouette = silhouetteRepository.save(silhouette);

        String fullUrl = (imageName != null) ? cloudService.creteImageUrl(imageName) : null;
        return SilhouetteResponse.builder()
                .id(silhouette.getId())
                .name(silhouette.getName())
                .imageUrl(fullUrl)
                .build();
    }

    @Transactional
    public SilhouetteResponse updateSilhouette(Long id, com.peaksneaker.dto.request.SilhouetteRequest request) {
        com.peaksneaker.entity.Silhouette silhouette = silhouetteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Silhouette not found"));

        if (silhouette.isDeleted()) {
            throw new RuntimeException("Silhouette is deleted");
        }

        com.peaksneaker.entity.Brand brand = brandRepository.findById(request.getBrandId())
                .orElseThrow(() -> new RuntimeException("Brand not found"));

        silhouette.setName(request.getName());
        silhouette.setBrand(brand);

        String imageName = null;
        if (request.getImage() != null && !request.getImage().isEmpty()) {
            try {
                imageName = cloudService.upload(request.getImage());
                silhouette.setImageUrl(imageName);
            } catch (Exception e) {
                throw new RuntimeException("Lỗi upload ảnh dòng giày: " + e.getMessage());
            }
        }

        silhouette = silhouetteRepository.save(silhouette);
       String fullUrl = (imageName != null) ? cloudService.creteImageUrl(imageName) : null;
        return SilhouetteResponse.builder()
                .id(silhouette.getId())
                .name(silhouette.getName())
                .imageUrl(fullUrl)
                .build();
    }

    @Transactional
    public void deleteSilhouette(Long id) {
        com.peaksneaker.entity.Silhouette silhouette = silhouetteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Silhouette not found"));
        silhouette.setDeleted(true);
        silhouetteRepository.save(silhouette);
    }

    private SilhouetteResponse convertToResponseWithFullUrl(com.peaksneaker.entity.Silhouette silhouette) {
        if (silhouette == null) return null;
        String fullUrl = null;
        if (silhouette.getImageUrl() != null && !silhouette.getImageUrl().isEmpty()) {
            fullUrl = cloudService.creteImageUrl(silhouette.getImageUrl());
        }
        silhouette.setImageUrl(fullUrl); 
        return SilhouetteResponse.fromEntity(silhouette);
    }
}
