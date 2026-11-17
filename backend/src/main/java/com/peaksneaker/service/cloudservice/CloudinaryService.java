package com.peaksneaker.service.cloudservice;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.peaksneaker.config.CloudinaryConfig;
import com.peaksneaker.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CloudinaryService {
    private final Cloudinary cloudinary;
    private final CloudinaryConfig cloudinaryConfig;

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

    public String upload(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File tải lên không được để trống.");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BadRequestException("Dung lượng file vượt quá giới hạn cho phép (tối đa 5MB).");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new BadRequestException("Chỉ chấp nhận file hình ảnh hợp lệ (JPEG, PNG, WEBP, v.v.).");
        }

        String originalName = file.getOriginalFilename();
        String extension = "";
        if (originalName != null && originalName.contains(".")) {
            extension = originalName.substring(originalName.lastIndexOf(".")).toLowerCase();
        } else {
            extension = ".jpg";
        }

        // Tạo tên định danh duy nhất chống xung đột và ghi đè
        String publicId = UUID.randomUUID().toString().replace("-", "");
        String uniqueImageName = publicId + extension;

        cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                "public_id", publicId,
                "overwrite", false,
                "unique_filename", true,
                "resource_type", "image"
        ));

        return uniqueImageName;
    }

    public boolean delete(String imageName) throws IOException {
        if (imageName == null || imageName.isBlank()) {
            return false;
        }
        String publicId = imageName.contains(".") ? imageName.substring(0, imageName.lastIndexOf(".")) : imageName;
        Map<?, ?> result = cloudinary.uploader().destroy(publicId, ObjectUtils.asMap("resource_type", "image"));
        return "ok".equals(result.get("result"));
    }

    public String creteImageUrl(String imageName) {
        if (imageName == null || imageName.isBlank()) {
            return null;
        }
        if (imageName.startsWith("http://") || imageName.startsWith("https://")) {
            return imageName;
        }
        return cloudinaryConfig.getBaseUrl() + imageName;
    }
}
