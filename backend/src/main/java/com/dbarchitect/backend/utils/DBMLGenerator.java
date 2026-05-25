package com.dbarchitect.backend.utils;

import static com.dbarchitect.backend.utils.Constants.MODELS_MAP;

public class DBMLGenerator {
    public DBMLGenerator() {
    }

    public DBMLCode generateDbmlCode(String systemDescription, String modelName) {
        if (!MODELS_MAP.containsKey(modelName)) {
            throw new IllegalArgumentException("Model không hợp lệ: " + modelName);
        }

        String mockDbmlText = generateMockDbml(systemDescription);

        return new DBMLCode(mockDbmlText);
    }

    private String generateMockDbml(String systemDescription) {
        return """
            ```dbml            
            Table Users {
              id INT [pk, increment]
              username VARCHAR(50) [unique, not null]
              email VARCHAR(100) [unique, not null]
              is_deleted BOOLEAN [default: false]
              created_at DATETIME [default: `now()`]
              updated_at DATETIME [default: `now()`]
              deleted_at DATETIME [null]
            }

            Table Projects {
              id INT [pk, increment]
              user_id INT [not null]
              name VARCHAR(255) [not null]
              dbml_content TEXT
              is_deleted BOOLEAN [default: false]
              created_at DATETIME [default: `now()`]
              updated_at DATETIME [default: `now()`]
              deleted_at DATETIME [null]
            }

            Ref: Projects.user_id > Users.id
            ```
            """;
    }
}