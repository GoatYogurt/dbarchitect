package com.dbarchitect.backend.utils;
import com.dbarchitect.backend.entities.FileNode;

import java.util.List;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.io.IOException;
import java.util.ArrayList;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

public class ProjectTreeBuilder {

    public static FileNode buildTree(List<FileNode> flatFiles, String projectName) {
        // Tạo node gốc cho dự án
        FileNode root = new FileNode(projectName, "folder", projectName);

        for (FileNode file : flatFiles) {
            String[] parts = file.getPath().split("/");
            FileNode currentNode = root;
            StringBuilder currentPath = new StringBuilder(projectName);

            // Duyệt qua từng cấp thư mục trong đường dẫn
            for (int i = 0; i < parts.length; i++) {
                String part = parts[i];
                currentPath.append("/").append(part);

                // Kiểm tra xem node con đã tồn tại chưa
                FileNode nextNode = findChild(currentNode, part);

                if (nextNode == null) {
                    if (i == parts.length - 1) {
                        // Nếu là phần cuối cùng, đây là File
                        nextNode = file;
                    } else {
                        // Nếu chưa phải cuối, đây là Folder trung gian
                        nextNode = new FileNode(part, "folder", currentPath.toString());
                    }
                    currentNode.getChildren().add(nextNode);
                }
                currentNode = nextNode;
            }
        }
        return root;
    }

    /**
     * Build a file tree from an in-memory ZIP archive (byte array).
     * Extracts all file entries, reads their text content, creates FileNode objects and
     * delegates to buildTree to produce the folder structure.
     */
    public static FileNode buildTreeFromZip(byte[] zipBytes, String projectName) throws IOException {
        List<FileNode> flatFiles = new ArrayList<>();

        try (ByteArrayInputStream bais = new ByteArrayInputStream(zipBytes);
             ZipInputStream zis = new ZipInputStream(bais)) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                if (entry.isDirectory()) {
                    zis.closeEntry();
                    continue;
                }

                String entryName = entry.getName();
                // Read entry content safely into a byte buffer (do NOT close the ZipInputStream)
                ByteArrayOutputStream entryBaos = new ByteArrayOutputStream();
                byte[] buffer = new byte[4096];
                int read;
                while ((read = zis.read(buffer)) != -1) {
                    entryBaos.write(buffer, 0, read);
                }
                String content = entryBaos.toString(StandardCharsets.UTF_8.name());
                String fileName = entryName.contains("/") ? entryName.substring(entryName.lastIndexOf('/') + 1) : entryName;
                FileNode fileNode = new FileNode(fileName, "file", entryName);
                fileNode.setContent(content);
                fileNode.setLanguage(detectLanguage(fileName));
                flatFiles.add(fileNode);

                zis.closeEntry();
            }
        }

        return buildTree(flatFiles, projectName);
    }

    private static String detectLanguage(String fileName) {
        String lower = fileName.toLowerCase();
        if (lower.endsWith(".java")) return "java";
        if (lower.endsWith(".xml")) return "xml";
        if (lower.endsWith(".sql")) return "sql";
        if (lower.endsWith(".yml") || lower.endsWith(".yaml")) return "yaml";
        if (lower.endsWith(".json")) return "json";
        return "text";
    }

    private static FileNode findChild(FileNode parent, String name) {
        return parent.getChildren().stream()
                .filter(node -> node.getName().equals(name))
                .findFirst()
                .orElse(null);
    }
}
