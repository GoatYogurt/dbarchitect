package com.dbarchitect.backend.utils;

// Thay đổi imports để phù hợp với cú pháp xây dựng Content/Config
import com.google.genai.Client;
import com.google.genai.types.GenerateContentResponse;
import com.google.genai.types.GenerateContentConfig;
import com.google.genai.types.Content;
import com.google.genai.types.Part;

import java.util.Collections; // Cần cho Collections.singletonList

import static com.dbarchitect.backend.utils.Constants.MODELS_MAP;

public class DBMLGenerator {

    private final Client client;

    public DBMLGenerator() {
        // Khởi tạo Client. Nó tự động lấy GOOGLE_API_KEY từ biến môi trường.
        this.client = new Client();
    }

    /**
     * Phương thức chính để tạo mã DBML từ mô tả hệ thống.
     * @param systemDescription Mô tả kỹ thuật của hệ thống (Prompt của người dùng).
     * @return Mã DBML đã được làm sạch.
     */
    public DBMLCode generateDbmlCode(String systemDescription, String modelName) {
        if (!MODELS_MAP.containsKey(modelName)) {
            throw new IllegalArgumentException("Model không hợp lệ: " + modelName);
        }

        // --- 1. System Instruction (Điều hướng AI) ---
        Content systemInstruction = buildSystemInstruction();

        // --- 2. Xây dựng Content (Yêu cầu người dùng) ---
        Content userContent = Content.builder()
                .role("user")
                .parts(Collections.singletonList(
                        Part.builder().text(systemDescription).build()
                ))
                .build();

        // --- 3. Định cấu hình (Điều chỉnh tham số) ---
        GenerateContentConfig config = GenerateContentConfig.builder()
                .systemInstruction(systemInstruction) // Gắn System Instruction vào Config
                .temperature(0.2f) // Nhiệt độ thấp cho tác vụ sinh code chính xác
                .maxOutputTokens(2048) // Đủ token cho mã DBML lớn
                .build();

        // --- 4. Gọi API (Sửa lỗi cú pháp) ---
        try {
            // Cú pháp đúng: client.generateContent(...)
            GenerateContentResponse response = client.models.generateContent(
                    modelName,
                    Collections.singletonList(userContent),
                    config
            );

            String generatedText = response.text();

            // Xử lý để chỉ lấy phần code DBML
            return new DBMLCode(generatedText);

        } catch (Exception e) {
            System.err.println("Lỗi gọi Gemini API: " + e.getMessage());
            e.printStackTrace();
            return new DBMLCode(""); // Trả về chuỗi rỗng trong trường hợp lỗi
        }
    }

    /**
     * Định nghĩa System Instruction chi tiết để định hướng đầu ra DBML.
     */
    private Content buildSystemInstruction() {
        return Content.fromParts(Part.fromText(
            """
            You are an expert database architect and DBML code generator.
            Your task is to convert a user's system requirements into normalized and valid DBML code for a MySQL/PostgreSQL database.
            
            RULES:
            1. ONLY output the raw DBML code within a single markdown block (```dbml ... ```).
            2. DO NOT include any explanation, introductory text, or notes outside the code block.
            3. Ensure tables have appropriate primary keys ([pk]), foreign keys ([ref: > Table.column]), and suitable data types (e.g., INT, VARCHAR, DATETIME).
            4. No on update for timestamps. Use default: `now()` for created_at and updated_at.
            5. Include soft delete column (deleted_at DATETIME [null] and is_deleted bool) in all tables.
            6. With join tables for many-to-many relationships, dont use snake_case for table name, use PascalCase instead.
            
            Example Format:
            ```dbml
            Table User {
              id INT [pk]
              username VARCHAR(50) [unique, not null]
              created_at DATETIME [default: `now()`]
              updated_at DATETIME [default: `now()`]
              deleted_at DATETIME [null]
              ...
            }
            Table Product {
              id INT [pk]
              name VARCHAR(255) [not null]
              ...
            }
            Ref: Product.user_id > User.id
            ```
            """));
    }

//    /**
//     * Hàm helper để trích xuất nội dung DBML thuần túy từ khối markdown.
//     */
//    private String extractDbmlCode(String generatedText) {
//        String startDelimiter = "```dbml";
//        String endDelimiter = "```";
//
//        int startIndex = generatedText.indexOf(startDelimiter);
//        if (startIndex != -1) {
//            startIndex += startDelimiter.length();
//            int endIndex = generatedText.indexOf(endDelimiter, startIndex);
//            if (endIndex != -1) {
//                return generatedText.substring(startIndex, endIndex).trim();
//            }
//        }
//        return generatedText; // Trả về toàn bộ nếu không tìm thấy khối DBML
//    }

//    public static void main(String[] args) {
//        DBMLGenerator generator = new DBMLGenerator();
//
//        // Yêu cầu kỹ thuật của bạn
//        String systemRequirements = "Thiết kế cơ sở dữ liệu cho một hệ thống quản lý thư viện. Cần các thực thể: Sách (title, isbn, publication_year, author_id), Tác giả (name, bio), Người dùng (name, email, phone), và Mượn/Trả (user_id, book_id, borrow_date, return_date).";
//
//        System.out.println("Gửi yêu cầu tới Gemini để sinh code DBML...");
//        String dbmlCode = generator.generateDbmlCode(systemRequirements, "gemini-2.5-flash");
//
//        System.out.println("\n--- MÃ DBML ĐÃ SINH ---\n");
//        System.out.println(dbmlCode);
//        System.out.println("\n----------------------------");
//    }
}