package com.peaksneaker.security;

import com.peaksneaker.entity.User;
import com.peaksneaker.entity.UserPermission;
import com.peaksneaker.repository.UserPermissionRepository;
import com.peaksneaker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;
    private final UserPermissionRepository userPermissionRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User Not Found with email: " + email));

        List<String> granted = new ArrayList<>();
        List<String> revoked = new ArrayList<>();
        if (userPermissionRepository != null && user.getId() != null) {
            for (UserPermission up : userPermissionRepository.findByUserId(user.getId())) {
                if (up.getPermission() == null || up.getPermission().getCode() == null) continue;
                if (Boolean.TRUE.equals(up.getIsGranted())) {
                    granted.add(up.getPermission().getCode());
                } else {
                    revoked.add(up.getPermission().getCode());
                }
            }
        }

        return UserDetailsImpl.build(user, granted, revoked);
    }
}
