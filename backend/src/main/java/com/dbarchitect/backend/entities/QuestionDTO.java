package com.dbarchitect.backend.entities;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Setter
@Getter
public class QuestionDTO {
    @JsonProperty("question_text")
    private String questionText;

    private String type;

    private List<String> options;
}
