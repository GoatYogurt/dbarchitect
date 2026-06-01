package com.dbarchitect.backend.controllers;

import com.dbarchitect.backend.entities.FileNode;
import com.dbarchitect.backend.requests.CompareRequest;
import com.dbarchitect.backend.requests.GenerateDBMLRequest;
import com.dbarchitect.backend.requests.GenerateCodeRequest;
import com.dbarchitect.backend.responses.ProjectResponse;
import com.dbarchitect.backend.responses.FileDiff;
import com.dbarchitect.backend.services.MainService;
import com.dbarchitect.backend.utils.DBMLCode;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("")
public class MainController {

    private final MainService mainService;

    public MainController(MainService mainService) {
        this.mainService = mainService;
    }

    @PostMapping("/generate-dbml")
    public ProjectResponse generateDbml(@RequestBody GenerateDBMLRequest request) {
        return mainService.generateDbml(request);
    }

    // endpoint to download generated code as ZIP file
    @GetMapping("/generate-code")
    public ResponseEntity<byte[]> downloadProjectZip(@RequestParam Long id) {
        try {
            // 1. Gọi hàm tạo ZIP từ Service của bạn
            byte[] zipBytes = mainService.generateProjectZip(id);
            // 2. Thiết lập Header để trình duyệt kích hoạt tính năng tải file
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", "generated-project.zip");
            // Trả về mảng byte kèm mã trạng thái 200 OK
            return new ResponseEntity<>(zipBytes, headers, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // endpoint to generate preview of project structure as a file tree based on the DBML code of a project
    @GetMapping("/generate-preview")
    public FileNode generatePreview(@RequestParam Long id) {
        // Generate preview for the project identified by ID (reads project from DB and builds tree)
        return mainService.generateProjectPreview(id);
    }

    // unused
    // @PostMapping("/compare")
    // public ResponseEntity<List<FileDiff>> getDiff(@RequestBody CompareRequest req) throws Exception {
    //     // req chứa oldCode và newCode
    //     List<FileDiff> diffResults = mainService.compareCode(req.getProjectId(), req.getNewDbmlCode());
    //     return ResponseEntity.ok(diffResults);
    // }

    // endpoint to generate Java code files from DBML code, returns a list of file metadata and content
    @PostMapping("/generate-java-code")
    public ResponseEntity<List<Map<String, String>>> generateJavaCode(@RequestBody GenerateCodeRequest request) {
        try {
            String cleanDbml = DBMLCode.extractCleanDbmlCode(request.getRawDbmlCode());
            List<Map<String, String>> files = mainService.generateFilesFromDbml(cleanDbml);
            return ResponseEntity.ok(files);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
