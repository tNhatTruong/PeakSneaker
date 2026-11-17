package com.peaksneaker.service.impl;

import com.peaksneaker.dto.request.SilhouetteRequest;
import com.peaksneaker.dto.response.SilhouetteResponse;
import com.peaksneaker.entity.Brand;
import com.peaksneaker.entity.Silhouette;
import com.peaksneaker.exception.BadRequestException;
import com.peaksneaker.exception.ResourceNotFoundException;
import com.peaksneaker.repository.BrandRepository;
import com.peaksneaker.repository.ProductRepository;
import com.peaksneaker.repository.SilhouetteRepository;
import com.peaksneaker.service.SilhouetteService;
import com.peaksneaker.service.cloudservice.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SilhouetteServiceImpl implements SilhouetteService {

    private final SilhouetteRepository silhouetteRepository;
    private final BrandRepository brandRepository;
    private final ProductRepository productRepository;
    private final CloudinaryService cloudService;
    private final SilhouetteImageResolver silhouetteImageResolver;

    @Override
    @Transactional(readOnly = true)
    public List<SilhouetteResponse> getSilhouettesByBrandId(Long brandId) {
        List<Silhouette> silhouettes = silhouetteRepository.findByBrandId(brandId);
        Map<Long, String> imageUrls = silhouetteImageResolver.resolveImageUrls(silhouettes);
        return silhouettes.stream()
                .map(silhouette -> convertToResponse(silhouette, imageUrls))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<SilhouetteResponse> getAllSilhouettes() {
        List<Silhouette> silhouettes = silhouetteRepository.findAll();
        Map<Long, String> imageUrls = silhouetteImageResolver.resolveImageUrls(silhouettes);
        return silhouettes.stream()
                .map(silhouette -> convertToResponse(silhouette, imageUrls))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public SilhouetteResponse createSilhouette(SilhouetteRequest request) {
        Brand brand = brandRepository.findById(request.getBrandId())
                .orElseThrow(() -> new ResourceNotFoundException("Thương hiệu", "id", request.getBrandId()));

        String imageName = null;
        if (request.getImage() != null && !request.getImage().isEmpty()) {
            try {
                imageName = cloudService.upload(request.getImage());
            } catch (Exception e) {
                throw new BadRequestException("Lỗi upload ảnh dòng sản phẩm: " + e.getMessage());
            }
        }

        String slug = generateSlug(request.getName());

        Silhouette silhouette = Silhouette.builder()
                .name(request.getName())
                .slug(slug)
                .brand(brand)
                .imageUrl(imageName)
                .build();

        silhouette = silhouetteRepository.save(silhouette);

        String fullUrl = (imageName != null) ? cloudService.creteImageUrl(imageName) : null;
        long activeCount = productRepository.countBySilhouetteIdAndIsDeletedFalse(silhouette.getId());
        return SilhouetteResponse.builder()
                .id(silhouette.getId())
                .name(silhouette.getName())
                .slug(silhouette.getSlug())
                .imageUrl(fullUrl)
                .activeProductCount(activeCount)
                .build();
    }

    @Override
    @Transactional
    public SilhouetteResponse updateSilhouette(Long id, SilhouetteRequest request) {
        Silhouette silhouette = silhouetteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Dòng sản phẩm", "id", id));

        Brand brand = brandRepository.findById(request.getBrandId())
                .orElseThrow(() -> new ResourceNotFoundException("Thương hiệu", "id", request.getBrandId()));

        silhouette.setName(request.getName());
        silhouette.setSlug(generateSlug(request.getName()));
        silhouette.setBrand(brand);

        String imageName = silhouette.getImageUrl();
        if (request.getImage() != null && !request.getImage().isEmpty()) {
            try {
                imageName = cloudService.upload(request.getImage());
                silhouette.setImageUrl(imageName);
            } catch (Exception e) {
                throw new BadRequestException("Lỗi upload ảnh dòng sản phẩm: " + e.getMessage());
            }
        }

        silhouette = silhouetteRepository.save(silhouette);
        String fullUrl = (imageName != null) ? cloudService.creteImageUrl(imageName) : null;
        long activeCount = productRepository.countBySilhouetteIdAndIsDeletedFalse(silhouette.getId());
        return SilhouetteResponse.builder()
                .id(silhouette.getId())
                .name(silhouette.getName())
                .slug(silhouette.getSlug())
                .imageUrl(fullUrl)
                .activeProductCount(activeCount)
                .build();
    }

    @Override
    @Transactional
    public void deleteSilhouette(Long id) {
        Silhouette silhouette = silhouetteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Dòng sản phẩm", "id", id));
        long productCount = productRepository.countBySilhouetteId(id);
        if (productCount > 0) {
            throw new BadRequestException("Không thể xóa dòng sản phẩm đang gắn với " + productCount + " sản phẩm.");
        }
        silhouetteRepository.delete(silhouette);
    }

    private SilhouetteResponse convertToResponse(Silhouette silhouette, Map<Long, String> imageUrls) {
        if (silhouette == null) return null;
        long activeCount = productRepository.countBySilhouetteIdAndIsDeletedFalse(silhouette.getId());
        return SilhouetteResponse.builder()
                .id(silhouette.getId())
                .name(silhouette.getName())
                .slug(silhouette.getSlug())
                .imageUrl(imageUrls.get(silhouette.getId()))
                .activeProductCount(activeCount)
                .build();
    }

    private String generateSlug(String name) {
        if (name == null) return "";
        String normalized = Normalizer.normalize(name, Normalizer.Form.NFD);
        String slug = Pattern.compile("\\p{InCombiningDiacriticalMarks}+").matcher(normalized).replaceAll("");
        return slug.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
    }
}
