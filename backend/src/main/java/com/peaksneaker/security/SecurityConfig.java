package com.peaksneaker.security;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    private static final String[] STAFF_ROLES = {
            "ROLE_SUPER_ADMIN", "SUPER_ADMIN",
            "ROLE_STAFF_MANAGER", "STAFF_MANAGER",
            "ROLE_WAREHOUSE", "WAREHOUSE",
            "ROLE_SALES", "SALES",
            "ROLE_SUPPORT", "SUPPORT",
            "ROLE_MARKETING", "MARKETING",
            "ROLE_ADMIN", "ADMIN"
    };

    @Value("${app.cors.allowed-origins:http://localhost:5173}")
    private String allowedOrigins;

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(ex -> ex
                    .authenticationEntryPoint((request, response, authException) -> {
                        response.setStatus(jakarta.servlet.http.HttpServletResponse.SC_UNAUTHORIZED);
                        response.setContentType("application/json;charset=UTF-8");
                        response.getWriter().write("{\"status\":\"error\",\"message\":\"Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.\",\"data\":null}");
                    })
                    .accessDeniedHandler((request, response, accessDeniedException) -> {
                        response.setStatus(jakarta.servlet.http.HttpServletResponse.SC_FORBIDDEN);
                        response.setContentType("application/json;charset=UTF-8");
                        response.getWriter().write("{\"status\":\"error\",\"message\":\"Bạn không có quyền thực hiện thao tác này\",\"data\":null}");
                    })
                )
                .authorizeHttpRequests(auth -> 
                    auth.requestMatchers("/api/v1/auth/**").permitAll()
                        .requestMatchers("/api/v1/shipping/**").permitAll()
                        .requestMatchers("/api/v1/payment/**").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/v1/webhooks/ghn").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/v1/contacts").permitAll()
                        .requestMatchers("/api/v1/products/admin/**").hasAnyAuthority(STAFF_ROLES)
                        .requestMatchers("/api/v1/products/**").permitAll()
                        .requestMatchers("/api/v1/brands/**").permitAll()
                        .requestMatchers("/api/v1/categories/**").permitAll()
                        .requestMatchers("/api/v1/silhouettes/**").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/reviews/**").permitAll()
                        .requestMatchers("/api/v1/admin/**").hasAnyAuthority(STAFF_ROLES)
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/v1/vouchers").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/v1/vouchers/check").permitAll()
                        .requestMatchers("/api/v1/vouchers/**").hasAnyAuthority(STAFF_ROLES)
                        .anyRequest().authenticated()
                );

        http.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .toList());
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setExposedHeaders(List.of("x-auth-token"));
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
