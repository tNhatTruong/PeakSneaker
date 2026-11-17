package com.peaksneaker.service.impl;

import com.peaksneaker.dto.request.ContactRequest;
import com.peaksneaker.dto.response.ContactResponse;
import com.peaksneaker.entity.Contact;
import com.peaksneaker.enums.ContactStatus;
import com.peaksneaker.exception.ResourceNotFoundException;
import com.peaksneaker.repository.ContactRepository;
import com.peaksneaker.service.ContactService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ContactServiceImpl implements ContactService {

    private final ContactRepository contactRepository;

    @Override
    @Transactional
    public ContactResponse submitContact(ContactRequest request) {
        Contact contact = Contact.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .phoneNumber(request.getPhoneNumber())
                .subject(request.getSubject())
                .message(request.getMessage())
                .status(ContactStatus.PENDING)
                .build();

        contact = contactRepository.save(contact);
        return ContactResponse.fromEntity(contact);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ContactResponse> getAllContacts(Pageable pageable) {
        return contactRepository.findAll(pageable).map(ContactResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ContactResponse> getContactsByStatus(ContactStatus status, Pageable pageable) {
        return contactRepository.findByStatusOrderByCreatedAtDesc(status, pageable)
                .map(ContactResponse::fromEntity);
    }

    @Override
    @Transactional
    public ContactResponse updateContactStatus(Long id, ContactStatus status) {
        Contact contact = contactRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Liên hệ", "id", id));
        contact.setStatus(status);
        contact = contactRepository.save(contact);
        return ContactResponse.fromEntity(contact);
    }
}
