package com.peaksneaker.service.impl;

import com.peaksneaker.dto.request.AddressRequest;
import com.peaksneaker.dto.response.AddressResponse;
import com.peaksneaker.entity.Address;
import com.peaksneaker.entity.User;
import com.peaksneaker.exception.BadRequestException;
import com.peaksneaker.exception.ResourceNotFoundException;
import com.peaksneaker.repository.AddressRepository;
import com.peaksneaker.repository.UserRepository;
import com.peaksneaker.service.AddressService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AddressServiceImpl implements AddressService {

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public AddressResponse createAddress(Long userId, AddressRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", "id", userId));

        if (Boolean.TRUE.equals(request.getIsDefault())) {
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
                .isDefault(Boolean.TRUE.equals(request.getIsDefault()))
                .build();

        Address savedAddress = addressRepository.save(address);
        return AddressResponse.from(savedAddress);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AddressResponse> getUserAddresses(Long userId) {
        return addressRepository.findByUserId(userId).stream()
                .map(AddressResponse::from)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AddressResponse updateAddress(Long userId, Long addressId, AddressRequest request) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new ResourceNotFoundException("Địa chỉ", "id", addressId));
                
        if (!address.getUser().getId().equals(userId)) {
            throw new BadRequestException("Bạn không có quyền sửa địa chỉ này");
        }

        if (Boolean.TRUE.equals(request.getIsDefault()) && !address.getIsDefault()) {
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
        address.setIsDefault(Boolean.TRUE.equals(request.getIsDefault()));

        Address savedAddress = addressRepository.save(address);
        return AddressResponse.from(savedAddress);
    }

    @Override
    @Transactional
    public void deleteAddress(Long userId, Long addressId) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new ResourceNotFoundException("Địa chỉ", "id", addressId));
                
        if (!address.getUser().getId().equals(userId)) {
            throw new BadRequestException("Bạn không có quyền xóa địa chỉ này");
        }

        if (address.getIsDefault()) {
            throw new BadRequestException("Không thể xóa địa chỉ mặc định, vui lòng chọn địa chỉ khác làm mặc định trước");
        }

        addressRepository.delete(address);
    }
}
