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
import com.github.javaparser.ParseProblemException;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.body.FieldDeclaration;
import org.springframework.stereotype.Service;
import com.dbarchitect.backend.utils.DBMLGenerator;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
// ...existing code... (removed unused regex imports)
import java.util.Collections;

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

    public List<com.dbarchitect.backend.responses.FileDiff> compareCode(Integer projectId, String newDbmlCode) throws Exception {
        List<com.dbarchitect.backend.responses.FileDiff> fileDiffs = new ArrayList<>();

        DesignProject project = designProjectRepository.findById(projectId.longValue()).orElse(null);
        if (project == null) {
            com.dbarchitect.backend.responses.FileDiff fd = new com.dbarchitect.backend.responses.FileDiff();
            fd.setPath("N/A");
            fd.setOldContent(null);
            fd.setNewContent(null);
            fd.setChanges(Collections.singletonList(new CodeChange("N/A", "PROJECT", "NOT_FOUND", "Dự án không tồn tại")));
            fileDiffs.add(fd);
            return fileDiffs;
        }

        StringBuilder oldDbmlCode = new StringBuilder(project.getRawDbmlCode());
        List<Map<String, String>> oldSourceCodeFiles = codeGenerator.generateFilesFromDbml(DBMLCode.extractCleanDbmlCode(oldDbmlCode.toString()));
        List<Map<String, String>> newSourceCodeFiles = codeGenerator.generateFilesFromDbml(newDbmlCode);

        // Build maps keyed by path for easy pairing
        Map<String, String> oldByPath = new HashMap<>();
        for (Map<String, String> m : oldSourceCodeFiles) {
            String path = m.getOrDefault("path", "unknown");
            oldByPath.put(path, m.get("content"));
        }
        Map<String, String> newByPath = new HashMap<>();
        for (Map<String, String> m : newSourceCodeFiles) {
            String path = m.getOrDefault("path", "unknown");
            newByPath.put(path, m.get("content"));
        }

        // Union of all file paths
        var allPaths = new java.util.HashSet<String>();
        allPaths.addAll(oldByPath.keySet());
        allPaths.addAll(newByPath.keySet());

        // Compare file-by-file
        for (String path : allPaths) {
            String oldContent = oldByPath.get(path);
            String newContent = newByPath.get(path);

            com.dbarchitect.backend.responses.FileDiff fd = new com.dbarchitect.backend.responses.FileDiff();
            fd.setPath(path);
            fd.setOldContent(oldContent);
            fd.setNewContent(newContent);

            List<CodeChange> changes = new ArrayList<>();

            if (oldContent == null) {
                CodeChange cc = new CodeChange(path, "FILE", "ADDED", "File added");
                cc.setFilePath(path);
                cc.setLineNumber(1);
                changes.add(cc);
                fd.setChanges(changes);
                fileDiffs.add(fd);
                continue;
            }
            if (newContent == null) {
                CodeChange cc = new CodeChange(path, "FILE", "REMOVED", "File removed");
                cc.setFilePath(path);
                cc.setLineNumber(1);
                changes.add(cc);
                fd.setChanges(changes);
                fileDiffs.add(fd);
                continue;
            }

            // Both exist: parse and compare fields inside this file
            List<CompilationUnit> cusOld = parsePossiblyMultiple(oldContent);
            List<CompilationUnit> cusNew = parsePossiblyMultiple(newContent);
            Map<String, String> fieldsOld = extractFieldsFromCus(cusOld);
            Map<String, String> fieldsNew = extractFieldsFromCus(cusNew);

            // Parse compilation units to find line numbers for fields
            Map<String, Integer> fieldLinesOld = mapFieldToLine(cusOld);
            Map<String, Integer> fieldLinesNew = mapFieldToLine(cusNew);

            fieldsNew.forEach((name, type) -> {
                if (!fieldsOld.containsKey(name)) {
                    CodeChange cc = new CodeChange(name, "FIELD", "ADDED", "Kiểu dữ liệu: " + type);
                    cc.setFilePath(path);
                    cc.setLineNumber(fieldLinesNew.getOrDefault(name, 1));
                    changes.add(cc);
                } else if (!fieldsOld.get(name).equals(type)) {
                    CodeChange cc = new CodeChange(name, "FIELD", "MODIFIED",
                            "Đổi từ " + fieldsOld.get(name) + " sang " + type);
                    cc.setFilePath(path);
                    cc.setLineNumber(fieldLinesNew.getOrDefault(name, fieldLinesOld.getOrDefault(name, 1)));
                    changes.add(cc);
                }
            });

            fieldsOld.keySet().forEach(name -> {
                if (!fieldsNew.containsKey(name)) {
                    CodeChange cc = new CodeChange(name, "FIELD", "REMOVED", "Đã xóa thuộc tính này");
                    cc.setFilePath(path);
                    cc.setLineNumber(fieldLinesOld.getOrDefault(name, 1));
                    changes.add(cc);
                }
            });

            fd.setChanges(changes);
            fileDiffs.add(fd);
        }

        return fileDiffs;
    }

    // Backwards-compatible: flatten file diffs into a list of CodeChange objects
    public List<CodeChange> compareCodeAsFlat(Integer projectId, String newDbmlCode) throws Exception {
        List<com.dbarchitect.backend.responses.FileDiff> fds = compareCode(projectId, newDbmlCode);
        List<CodeChange> flat = new ArrayList<>();
        for (var fd : fds) {
            if (fd.getChanges() != null) flat.addAll(fd.getChanges());
        }
        return flat;
    }

    // Try to parse the provided source string into one or more CompilationUnits.
    // If parsing the whole string fails (e.g., it contains multiple concatenated files),
    // split by top-level `package` declarations and parse each piece separately.
    private List<CompilationUnit> parsePossiblyMultiple(String source) {
        if (source == null || source.trim().isEmpty()) return Collections.emptyList();

        // First, try parsing as a single compilation unit
        try {
            return Collections.singletonList(StaticJavaParser.parse(source));
        } catch (ParseProblemException ex) {
            // Fallback: split by package declarations (keep the 'package' keyword with lookahead)
            String[] parts = source.split("(?m)(?=^\\s*package\\b)");
            List<CompilationUnit> result = new ArrayList<>();
            for (String part : parts) {
                String trimmed = part.trim();
                if (trimmed.isEmpty()) continue;
                try {
                    result.add(StaticJavaParser.parse(part));
                } catch (ParseProblemException ex2) {
                    // As a last resort, try trimming trailing content after the last top-level '}'
                    int lastBrace = part.lastIndexOf('}');
                    if (lastBrace > 0) {
                        String maybe = part.substring(0, lastBrace + 1);
                        try {
                            result.add(StaticJavaParser.parse(maybe));
                            continue;
                        } catch (ParseProblemException ignored) {
                            // ignore and skip this part
                        }
                    }
                    // skip this part if still unparseable
                }
            }
            return result;
        }
    }

    private Map<String, String> extractFieldsFromCus(List<CompilationUnit> cus) {
        Map<String, String> fieldMap = new HashMap<>();
        for (CompilationUnit cu : cus) {
            if (cu == null) continue;
            cu.findAll(FieldDeclaration.class).forEach(f -> {
                f.getVariables().forEach(v -> {
                    fieldMap.put(v.getNameAsString(), v.getTypeAsString());
                });
            });
        }
        return fieldMap;
    }

    // Map field name to its starting line number in provided compilation units
    private Map<String, Integer> mapFieldToLine(List<CompilationUnit> cus) {
        Map<String, Integer> map = new HashMap<>();
        for (CompilationUnit cu : cus) {
            if (cu == null) continue;
            cu.findAll(FieldDeclaration.class).forEach(f -> {
                int line = f.getBegin().map(p -> p.line).orElse(1);
                f.getVariables().forEach(v -> {
                    map.put(v.getNameAsString(), line);
                });
            });
        }
        return map;
    }

    public List<Map<String, String>> generateFilesFromDbml(String cleanDbml) throws Exception {
        return codeGenerator.generateFilesFromDbml(cleanDbml);
    }
}
