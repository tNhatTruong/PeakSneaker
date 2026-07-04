package com.peaksneaker.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VoucherRequest {
    private String query;
    private Boolean isActive;
    
    @Builder.Default
    private int page = 0;
    
    @Builder.Default
    private int size = 10;
}
