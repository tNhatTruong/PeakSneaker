package com.peaksneaker.repository;

import com.peaksneaker.entity.Silhouette;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SilhouetteRepository extends JpaRepository<Silhouette, Long> {
    List<Silhouette> findByBrandIdAndIsDeletedFalse(Long brandId);
    List<Silhouette> findByIsDeletedFalse();
}
