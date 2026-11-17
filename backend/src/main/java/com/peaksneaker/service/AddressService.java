package com.peaksneaker.service;

import com.peaksneaker.dto.request.AddressRequest;
import com.peaksneaker.dto.response.AddressResponse;

import java.util.List;

public interface AddressService {
    AddressResponse createAddress(Long userId, AddressRequest request);
    List<AddressResponse> getUserAddresses(Long userId);
    AddressResponse updateAddress(Long userId, Long addressId, AddressRequest request);
    void deleteAddress(Long userId, Long addressId);
}
