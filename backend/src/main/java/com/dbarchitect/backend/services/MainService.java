package com.dbarchitect.backend.services;

import com.dbarchitect.backend.entities.DesignProject;
import com.dbarchitect.backend.entities.FileNode;
import com.dbarchitect.backend.repositories.DesignProjectRepository;
import com.dbarchitect.backend.requests.GenerateDBMLRequest;
import com.dbarchitect.backend.responses.DesignProjectResponse;
import com.dbarchitect.backend.utils.CodeGenerator;
import com.dbarchitect.backend.utils.DBMLCode;
import com.dbarchitect.backend.utils.ProjectTreeBuilder;
import org.springframework.stereotype.Service;
import com.dbarchitect.backend.utils.DBMLGenerator;

import java.util.ArrayList;
import java.util.List;

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
}
