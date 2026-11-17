package com.peaksneaker.service.impl;

import com.peaksneaker.entity.Silhouette;
import com.peaksneaker.repository.ImageRepository;
import com.peaksneaker.service.cloudservice.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

@Component
@RequiredArgsConstructor
public class SilhouetteImageResolver {

    private final ImageRepository imageRepository;
    private final CloudinaryService cloudinaryService;

    public Map<Long, String> resolveImageUrls(Collection<Silhouette> silhouettes) {
        if (silhouettes == null || silhouettes.isEmpty()) {
            return Collections.emptyMap();
        }

        Map<Long, String> imageUrls = new LinkedHashMap<>();
        List<Silhouette> validSilhouettes = silhouettes.stream()
                .filter(Objects::nonNull)
                .filter(silhouette -> silhouette.getId() != null)
                .toList();
        validSilhouettes.forEach(silhouette -> addPersistedImage(imageUrls, silhouette));

        List<Long> missingImageIds = validSilhouettes.stream()
                .filter(silhouette -> !imageUrls.containsKey(silhouette.getId()))
                .map(Silhouette::getId)
                .distinct()
                .toList();

        if (!missingImageIds.isEmpty()) {
            imageRepository.findRepresentativeImagesBySilhouetteIds(missingImageIds)
                    .forEach(image -> imageUrls.putIfAbsent(
                            image.getSilhouetteId(),
                            cloudinaryService.creteImageUrl(image.getImageUrl())));
        }

        copyImagesFromEquivalentSilhouettes(silhouettes, imageUrls);
        return imageUrls;
    }

    private void addPersistedImage(Map<Long, String> imageUrls, Silhouette silhouette) {
        if (silhouette.getImageUrl() != null && !silhouette.getImageUrl().isBlank()) {
            imageUrls.put(
                    silhouette.getId(),
                    cloudinaryService.creteImageUrl(silhouette.getImageUrl()));
        }
    }

    private void copyImagesFromEquivalentSilhouettes(
            Collection<Silhouette> silhouettes,
            Map<Long, String> imageUrls) {
        Map<String, String> imageByBrandAndName = new LinkedHashMap<>();
        silhouettes.stream()
                .filter(Objects::nonNull)
                .filter(silhouette -> imageUrls.containsKey(silhouette.getId()))
                .forEach(silhouette -> imageByBrandAndName.putIfAbsent(
                        buildEquivalenceKey(silhouette),
                        imageUrls.get(silhouette.getId())));

        silhouettes.stream()
                .filter(Objects::nonNull)
                .filter(silhouette -> silhouette.getId() != null)
                .forEach(silhouette -> {
                    String equivalentImageUrl = imageByBrandAndName.get(buildEquivalenceKey(silhouette));
                    if (equivalentImageUrl != null) {
                        imageUrls.putIfAbsent(silhouette.getId(), equivalentImageUrl);
                    }
                });
    }

    private String buildEquivalenceKey(Silhouette silhouette) {
        Long brandId = silhouette.getBrand() != null ? silhouette.getBrand().getId() : null;
        String normalizedName = silhouette.getName() == null
                ? ""
                : silhouette.getName().trim().toLowerCase(Locale.ROOT);
        return brandId + ":" + normalizedName;
    }
}
