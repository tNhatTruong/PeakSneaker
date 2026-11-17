package com.peaksneaker.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoleResponse {
    private Integer id;
    private String code;
    private String name;
    private Integer hierarchyLevel;
    private String description;
    private Boolean isSystem;
    private List<String> permissions;
}

