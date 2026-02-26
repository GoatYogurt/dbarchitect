package com.dbarchitect.backend.entities;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class CodeChange {
    private String element; // Tên (vd: tên biến, tên hàm)
    private String type;    // Loại (FIELD, METHOD, ANNOTATION)
    private String action;  // ADDED, REMOVED, MODIFIED
    private String detail;  // Mô tả chi tiết (vd: đổi kiểu dữ liệu từ Int sang String)
}
