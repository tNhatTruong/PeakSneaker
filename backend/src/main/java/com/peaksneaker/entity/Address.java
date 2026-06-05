package com.peaksneaker.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "addresses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Address {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "recipient_name", nullable = false, length = 100)
    private String recipientName;

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(name = "province_id", nullable = false, length = 50)
    private String provinceId;

    @Column(name = "province_name", nullable = false, length = 100)
    private String provinceName;

    @Column(name = "district_id", nullable = false, length = 50)
    private String districtId;

    @Column(name = "district_name", nullable = false, length = 100)
    private String districtName;

    @Column(name = "ward_id", nullable = false, length = 50)
    private String wardId;

    @Column(name = "ward_name", nullable = false, length = 100)
    private String wardName;

    @Column(name = "street_detail", nullable = false, columnDefinition = "text")
    private String streetDetail;

    @Column(name = "is_default", nullable = false)
    @Builder.Default
    private Boolean isDefault = true;
}
