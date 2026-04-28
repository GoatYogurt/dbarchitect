package com.dbarchitect.backend.entities;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class CodeChange {
    private String element; // Tên (vd: tên biến, tên hàm)
    private String type;    // Loại (FIELD, METHOD, ANNOTATION)
    private String action;  // ADDED, REMOVED, MODIFIED
    private String detail;  // Mô tả chi tiết (vd: đổi kiểu dữ liệu từ Int sang String)
    private String filePath; // file path where the change occurred (optional)
    private Integer lineNumber; // line number in file where the change occurred (optional)

    // Keep compatibility with existing code that used a 4-argument constructor
    public CodeChange(String element, String type, String action, String detail) {
        this.element = element;
        this.type = type;
        this.action = action;
        this.detail = detail;
    }
}
