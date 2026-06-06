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
    private String imageUrl;

    public static SilhouetteResponse fromEntity(com.peaksneaker.entity.Silhouette silhouette) {
        if (silhouette == null) return null;
        return SilhouetteResponse.builder()
                .id(silhouette.getId())
                .name(silhouette.getName())
                .imageUrl(silhouette.getImageUrl())
                .build();
    }
}
