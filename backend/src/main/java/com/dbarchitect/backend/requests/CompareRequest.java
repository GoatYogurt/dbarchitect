package com.dbarchitect.backend.requests;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CompareRequest {
    private Integer projectId;
    private String newDbmlCode;
}
