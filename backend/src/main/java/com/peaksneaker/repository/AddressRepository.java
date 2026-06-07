package com.peaksneaker.repository;

import com.peaksneaker.entity.Address;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface AddressRepository extends JpaRepository<Address, Long> {
    Optional<Address> findByIdAndUserId(Long id, Long userId);
    List<Address> findByUserId(Long userId);
}
