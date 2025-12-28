package com.dbarchitect.backend.utils;

import com.dbarchitect.backend.entities.DesignProject;
import com.dbarchitect.backend.repositories.DesignProjectRepository;
import com.wn.dbml.compiler.DbmlParser;
import com.wn.dbml.model.*;
import freemarker.template.Configuration;
import freemarker.template.Template;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.io.ByteArrayOutputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import org.springframework.ui.freemarker.FreeMarkerTemplateUtils;

@Service
public class CodeGenerator {
    private final Configuration freemarkerConfig;
    private final DesignProjectRepository designProjectRepository;

    public CodeGenerator(Configuration freemarkerConfig, DesignProjectRepository designProjectRepository) {
        this.freemarkerConfig = freemarkerConfig;
        this.designProjectRepository = designProjectRepository;
    }

//    public Map<String, String> generateAllEntities(String dbmlContent) throws Exception {
//        // 1. Parse DBML
//        System.out.println(dbmlContent);
//        Database db = DbmlParser.parse(dbmlContent);
//        Map<String, String> generatedFiles = new HashMap<>(); // Key: ClassName, Value: SourceCode
//
//        // 2. Duyệt qua tất cả các Schema
//        Schema schema = db.getSchema("public");
//            // 3. Duyệt qua tất cả các Table trong từng Schema
//        for (Table table : schema.getTables()) {
//
//            // Tái sử dụng logic chuẩn bị dataModel cho từng table
//            Map<String, Object> dataModel = prepareDataModel(table);
//
//            // Render code cho table hiện tại
//            Template template = freemarkerConfig.getTemplate("entity.ftl");
//            String sourceCode = FreeMarkerTemplateUtils.processTemplateIntoString(template, dataModel);
//
//            String className = StringUtils.capitalize(table.getName());
//            generatedFiles.put(className, sourceCode);
//        }
//
//        return generatedFiles;
//    }

    // Tách logic chuẩn bị dữ liệu ra hàm riêng để code sạch hơn
    private Map<String, Object> prepareDataModel(Table table, Database db) {
        Map<String, Object> dataModel = new HashMap<>();
        dataModel.put("packageName", "com.example.demo");
        dataModel.put("tableName", table.getName());
        String className = StringUtils.capitalize(table.getName());
        dataModel.put("className", className);

        // Xác định ID Type cho Repository/Service
        Column idCol = table.getColumns().stream()
                .filter(col -> col.getSettings().containsKey(ColumnSetting.PRIMARY_KEY))
                .findFirst()
                .orElse(null);
        if (idCol != null) {
            dataModel.put("hasIncrement", idCol.getSettings().containsKey(ColumnSetting.INCREMENT));
            dataModel.put("idType", mapSqlToJavaType(idCol.getType()));
        } else {
            dataModel.put("hasIncrement", false);
        }

        List<String> imports = new ArrayList<>();
        List<Map<String, Object>> fields = new ArrayList<>();
        List<Map<String, Object>> manyToOneRels = new ArrayList<>();
        List<Map<String, Object>> oneToManyRels = new ArrayList<>();

        // 1. Lấy danh sách các cột Khóa ngoại (FK) để tránh gen trùng field cơ bản
        List<String> fkColumnNames = new ArrayList<>();

        // 2. Duyệt quan hệ trong toàn bộ Database
        db.getRelationships().forEach(rel -> {
                // Lấy thông tin Table từ List<Column> (giả định quan hệ đơn cột)
                Table fromTable = rel.getFrom().get(0).getTable();
                Table toTable = rel.getTo().get(0).getTable();

                // TRƯỜNG HỢP A: Bảng hiện tại chứa Khóa ngoại (Many-to-One)
                // Ví dụ: Books.author_id > Authors.id (Books là From)
                if (fromTable.getName().equals(table.getName())) {
                    Map<String, Object> mto = new HashMap<>();
                    String fkColName = rel.getFrom().get(0).getName();
                    fkColumnNames.add(fkColName);

                    mto.put("joinColumn", fkColName);
                    mto.put("targetClass", StringUtils.capitalize(toTable.getName()));
                    mto.put("fieldName", toCamelCase(toTable.getName()));
                    manyToOneRels.add(mto);
                }

                // TRƯỜNG HỢP B: Bảng hiện tại được tham chiếu bởi bảng khác (One-to-Many)
                // Ví dụ: Books.author_id > Authors.id (Authors là To)
                if (toTable.getName().equals(table.getName())) {
                    Map<String, Object> otm = new HashMap<>();
                    otm.put("targetClass", StringUtils.capitalize(fromTable.getName()));
                    otm.put("fieldName", toCamelCase(fromTable.getName()) + "s"); // plural
                    otm.put("mappedBy", toCamelCase(toTable.getName())); // field name bên kia
                    oneToManyRels.add(otm);

                    if (!imports.contains("java.util.List")) {
                        imports.add("java.util.List");
                    }
                }
            });

        // 3. Xử lý các Fields cơ bản (Bỏ qua các cột đã là FK)
        table.getColumns().forEach(col -> {
            if (!fkColumnNames.contains(col.getName())) {
                Map<String, Object> field = new HashMap<>();
                String javaType = mapSqlToJavaType(col.getType());
                field.put("columnName", col.getName());
                field.put("fieldName", toCamelCase(col.getName()));
                field.put("javaType", javaType);
                field.put("isId", col.getSettings().containsKey(ColumnSetting.PRIMARY_KEY));
                fields.add(field);

                if (javaType.equals("BigDecimal") && !imports.contains("java.math.BigDecimal")) imports.add("java.math.BigDecimal");
                if (javaType.equals("LocalDateTime") && !imports.contains("java.time.LocalDateTime")) imports.add("java.time.LocalDateTime");
            }
        });

        dataModel.put("fields", fields);
        dataModel.put("manyToOneRels", manyToOneRels);
        dataModel.put("oneToManyRels", oneToManyRels);
        dataModel.put("imports", imports);

        return dataModel;
    }

    // Hàm phụ trợ convert snake_case sang camelCase
    private String toCamelCase(String source) {
        StringBuilder result = new StringBuilder();
        boolean nextUpper = false;
        for (char c : source.toCharArray()) {
            if (c == '_') {
                nextUpper = true;
            } else {
                if (nextUpper) {
                    result.append(Character.toUpperCase(c));
                    nextUpper = false;
                } else {
                    result.append(c);
                }
            }
        }
        return result.toString();
    }

    // Hàm phụ trợ map kiểu dữ liệu DBML sang Java
    private String mapSqlToJavaType(String sqlType) {
        if (sqlType.equalsIgnoreCase("varchar")) return "String";
        if (sqlType.equalsIgnoreCase("int")) return "Integer";
        if (sqlType.equalsIgnoreCase("boolean")) return "Boolean";
        if (sqlType.equalsIgnoreCase("datetime")) return "LocalDateTime";
        return "String";
    }

//    public byte[] generateProjectZip(Long projectId) throws Exception {
//        DesignProject project = designProjectRepository.findById(projectId).isPresent() ?
//                designProjectRepository.findById(projectId).get() : null;
//        if (project == null) {
//            throw new IllegalArgumentException("Project với ID " + projectId + " không tồn tại.");
//        }
//
//        Map<String, String> codeMap = generateAllEntities(DBMLCode.extractCleanDbmlCode(project.getRawDbmlCode()));
//        ByteArrayOutputStream baos = new ByteArrayOutputStream();
//
//        try (ZipOutputStream zos = new ZipOutputStream(baos)) {
//            for (Map.Entry<String, String> entry : codeMap.entrySet()) {
//                // Tạo file .java cho từng Entity
//                ZipEntry ze = new ZipEntry("src/main/java/com/example/demo/entity/" + entry.getKey() + ".java");
//                zos.putNextEntry(ze);
//                zos.write(entry.getValue().getBytes());
//                zos.closeEntry();
//            }
//        }
//        return baos.toByteArray();
//    }

    public byte[] generateProjectZip(Long projectId) throws Exception {
        DesignProject project = designProjectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project ID " + projectId + " không tồn tại."));

        List<GeneratedFile> generatedFiles = generateAllSourceFiles(DBMLCode.extractCleanDbmlCode(project.getRawDbmlCode()));

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        String basePackagePath = "src/main/java/com/example/demo/";

        try (ZipOutputStream zos = new ZipOutputStream(baos)) {
            for (GeneratedFile file : generatedFiles) {
                ZipEntry ze = new ZipEntry(basePackagePath + file.path());
                zos.putNextEntry(ze);
                zos.write(file.content().getBytes());
                zos.closeEntry();
            }
        }
        return baos.toByteArray();
    }

    // Thêm record phụ trợ bên trong hoặc ngoài class
    private record GeneratedFile(String path, String content) {}

    public List<GeneratedFile> generateAllSourceFiles(String dbmlContent) throws Exception {
        Database db = DbmlParser.parse(dbmlContent);
        List<GeneratedFile> files = new ArrayList<>();
        Schema schema = db.getSchema("public");

        for (Table table : schema.getTables()) {
            Map<String, Object> dataModel = prepareDataModel(table, db);
            String className = (String) dataModel.get("className");

            // 1. Render Entity
            files.add(renderFile("entity.ftl", dataModel, "entity/" + className + ".java"));

            // 2. Render Repository
            files.add(renderFile("repository.ftl", dataModel, "repository/" + className + "Repository.java"));

            // 3. Render Service
            files.add(renderFile("service.ftl", dataModel, "service/" + className + "Service.java"));

            // 4. Render Controller
            files.add(renderFile("controller.ftl", dataModel, "controller/" + className + "Controller.java"));
        }
        return files;
    }

    // Hàm phụ trợ để render nhanh
    private GeneratedFile renderFile(String templateName, Map<String, Object> model, String path) throws Exception {
        Template template = freemarkerConfig.getTemplate(templateName);
        String code = FreeMarkerTemplateUtils.processTemplateIntoString(template, model);
        return new GeneratedFile(path, code);
    }
}
