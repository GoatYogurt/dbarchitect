package com.dbarchitect.backend.responses;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProjectResponse {
    private Long projectId;
    private String projectName;
    private String cleanDbmlCode;
}
