package com.dbarchitect.backend.requests;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GenerateCodeRequest {
    private String rawDbmlCode;
}
