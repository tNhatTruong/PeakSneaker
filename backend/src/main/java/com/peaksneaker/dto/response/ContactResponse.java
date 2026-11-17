package com.peaksneaker.dto.response;

import com.peaksneaker.entity.Contact;
import com.peaksneaker.enums.ContactStatus;
import lombok.*;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContactResponse {
    private Long id;
    private String fullName;
    private String email;
    private String phoneNumber;
    private String subject;
    private String message;
    private ContactStatus status;
    private Instant createdAt;

    public static ContactResponse fromEntity(Contact contact) {
        if (contact == null) return null;
        return ContactResponse.builder()
                .id(contact.getId())
                .fullName(contact.getFullName())
                .email(contact.getEmail())
                .phoneNumber(contact.getPhoneNumber())
                .subject(contact.getSubject())
                .message(contact.getMessage())
                .status(contact.getStatus())
                .createdAt(contact.getCreatedAt())
                .build();
    }
}
