package com.dbarchitect.backend.requests;

import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class CreateProjectRequest {
    private String projectName;
    private String rawDbmlCode;
}
