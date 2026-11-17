package com.peaksneaker.repository;

import com.peaksneaker.entity.Contact;
import com.peaksneaker.enums.ContactStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ContactRepository extends JpaRepository<Contact, Long> {
    Page<Contact> findByStatusOrderByCreatedAtDesc(ContactStatus status, Pageable pageable);
}
