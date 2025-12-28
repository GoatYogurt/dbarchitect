package com.dbarchitect.backend.utils;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class DBMLCode {
    private String rawDbmlCode;

    public String extractCleanDbmlCode() {
        String startDelimiter = "```dbml";
        String endDelimiter = "```";

        int startIndex = rawDbmlCode.indexOf(startDelimiter);
        if (startIndex != -1) {
            startIndex += startDelimiter.length();
            int endIndex = rawDbmlCode.indexOf(endDelimiter, startIndex);
            if (endIndex != -1) {
                return rawDbmlCode.substring(startIndex, endIndex).trim();
            }
        }
        return rawDbmlCode;
    }

    public static String extractCleanDbmlCode(String rawDbmlCode) {
        String startDelimiter = "```dbml";
        String endDelimiter = "```";

        int startIndex = rawDbmlCode.indexOf(startDelimiter);
        if (startIndex != -1) {
            startIndex += startDelimiter.length();
            int endIndex = rawDbmlCode.indexOf(endDelimiter, startIndex);
            if (endIndex != -1) {
                return rawDbmlCode.substring(startIndex, endIndex).trim();
            }
        }
        return rawDbmlCode;
    }
}
