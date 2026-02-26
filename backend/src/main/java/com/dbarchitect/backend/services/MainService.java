package com.dbarchitect.backend.services;

import com.dbarchitect.backend.entities.CodeChange;
import com.dbarchitect.backend.entities.DesignProject;
import com.dbarchitect.backend.entities.FileNode;
import com.dbarchitect.backend.repositories.DesignProjectRepository;
import com.dbarchitect.backend.requests.GenerateDBMLRequest;
import com.dbarchitect.backend.responses.DesignProjectResponse;
import com.dbarchitect.backend.utils.CodeGenerator;
import com.dbarchitect.backend.utils.DBMLCode;
import com.dbarchitect.backend.utils.ProjectTreeBuilder;
import com.github.javaparser.StaticJavaParser;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.body.FieldDeclaration;
import org.springframework.stereotype.Service;
import com.dbarchitect.backend.utils.DBMLGenerator;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class MainService {
    private final DBMLGenerator dbmlGenerator;
    private final CodeGenerator codeGenerator;
    private final DesignProjectRepository designProjectRepository;

    public MainService(CodeGenerator codeGenerator, DesignProjectRepository designProjectRepository) {
        this.codeGenerator = codeGenerator;
        this.dbmlGenerator = new DBMLGenerator();
        this.designProjectRepository = designProjectRepository;
    }

    public DesignProjectResponse generateDbml(GenerateDBMLRequest request) {
        DBMLCode dbmlCode = dbmlGenerator.generateDbmlCode(request.getSystemDescription(), request.getModelName());

        DesignProject designProject = new DesignProject();
        designProject.setName(request.getProjectName());
        designProject.setRawDbmlCode(dbmlCode.getRawDbmlCode());
        designProjectRepository.save(designProject);

        DesignProjectResponse response = new DesignProjectResponse();
        response.setCleanDbmlCode(dbmlCode.extractCleanDbmlCode());
        response.setProjectId(designProject.getId());
        response.setProjectName(designProject.getName());
        return response;
    }

    public byte[] generateProjectZip(Long projectId) throws Exception {
        return codeGenerator.generateProjectZip(projectId);
    }

    public FileNode generateProjectPreview(String dbmlContent) {
        try {
            String clean = DBMLCode.extractCleanDbmlCode(dbmlContent);
            List<java.util.Map<String, String>> files = codeGenerator.generateFilesFromDbml(clean);
            List<FileNode> nodes = new ArrayList<>();
            String basePackagePath = "src/main/java/com/example/demo/";
            for (var m : files) {
                String path = basePackagePath + m.get("path");
                String fileName = path.contains("/") ? path.substring(path.lastIndexOf('/') + 1) : path;
                FileNode node = new FileNode(fileName, "file", path);
                node.setContent(m.get("content"));
                node.setLanguage(detectLanguage(fileName));
                nodes.add(node);
            }
            return ProjectTreeBuilder.buildTree(nodes, "PreviewProject");
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public FileNode generateProjectPreview(Long projectId) {
        try {
            // Tải dự án từ DB
            DesignProject project = designProjectRepository.findById(projectId).orElse(null);
            if (project == null) {
                return null;
            }

            // Giả mã DBML và tạo cây tệp
            byte[] projectZip = codeGenerator.generateProjectZip(projectId);
            return ProjectTreeBuilder.buildTreeFromZip(projectZip, project.getName());
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public DesignProject getDesignProjectById(Long projectId) {
        return designProjectRepository.findById(projectId).orElse(null);
    }

    public DesignProject updateProjectDbml(Long projectId, String rawDbmlCode) {
        var projectOpt = designProjectRepository.findById(projectId);
        if (projectOpt.isEmpty()) return null;
        DesignProject project = projectOpt.get();
        project.setRawDbmlCode(rawDbmlCode);
        // Optionally update status or record a change; for now we just save
        designProjectRepository.save(project);
        return project;
    }

    public List<DesignProject> getAllDesignProjects() {
        return designProjectRepository.findAll();
    }

    // Simple language detection (same rules as ProjectTreeBuilder)
    private String detectLanguage(String fileName) {
        String lower = fileName.toLowerCase();
        if (lower.endsWith(".java")) return "java";
        if (lower.endsWith(".xml")) return "xml";
        if (lower.endsWith(".sql")) return "sql";
        if (lower.endsWith(".yml") || lower.endsWith(".yaml")) return "yaml";
        if (lower.endsWith(".json")) return "json";
        return "text";
    }

    public List<CodeChange> compareCode(String oldSource, String newSource) {
        List<CodeChange> changes = new ArrayList<>();

        // 1. Parse chuỗi String thành Cây AST
        CompilationUnit cuOld = StaticJavaParser.parse(oldSource);
        CompilationUnit cuNew = StaticJavaParser.parse(newSource);

        // 2. Trích xuất các Fields (Thuộc tính) thành Map để dễ so sánh
        Map<String, String> fieldsOld = extractFields(cuOld);
        Map<String, String> fieldsNew = extractFields(cuNew);

        // 3. So sánh: Tìm cái mới thêm hoặc bị sửa
        fieldsNew.forEach((name, type) -> {
            if (!fieldsOld.containsKey(name)) {
                changes.add(new CodeChange(name, "FIELD", "ADDED", "Kiểu dữ liệu: " + type));
            } else if (!fieldsOld.get(name).equals(type)) {
                changes.add(new CodeChange(name, "FIELD", "MODIFIED",
                        "Đổi từ " + fieldsOld.get(name) + " sang " + type));
            }
        });

        // 4. So sánh: Tìm cái bị xóa
        fieldsOld.keySet().forEach(name -> {
            if (!fieldsNew.containsKey(name)) {
                changes.add(new CodeChange(name, "FIELD", "REMOVED", "Đã xóa thuộc tính này"));
            }
        });

        return changes;
    }

    private Map<String, String> extractFields(CompilationUnit cu) {
        Map<String, String> fieldMap = new HashMap<>();
        // Tìm tất cả các khai báo biến trong Class
        cu.findAll(FieldDeclaration.class).forEach(f -> {
            f.getVariables().forEach(v -> {
                fieldMap.put(v.getNameAsString(), v.getTypeAsString());
            });
        });
        return fieldMap;
    }
}
