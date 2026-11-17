package com.peaksneaker.service;

import com.peaksneaker.dto.request.SilhouetteRequest;
import com.peaksneaker.dto.response.SilhouetteResponse;

import java.util.List;

public interface SilhouetteService {
    List<SilhouetteResponse> getSilhouettesByBrandId(Long brandId);
    List<SilhouetteResponse> getAllSilhouettes();
    SilhouetteResponse createSilhouette(SilhouetteRequest request);
    SilhouetteResponse updateSilhouette(Long id, SilhouetteRequest request);
    void deleteSilhouette(Long id);
}
