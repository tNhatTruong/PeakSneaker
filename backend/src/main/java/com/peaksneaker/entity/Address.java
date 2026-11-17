package com.peaksneaker.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

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

    @Column(name = "province_id", nullable = false)
    private Integer provinceId;

    @Column(name = "province_name", nullable = false, length = 100)
    private String provinceName;

    @Column(name = "district_id", nullable = false)
    private Integer districtId;

    @Column(name = "district_name", nullable = false, length = 100)
    private String districtName;

    @Column(name = "ward_code", nullable = false, length = 50)
    private String wardCode;

    @Column(name = "ward_name", nullable = false, length = 100)
    private String wardName;

    @Column(name = "street_detail", nullable = false, columnDefinition = "text")
    private String streetDetail;

    @Column(name = "is_default", nullable = false)
    @Builder.Default
    private Boolean isDefault = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public String getWardId() {
        return this.wardCode;
    }

    public void setWardId(String wardId) {
        this.wardCode = wardId;
    }

    public void setProvinceId(String id) {
        if (id != null && !id.trim().isEmpty()) {
            try {
                this.provinceId = Integer.parseInt(id.trim());
            } catch (NumberFormatException e) {
                this.provinceId = 0;
            }
        }
    }

    public void setDistrictId(String id) {
        if (id != null && !id.trim().isEmpty()) {
            try {
                this.districtId = Integer.parseInt(id.trim());
            } catch (NumberFormatException e) {
                this.districtId = 0;
            }
        }
    }

    public static class AddressBuilder {
        public AddressBuilder provinceId(String provinceId) {
            if (provinceId != null && !provinceId.trim().isEmpty()) {
                try {
                    this.provinceId = Integer.parseInt(provinceId.trim());
                } catch (NumberFormatException ignored) {}
            }
            return this;
        }

        public AddressBuilder provinceId(Integer provinceId) {
            this.provinceId = provinceId;
            return this;
        }

        public AddressBuilder districtId(String districtId) {
            if (districtId != null && !districtId.trim().isEmpty()) {
                try {
                    this.districtId = Integer.parseInt(districtId.trim());
                } catch (NumberFormatException ignored) {}
            }
            return this;
        }

        public AddressBuilder districtId(Integer districtId) {
            this.districtId = districtId;
            return this;
        }

        public AddressBuilder wardId(String wardId) {
            this.wardCode = wardId;
            return this;
        }
    }
}
