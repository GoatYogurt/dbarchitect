package com.dbarchitect.backend.utils;

import com.dbarchitect.backend.entities.Project;
import com.dbarchitect.backend.repositories.ProjectRepository;
import com.wn.dbml.compiler.DbmlParser;
import com.wn.dbml.model.*;
import freemarker.template.Configuration;
import freemarker.template.Template;
import org.jspecify.annotations.NonNull;
import org.springframework.beans.factory.annotation.Autowired;
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
    @Autowired
    private final Configuration freemarkerConfig;

    @Autowired
    private final ProjectRepository projectRepository;

    public CodeGenerator(Configuration freemarkerConfig, ProjectRepository projectRepository) {
        this.freemarkerConfig = freemarkerConfig;
        this.projectRepository = projectRepository;
    }

    // hàm phụ trợ để chuẩn bị data model cho Freemarker template dựa trên thông tin của Table và toàn bộ Database (để detect quan hệ)
    private Map<String, Object> prepareDataModel(Table table, Database db) {
        Map<String, Object> dataModel = new HashMap<>();
        dataModel.put("packageName", "com.example.demo");
        dataModel.put("tableName", table.getName());
        String className = StringUtils.capitalize(table.getName());
        dataModel.put("className", className);

        // detect if there's a primary key column and if it has auto-increment, to 
        // determine if should add @GeneratedValue and what type the ID field should be
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

        // Lấy danh sách các cột Khóa ngoại (FK) để tránh gen trùng field cơ bản
        List<String> fkColumnNames = new ArrayList<>();

        // 2. Duyệt quan hệ trong toàn bộ Database
        db.getRelationships().forEach(rel -> {
                // Lấy thông tin Table từ List<Column> (giả định quan hệ đơn cột)
                Table fromTable = rel.getFrom().getFirst().getTable();
                Table toTable = rel.getTo().getFirst().getTable();

                // TRƯỜNG HỢP A: Bảng hiện tại chứa Khóa ngoại (Many-to-One)
                // Ví dụ: Books.author_id > Authors.id (Books là From)
                if (fromTable.getName().equals(table.getName())) {
                    Map<String, Object> mto = new HashMap<>();
                    String fkColName = rel.getFrom().getFirst().getName();
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
                field.put("unique", col.getSettings().containsKey(ColumnSetting.UNIQUE));
                field.put("nullable", !col.getSettings().containsKey(ColumnSetting.NOT_NULL));
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

    // helper function to map dbml type to java
    private String mapSqlToJavaType(String sqlType) {
        if (sqlType == null) return "Object";

        // eliminate data type parameters (for example: varchar(255) -> varchar)
        String baseType = sqlType.toLowerCase().split("\\(")[0].trim();

        switch (baseType) {
            case "varchar":
            case "text":
            case "char":
            case "character varying":
                return "String";

            case "int":
            case "integer":
            case "serial":
                return "Integer";
            case "bigint":
            case "bigserial":
                return "Long";
            case "smallint":
                return "Short";

            case "numeric":
            case "decimal":
                return "BigDecimal";
            case "real":
            case "float4":
                return "Float";
            case "double precision":
            case "float8":
                return "Double";

            case "boolean":
            case "bool":
                return "Boolean";

            case "date":
                return "LocalDate";
            case "timestamp":
            case "timestamptz":
            case "datetime":
                return "LocalDateTime";
            case "time":
                return "LocalTime";

            case "uuid":
                return "UUID";
            case "json":
            case "jsonb":
                return "String";

            default:
                return "String";
        }
    }

    public byte[] generateProjectZip(Long projectId) throws Exception {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project ID " + projectId + " không tồn tại."));
        List<GeneratedFile> generatedFiles = generateAllSourceFiles(DBMLCode.extractCleanDbmlCode(project.getRawDbmlCode()));

        ByteArrayOutputStream baos = new ByteArrayOutputStream();

        try (ZipOutputStream zos = new ZipOutputStream(baos)) {
            for (GeneratedFile file : generatedFiles) {
                ZipEntry ze = new ZipEntry(file.path());
                zos.putNextEntry(ze);
                zos.write(file.content().getBytes());
                zos.closeEntry();
            }
        }
        return baos.toByteArray();
    }

    // Hàm phụ trợ để render nhanh
    private GeneratedFile renderFile(String templateName, Map<String, Object> model, String path) throws Exception {
        Template template = freemarkerConfig.getTemplate(templateName);
        String code = FreeMarkerTemplateUtils.processTemplateIntoString(template, model);
        return new GeneratedFile(path, code);
    }

    /**
     * Public helper to generate a simplified list of files (path + content) from DBML content.
     * This wrapper exists so callers outside this class don't need to reference the private GeneratedFile record.
     */
    public List<Map<String, String>> generateFilesFromDbml(String dbmlContent) throws Exception {
        List<GeneratedFile> files = generateAllSourceFiles(dbmlContent);
        List<Map<String, String>> out = new ArrayList<>();
        for (GeneratedFile f : files) {
            Map<String, String> m = new HashMap<>();
            m.put("path", f.path());
            m.put("content", f.content());
            out.add(m);
        }
        return out;
    }

    private record GeneratedFile(String path, String content) {}

    /**
     * hàm chính để tạo source code từ dbml
     */
    private List<GeneratedFile> generateAllSourceFiles(String dbmlContent) throws Exception {
        System.out.println(dbmlContent);
        Database db = DbmlParser.parse(dbmlContent);
        List<GeneratedFile> files = new ArrayList<>();
        Schema schema = db.getSchema("public");

        for (Table table : schema.getTables()) {
            // chuẩn bị data model cho từng table
            Map<String, Object> dataModel = prepareDataModel(table, db);


            String className = (String) dataModel.get("className");

            // render Entity
            files.add(renderFile("entity.ftl", dataModel, "entity/" + className + ".java"));

            // 2. render Repository
            files.add(renderFile("repository.ftl", dataModel, "repository/" + className + "Repository.java"));

            // 3. render Service
            files.add(renderFile("service.ftl", dataModel, "service/" + className + "Service.java"));

            // 4. render Controller
            files.add(renderFile("controller.ftl", dataModel, "controller/" + className + "Controller.java"));
        }

        // thêm các file tĩnh như pom.xml, Dockerfile, mvnw,... vào output (đọc từ resources/static-templates)
        String[][] staticFiles = new String[][]{
                {"static-templates/pom.xml", "pom.xml"},
                {"static-templates/mvnw", "mvnw"},
                {"static-templates/mvnw.cmd", "mvnw.cmd"},
                {"static-templates/Dockerfile", "Dockerfile"},
                {"static-templates/docker-compose.yml", "docker-compose.yml"},
                {"static-templates/README.md", "README.md"},
                {"static-templates/Application.java", "src/main/java/com/example/demo/Application.java"},
                {"static-templates/application.properties", "src/main/resources/application.properties"}
        };

        for (String[] pair : staticFiles) {
            String res = pair[0];
            String outName = pair[1];
            try (var is = this.getClass().getClassLoader().getResourceAsStream(res)) {
                if (is != null) {
                    byte[] b = is.readAllBytes();
                    files.add(new GeneratedFile(outName, new String(b)));
                }
            }
        }

        // Relocate java source files to standard Maven layout

        return getGeneratedFiles(files);
    }

    private static @NonNull List<GeneratedFile> getGeneratedFiles(List<GeneratedFile> files) {
        List<GeneratedFile> relocated = new ArrayList<>();
        for (GeneratedFile f : files) {
            String p = f.path();
            if (p.endsWith(".java") && !p.startsWith("src/")) {
                p = "src/main/java/com/example/demo/" + p;
            } else if (p.endsWith(".properties") && !p.startsWith("src/")) {
                p = "src/main/resources/" + p;
            } else if (p.startsWith("entity/") || p.startsWith("repository/") || p.startsWith("service/") || p.startsWith("controller/")) {
                p = "src/main/java/com/example/demo/" + p;
            }
            relocated.add(new GeneratedFile(p, f.content()));
        }
        return relocated;
    }
}