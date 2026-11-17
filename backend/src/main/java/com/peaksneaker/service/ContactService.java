package com.peaksneaker.service;

import com.peaksneaker.dto.request.ContactRequest;
import com.peaksneaker.dto.response.ContactResponse;
import com.peaksneaker.enums.ContactStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ContactService {
    ContactResponse submitContact(ContactRequest request);
    Page<ContactResponse> getAllContacts(Pageable pageable);
    Page<ContactResponse> getContactsByStatus(ContactStatus status, Pageable pageable);
    ContactResponse updateContactStatus(Long id, ContactStatus status);
}
