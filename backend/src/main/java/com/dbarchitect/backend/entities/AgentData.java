package com.dbarchitect.backend.entities;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class AgentData {
    @JsonProperty("is_clear")
    private boolean isClear;
    private List<QuestionDTO> questions;
    private Object specifications;

    @JsonProperty("dbml_code")
    private String dbmlCode;
}
