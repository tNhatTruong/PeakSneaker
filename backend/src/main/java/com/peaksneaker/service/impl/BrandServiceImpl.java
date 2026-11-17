package com.peaksneaker.service.impl;

import com.peaksneaker.dto.request.BrandRequest;
import com.peaksneaker.dto.response.BrandResponse;
import com.peaksneaker.dto.response.SilhouetteResponse;
import com.peaksneaker.entity.Brand;
import com.peaksneaker.exception.BadRequestException;
import com.peaksneaker.exception.ResourceNotFoundException;
import com.peaksneaker.repository.BrandRepository;
import com.peaksneaker.repository.ProductRepository;
import com.peaksneaker.service.BrandService;
import com.peaksneaker.service.cloudservice.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class BrandServiceImpl implements BrandService {

    private final BrandRepository brandRepository;
    private final ProductRepository productRepository;
    private final CloudinaryService cloudService;
    private final SilhouetteImageResolver silhouetteImageResolver;

    private static final Pattern NONLATIN = Pattern.compile("[^\\w-]");
    private static final Pattern WHITESPACE = Pattern.compile("[\\s]");

    @Override
    public List<BrandResponse> getAllActiveBrands() {
        List<Brand> brands = brandRepository.findAllPubliclyVisible();
        Map<Long, String> imageUrls = resolveSilhouetteImages(brands);
        return brands.stream()
                .map(brand -> mapToResponse(brand, imageUrls))
                .collect(Collectors.toList());
    }

    @Override
    public List<BrandResponse> searchBrands(String keyword) {
        List<Brand> matchingBrands = brandRepository.findAllByOrderByNameAsc().stream()
                .filter(b -> keyword == null || keyword.isEmpty() || b.getName().toLowerCase().contains(keyword.toLowerCase()))
                .collect(Collectors.toList());
        Map<Long, String> imageUrls = resolveSilhouetteImages(matchingBrands);
        return matchingBrands.stream()
                .map(brand -> mapToResponse(brand, imageUrls))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public BrandResponse createBrand(BrandRequest request) {
        String logoUrl = null;
        if (request.getLogoImage() != null && !request.getLogoImage().isEmpty()) {
            try {
                String fileName = cloudService.upload(request.getLogoImage());
                logoUrl = cloudService.creteImageUrl(fileName);
            } catch (Exception e) {
                throw new BadRequestException("Lỗi upload ảnh logo: " + e.getMessage());
            }
        }

        String slug = toSlug(request.getName());

        Brand brand = Brand.builder()
                .name(request.getName())
                .slug(slug)
                .description(request.getDescription())
                .logoUrl(logoUrl)
                .isActive(true)
                .build();
        brand = brandRepository.save(brand);
        return mapToResponse(brand, resolveSilhouetteImages(List.of(brand)));
    }

    @Override
    @Transactional
    public BrandResponse updateBrand(Long id, BrandRequest request) {
        Brand brand = brandRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Thương hiệu", "id", id));

        brand.setName(request.getName());
        brand.setSlug(toSlug(request.getName()));
        brand.setDescription(request.getDescription());

        if (request.getLogoImage() != null && !request.getLogoImage().isEmpty()) {
            try {
                String fileName = cloudService.upload(request.getLogoImage());
                brand.setLogoUrl(cloudService.creteImageUrl(fileName));
            } catch (Exception e) {
                throw new BadRequestException("Lỗi upload ảnh logo: " + e.getMessage());
            }
        }

        brand = brandRepository.save(brand);
        return mapToResponse(brand, resolveSilhouetteImages(List.of(brand)));
    }

    @Override
    @Transactional
    public BrandResponse updateVisibility(Long id, Boolean isActive) {
        Brand brand = brandRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Thương hiệu", "id", id));

        brand.setIsActive(isActive);
        brand = brandRepository.save(brand);
        return mapToResponse(brand, resolveSilhouetteImages(List.of(brand)));
    }

    @Override
    @Transactional
    public void deleteBrand(Long id) {
        Brand brand = brandRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Thương hiệu", "id", id));
        long productCount = productRepository.countByBrandId(id);
        int silhouetteCount = brand.getSilhouettes() != null ? brand.getSilhouettes().size() : 0;
        if (productCount > 0 || silhouetteCount > 0) {
            throw new BadRequestException("Không thể xóa thương hiệu đang có " + productCount + " sản phẩm hoặc " + silhouetteCount + " dòng sản phẩm. Vui lòng dùng công tắc Ẩn/Hiện thay vì xóa.");
        }
        brandRepository.delete(brand);
    }

    private BrandResponse mapToResponse(Brand brand, Map<Long, String> silhouetteImageUrls) {
        long activeProductCount = productRepository.countByBrandIdAndIsDeletedFalse(brand.getId());
        List<SilhouetteResponse> silhouetteResponses = null;
        if (brand.getSilhouettes() != null) {
            silhouetteResponses = brand.getSilhouettes().stream()
                    .map(s -> SilhouetteResponse.builder()
                            .id(s.getId())
                            .name(s.getName())
                            .slug(s.getSlug())
                            .imageUrl(silhouetteImageUrls.get(s.getId()))
                            .activeProductCount(productRepository.countBySilhouetteIdAndIsDeletedFalse(s.getId()))
                            .build())
                    .collect(Collectors.toList());
        }

        String fullLogo = brand.getLogoUrl();
        if (fullLogo != null && !fullLogo.startsWith("http")) {
            fullLogo = cloudService.creteImageUrl(fullLogo);
        }

        return BrandResponse.builder()
                .id(brand.getId())
                .name(brand.getName())
                .slug(brand.getSlug())
                .logoUrl(fullLogo)
                .description(brand.getDescription())
                .isActive(brand.getIsActive())
                .isVisible(Boolean.TRUE.equals(brand.getIsActive()) && activeProductCount > 0)
                .activeProductCount(activeProductCount)
                .silhouettes(silhouetteResponses)
                .build();
    }

    private Map<Long, String> resolveSilhouetteImages(List<Brand> brands) {
        List<com.peaksneaker.entity.Silhouette> silhouettes = brands.stream()
                .flatMap(brand -> brand.getSilhouettes().stream())
                .toList();
        return silhouetteImageResolver.resolveImageUrls(silhouettes);
    }

    private String toSlug(String input) {
        if (input == null) return "";
        String nowhitespace = WHITESPACE.matcher(input.trim()).replaceAll("-");
        String normalized = Normalizer.normalize(nowhitespace, Normalizer.Form.NFD);
        String slug = NONLATIN.matcher(normalized).replaceAll("");
        return slug.toLowerCase(Locale.ENGLISH);
    }
}
