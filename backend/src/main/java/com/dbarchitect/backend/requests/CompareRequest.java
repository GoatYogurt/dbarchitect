package com.dbarchitect.backend.requests;

public class CompareRequest {
    private String oldCode;
    private String newCode;

    public String getOldCode() {
        return oldCode;
    }

    public void setOldCode(String oldDbmlCode) {
        this.oldCode = oldDbmlCode;
    }

    public String getNewCode() {
        return newCode;
    }

    public void setNewCode(String newCode) {
        this.newCode = newCode;
    }
}
