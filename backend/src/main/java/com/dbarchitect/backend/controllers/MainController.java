package com.dbarchitect.backend.controllers;

import com.dbarchitect.backend.entities.CodeChange;
import com.dbarchitect.backend.entities.FileNode;
import com.dbarchitect.backend.requests.CompareRequest;
import com.dbarchitect.backend.requests.GenerateDBMLRequest;
import com.dbarchitect.backend.requests.UpdateDbmlRequest;
import com.dbarchitect.backend.responses.DesignProjectResponse;
import com.dbarchitect.backend.services.MainService;
import com.dbarchitect.backend.utils.DBMLCode;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.constraints.NotNull;

import java.util.List;

@RestController
@RequestMapping("")
public class MainController {

    private final MainService mainService;

    public MainController(MainService mainService) {
        this.mainService = mainService;
    }

    @PostMapping("/generate-dbml")
    public DesignProjectResponse generateDbml(@RequestBody GenerateDBMLRequest request) {
        return mainService.generateDbml(request);
    }

    @PutMapping("/projects/{id}/dbml")
    public ResponseEntity<DesignProjectResponse> updateProjectDbml(@PathVariable Long id, @RequestBody UpdateDbmlRequest request) {
        var updated = mainService.updateProjectDbml(id, request.getRawDbmlCode());
        if (updated == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        DesignProjectResponse response = new DesignProjectResponse();
        response.setProjectId(updated.getId());
        response.setProjectName(updated.getName());
        response.setCleanDbmlCode(DBMLCode.extractCleanDbmlCode(updated.getRawDbmlCode()));
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

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

    @GetMapping("/generate-preview")
    public FileNode generatePreview(@RequestParam Long id) {
        // Generate preview for the project identified by ID (reads project from DB and builds tree)
        return mainService.generateProjectPreview(id);
    }

    @GetMapping("/projects/{id}")
    public DesignProjectResponse getProjectById(@PathVariable Long id) {
        var project = mainService.getDesignProjectById(id);
        if (project == null) {
            return null;
        }
        DesignProjectResponse response = new DesignProjectResponse();
        response.setProjectId(project.getId());
        response.setProjectName(project.getName());
        response.setCleanDbmlCode(DBMLCode.extractCleanDbmlCode(project.getRawDbmlCode()));
        System.out.println(DBMLCode.extractCleanDbmlCode(project.getRawDbmlCode()));
        System.out.println(project.getRawDbmlCode());
        return response;
    }

    @GetMapping("/projects")
    public java.util.List<DesignProjectResponse> getAllProjects() {
        var projects = mainService.getAllDesignProjects();
        java.util.List<DesignProjectResponse> responses = new java.util.ArrayList<>();
        for (var project : projects) {
            DesignProjectResponse response = new DesignProjectResponse();
            response.setProjectId(project.getId());
            response.setProjectName(project.getName());
            response.setCleanDbmlCode(DBMLCode.extractCleanDbmlCode(project.getRawDbmlCode()));
            responses.add(response);
        }
        return responses;
    }

    @PostMapping("/compare")
    public ResponseEntity<List<CodeChange>> getDiff(@RequestBody CompareRequest req) {
        // req chứa oldCode và newCode
        List<CodeChange> diffResults = mainService.compareCode(req.getOldCode(), req.getNewCode());
        return ResponseEntity.ok(diffResults);
    }
}
