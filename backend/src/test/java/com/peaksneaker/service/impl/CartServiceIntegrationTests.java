package com.peaksneaker.service.impl;

import com.peaksneaker.dto.response.CartResponse;
import com.peaksneaker.entity.User;
import com.peaksneaker.enums.Role;
import com.peaksneaker.repository.UserRepository;
import com.peaksneaker.service.CartService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
class CartServiceIntegrationTests {

    @Autowired
    private CartService cartService;

    @Autowired
    private UserRepository userRepository;

    @Test
    void createsEmptyCartWhenAuthenticatedUserReadsCartForTheFirstTime() {
        User user = userRepository.save(User.builder()
                .email("cart-transaction-test-" + UUID.randomUUID() + "@example.invalid")
                .firstName("Cart")
                .lastName("Transaction Test")
                .role(Role.ROLE_CUSTOMER)
                .isVerified(true)
                .isActive(true)
                .build());

        try {
            CartResponse response = cartService.getCart(user.getId());

            assertNotNull(response.getId());
            assertTrue(response.getItems().isEmpty());
            assertEquals(0, response.getTotalQuantity());
        } finally {
            userRepository.findById(user.getId()).ifPresent(userRepository::delete);
        }
    }
}
