package com.peaksneaker.repository;

import com.peaksneaker.entity.Image;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ImageRepository extends JpaRepository<Image, Long> {

    List<Image> findByReferenceTypeAndReferenceId(String referenceType, Long referenceId);

    Optional<Image> findByReferenceTypeAndReferenceIdAndIsPrimaryTrue(String referenceType, Long referenceId);

    void deleteByReferenceTypeAndReferenceId(String referenceType, Long referenceId);
}
