package com.peaksneaker.service;

import com.peaksneaker.dto.response.SilhouetteResponse;
import com.peaksneaker.repository.SilhouetteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SilhouetteService {

    private final SilhouetteRepository silhouetteRepository;

    @Transactional(readOnly = true)
    public List<SilhouetteResponse> getSilhouettesByBrandId(Long brandId) {
        return silhouetteRepository.findByBrandIdAndIsDeletedFalse(brandId).stream()
                .map(SilhouetteResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SilhouetteResponse> getAllSilhouettes() {
        return silhouetteRepository.findByIsDeletedFalse().stream()
                .map(SilhouetteResponse::fromEntity)
                .collect(Collectors.toList());
    }
}
