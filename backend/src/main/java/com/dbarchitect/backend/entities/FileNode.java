package com.dbarchitect.backend.entities;

import lombok.Data;
import java.util.ArrayList;
import java.util.List;

@Data
public class FileNode {
    private String name;
    private String type; // "file" hoặc "folder"
    private String path;
    private String content; // Chỉ có giá trị nếu type là "file"
    private String language; // Ví dụ: "java", "xml", "sql"
    private List<FileNode> children = new ArrayList<>();

    public FileNode(String name, String type, String path) {
        this.name = name;
        this.type = type;
        this.path = path;
    }
}
