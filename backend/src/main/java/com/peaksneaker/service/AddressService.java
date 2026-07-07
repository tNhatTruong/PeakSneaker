package com.peaksneaker.service;

import com.peaksneaker.dto.request.AddressRequest;
import com.peaksneaker.dto.response.AddressResponse;
import com.peaksneaker.entity.Address;
import com.peaksneaker.entity.User;
import com.peaksneaker.repository.AddressRepository;
import com.peaksneaker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;


@Service
@RequiredArgsConstructor
public class AddressService {

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;

    @Transactional
    public AddressResponse createAddress(Long userId, AddressRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng"));

        // Disable other default addresses if this is default
        if (request.getIsDefault()) {
            List<Address> existingAddresses = addressRepository.findByUserId(userId);
            for (Address addr : existingAddresses) {
                if (addr.getIsDefault()) {
                    addr.setIsDefault(false);
                    addressRepository.save(addr);
                }
            }
        }

        Address address = Address.builder()
                .user(user)
                .recipientName(request.getRecipientName())
                .phone(request.getPhone())
                .provinceId(request.getProvinceId())
                .provinceName(request.getProvinceName())
                .districtId(request.getDistrictId())
                .districtName(request.getDistrictName())
                .wardId(request.getWardId())
                .wardName(request.getWardName())
                .streetDetail(request.getStreetDetail())
                .isDefault(request.getIsDefault())
                .build();

        Address savedAddress = addressRepository.save(address);
        return AddressResponse.from(savedAddress);
    }

    @Transactional(readOnly = true)
    public List<AddressResponse> getUserAddresses(Long userId) {
        List<Address> addresses = addressRepository.findByUserId(userId);
        return addresses.stream()
                .map(AddressResponse::from)
                .collect(java.util.stream.Collectors.toList());
    }

    @Transactional
    public AddressResponse updateAddress(Long userId, Long addressId, AddressRequest request) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy địa chỉ"));
                
        if (!address.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Bạn không có quyền sửa địa chỉ này");
        }

        if (request.getIsDefault() && !address.getIsDefault()) {
            List<Address> existingAddresses = addressRepository.findByUserId(userId);
            for (Address addr : existingAddresses) {
                if (addr.getIsDefault()) {
                    addr.setIsDefault(false);
                    addressRepository.save(addr);
                }
            }
        }

        address.setRecipientName(request.getRecipientName());
        address.setPhone(request.getPhone());
        address.setProvinceId(request.getProvinceId());
        address.setProvinceName(request.getProvinceName());
        address.setDistrictId(request.getDistrictId());
        address.setDistrictName(request.getDistrictName());
        address.setWardId(request.getWardId());
        address.setWardName(request.getWardName());
        address.setStreetDetail(request.getStreetDetail());
        address.setIsDefault(request.getIsDefault());

        Address savedAddress = addressRepository.save(address);
        return AddressResponse.from(savedAddress);
    }

    @Transactional
    public void deleteAddress(Long userId, Long addressId) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy địa chỉ"));
                
        if (!address.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Bạn không có quyền xóa địa chỉ này");
        }

        if (address.getIsDefault()) {
            throw new IllegalArgumentException("Không thể xóa địa chỉ mặc định, vui lòng chọn địa chỉ khác làm mặc định trước");
        }

        addressRepository.delete(address);
    }
}
