package com.peaksneaker.service;

import com.peaksneaker.dto.response.SilhouetteResponse;
import com.peaksneaker.repository.SilhouetteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SilhouetteService {

    private final SilhouetteRepository silhouetteRepository;
    private final com.peaksneaker.repository.BrandRepository brandRepository;
    private final com.peaksneaker.service.cloudservice.CloudinaryService cloudService;

    @Transactional(readOnly = true)
    public List<SilhouetteResponse> getSilhouettesByBrandId(Long brandId) {
        return silhouetteRepository.findByBrandIdAndIsDeletedFalse(brandId).stream()
                .map(SilhouetteResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SilhouetteResponse> getAllSilhouettes() {
        return silhouetteRepository.findByIsDeletedFalse().stream()
                .map(SilhouetteResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public SilhouetteResponse createSilhouette(com.peaksneaker.dto.request.SilhouetteRequest request) {
        com.peaksneaker.entity.Brand brand = brandRepository.findById(request.getBrandId())
                .orElseThrow(() -> new RuntimeException("Brand not found"));

        String imageUrl = null;
        if (request.getImage() != null && !request.getImage().isEmpty()) {
            try {
                String fileName = cloudService.upload(request.getImage());
                imageUrl = cloudService.creteImageUrl(fileName);
            } catch (Exception e) {
                throw new RuntimeException("Lỗi upload ảnh dòng giày: " + e.getMessage());
            }
        }

        com.peaksneaker.entity.Silhouette silhouette = com.peaksneaker.entity.Silhouette.builder()
                .name(request.getName())
                .brand(brand)
                .imageUrl(imageUrl)
                .isDeleted(false)
                .build();

        silhouette = silhouetteRepository.save(silhouette);
        return SilhouetteResponse.fromEntity(silhouette);
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

        if (request.getImage() != null && !request.getImage().isEmpty()) {
            try {
                String fileName = cloudService.upload(request.getImage());
                silhouette.setImageUrl(cloudService.creteImageUrl(fileName));
            } catch (Exception e) {
                throw new RuntimeException("Lỗi upload ảnh dòng giày: " + e.getMessage());
            }
        }

        silhouette = silhouetteRepository.save(silhouette);
        return SilhouetteResponse.fromEntity(silhouette);
    }

    @Transactional
    public void deleteSilhouette(Long id) {
        com.peaksneaker.entity.Silhouette silhouette = silhouetteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Silhouette not found"));
        silhouette.setDeleted(true);
        silhouetteRepository.save(silhouette);
    }
}
