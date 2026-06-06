package com.peaksneaker.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Page;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PaginatedResponse<T> {
    private List<T> items;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
    private boolean last;

    public static <T> PaginatedResponse<T> from(Page<T> pageResult) {
        return PaginatedResponse.<T>builder()
                .items(pageResult.getContent())
                .page(pageResult.getNumber())
                .size(pageResult.getSize())
                .totalElements(pageResult.getTotalElements())
                .totalPages(pageResult.getTotalPages())
                .last(pageResult.isLast())
                .build();
    }
}
