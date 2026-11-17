package com.peaksneaker.dto.response;

import com.peaksneaker.entity.Address;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AddressResponse {
    private Long id;
    private String recipientName;
    private String phone;
    private String provinceId;
    private String provinceName;
    private String districtId;
    private String districtName;
    private String wardId;
    private String wardName;
    private String streetDetail;
    private Boolean isDefault;

    public static AddressResponse from(Address address) {
        if (address == null) return null;
        return AddressResponse.builder()
                .id(address.getId())
                .recipientName(address.getRecipientName())
                .phone(address.getPhone())
                .provinceId(address.getProvinceId() != null ? String.valueOf(address.getProvinceId()) : null)
                .provinceName(address.getProvinceName())
                .districtId(address.getDistrictId() != null ? String.valueOf(address.getDistrictId()) : null)
                .districtName(address.getDistrictName())
                .wardId(address.getWardId())
                .wardName(address.getWardName())
                .streetDetail(address.getStreetDetail())
                .isDefault(address.getIsDefault())
                .build();
    }
}
