package com.dbarchitect.backend.responses;

import com.dbarchitect.backend.entities.CodeChange;
import lombok.Data;

import java.util.List;

@Data
public class FileDiff {
    private String path;
    private String oldContent;
    private String newContent;
    private List<CodeChange> changes;
}

