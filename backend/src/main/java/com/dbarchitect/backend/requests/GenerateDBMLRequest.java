package com.dbarchitect.backend.requests;

import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class GenerateDBMLRequest {
    private String projectName;
    private String systemDescription;
    private String modelName;
}
