package com.peaksneaker.controller;

import com.peaksneaker.dto.request.ContactRequest;
import com.peaksneaker.dto.response.ApiResponse;
import com.peaksneaker.dto.response.ContactResponse;
import com.peaksneaker.enums.ContactStatus;
import com.peaksneaker.service.ContactService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ContactController {

    private final ContactService contactService;

    @PostMapping("/contacts")
    public ResponseEntity<ApiResponse<ContactResponse>> submitContact(
            @Valid @RequestBody ContactRequest request) {
        ContactResponse response = contactService.submitContact(request);
        return ResponseEntity.ok(ApiResponse.success("Gửi thông tin liên hệ thành công. Chúng tôi sẽ phản hồi sớm nhất!", response));
    }

    @GetMapping("/admin/contacts")
    @PreAuthorize("hasAnyAuthority('ROLE_SUPER_ADMIN', 'SUPER_ADMIN', 'ROLE_ADMIN', 'ADMIN', 'ROLE_SUPPORT', 'SUPPORT')")
    public ResponseEntity<ApiResponse<Page<ContactResponse>>> getAllContacts(
            @RequestParam(required = false) ContactStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<ContactResponse> result;
        if (status != null) {
            result = contactService.getContactsByStatus(status, pageable);
        } else {
            result = contactService.getAllContacts(pageable);
        }
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách liên hệ thành công", result));
    }

    @PatchMapping("/admin/contacts/{id}/status")
    @PreAuthorize("hasAnyAuthority('ROLE_SUPER_ADMIN', 'SUPER_ADMIN', 'ROLE_ADMIN', 'ADMIN', 'ROLE_SUPPORT', 'SUPPORT')")
    public ResponseEntity<ApiResponse<ContactResponse>> updateStatus(
            @PathVariable Long id,
            @RequestParam ContactStatus status) {
        ContactResponse response = contactService.updateContactStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái liên hệ thành công", response));
    }
}
