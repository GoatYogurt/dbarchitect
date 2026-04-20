package com.dbarchitect.backend.responses;

import com.dbarchitect.backend.entities.AgentData;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class AgentResponse {
    private String status;
    private AgentData data;
}
