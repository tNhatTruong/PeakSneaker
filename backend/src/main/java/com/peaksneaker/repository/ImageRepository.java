package com.peaksneaker.repository;

import com.peaksneaker.entity.Image;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ImageRepository extends JpaRepository<Image, Long> {

    List<Image> findByProductId(Long productId);

    List<Image> findByProductVariants_Id(Long variantId);

    Optional<Image> findByProductIdAndIsPrimaryTrue(Long productId);

    Optional<Image> findFirstByProductVariants_IdAndIsPrimaryTrue(Long variantId);

    @Query(value = """
            SELECT DISTINCT ON (p.silhouette_id)
                   p.silhouette_id AS "silhouetteId",
                   i.image_url AS "imageUrl"
            FROM images i
            JOIN products p ON p.id = i.product_id
            WHERE p.silhouette_id IN (:silhouetteIds)
              AND p.is_deleted = false
            ORDER BY p.silhouette_id, i.is_primary DESC, i.display_order ASC, i.id ASC
            """, nativeQuery = true)
    List<SilhouetteImageProjection> findRepresentativeImagesBySilhouetteIds(
            @Param("silhouetteIds") Collection<Long> silhouetteIds);

    void deleteByProductId(Long productId);

    interface SilhouetteImageProjection {
        Long getSilhouetteId();

        String getImageUrl();
    }
}
