package com.peaksneaker.service;

import com.peaksneaker.entity.User;

import java.util.List;

public interface UserService {
    User getUserById(Long id);
    List<User> getAllUsers();
    void saveUser(User user);
    void deleteUser(User user);
}
