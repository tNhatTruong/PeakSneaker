package com.peaksneaker.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SilhouetteResponse {
    private Long id;
    private String name;
    private String slug;
    private String imageUrl;
    private Long activeProductCount;

    public static SilhouetteResponse fromEntity(com.peaksneaker.entity.Silhouette silhouette) {
        if (silhouette == null) return null;
        return SilhouetteResponse.builder()
                .id(silhouette.getId())
                .name(silhouette.getName())
                .slug(silhouette.getSlug())
                .imageUrl(silhouette.getImageUrl())
                .build();
    }
}
