package com.peaksneaker.service.impl;

import com.peaksneaker.entity.Brand;
import com.peaksneaker.entity.Silhouette;
import com.peaksneaker.repository.ImageRepository;
import com.peaksneaker.service.cloudservice.CloudinaryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SilhouetteImageResolverTests {

    @Mock
    private ImageRepository imageRepository;

    @Mock
    private CloudinaryService cloudinaryService;

    private SilhouetteImageResolver resolver;

    @BeforeEach
    void setUp() {
        resolver = new SilhouetteImageResolver(imageRepository, cloudinaryService);
    }

    @Test
    void usesRepresentativeProductImageWhenSilhouetteImageIsMissing() {
        Brand nike = Brand.builder().id(1L).name("Nike").build();
        Silhouette silhouette = Silhouette.builder()
                .id(6L)
                .brand(nike)
                .name("Air Force 1")
                .build();
        ImageRepository.SilhouetteImageProjection projection = mock(
                ImageRepository.SilhouetteImageProjection.class);

        when(projection.getSilhouetteId()).thenReturn(6L);
        when(projection.getImageUrl()).thenReturn("https://cdn.example/air-force-1.jpg");
        when(imageRepository.findRepresentativeImagesBySilhouetteIds(List.of(6L)))
                .thenReturn(List.of(projection));
        when(cloudinaryService.creteImageUrl("https://cdn.example/air-force-1.jpg"))
                .thenReturn("https://cdn.example/air-force-1.jpg");

        Map<Long, String> result = resolver.resolveImageUrls(List.of(silhouette));

        assertEquals("https://cdn.example/air-force-1.jpg", result.get(6L));
    }

    @Test
    void sharesRepresentativeImageBetweenEquivalentLegacySilhouettes() {
        Brand nike = Brand.builder().id(1L).name("Nike").build();
        Silhouette legacySilhouette = Silhouette.builder()
                .id(1L)
                .brand(nike)
                .name("Air Force 1")
                .build();
        Silhouette populatedSilhouette = Silhouette.builder()
                .id(6L)
                .brand(nike)
                .name("Air Force 1")
                .build();
        ImageRepository.SilhouetteImageProjection projection = mock(
                ImageRepository.SilhouetteImageProjection.class);

        when(projection.getSilhouetteId()).thenReturn(6L);
        when(projection.getImageUrl()).thenReturn("https://cdn.example/air-force-1.jpg");
        when(imageRepository.findRepresentativeImagesBySilhouetteIds(List.of(1L, 6L)))
                .thenReturn(List.of(projection));
        when(cloudinaryService.creteImageUrl("https://cdn.example/air-force-1.jpg"))
                .thenReturn("https://cdn.example/air-force-1.jpg");

        Map<Long, String> result = resolver.resolveImageUrls(
                List.of(legacySilhouette, populatedSilhouette));

        assertEquals("https://cdn.example/air-force-1.jpg", result.get(1L));
        assertEquals("https://cdn.example/air-force-1.jpg", result.get(6L));
    }
}
