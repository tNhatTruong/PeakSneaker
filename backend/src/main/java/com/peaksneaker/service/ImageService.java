package com.peaksneaker.service;

import com.peaksneaker.entity.Image;

import java.util.List;

public interface ImageService {
    Image getImageById(Long id);
    List<Image> getAllImages();
    void saveImage(Image image);
    void deleteImage(Image image);
}
