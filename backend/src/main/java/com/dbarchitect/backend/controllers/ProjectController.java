package com.dbarchitect.backend.controllers;

import com.dbarchitect.backend.requests.CreateProjectRequest;
import com.dbarchitect.backend.requests.UpdateDbmlRequest;
import com.dbarchitect.backend.responses.ProjectResponse;
import com.dbarchitect.backend.services.ProjectService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/projects")
public class ProjectController {
    ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @PostMapping("")
    public ResponseEntity<ProjectResponse> create(@RequestBody CreateProjectRequest createProjectRequest) {
        return projectService.createProject(createProjectRequest.getProjectName(), createProjectRequest.getRawDbmlCode());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjectResponse> getProjectById(@PathVariable Long id) {
        return  projectService.getProjectById(id);
    }

    @GetMapping("")
    public ResponseEntity<List<ProjectResponse>> getAllProjects() {
        return  projectService.getAllProjects();
    }

    @PutMapping("/{id}/dbml")
    public ResponseEntity<ProjectResponse> updateProjectDbml(@PathVariable Long id, @RequestBody UpdateDbmlRequest request) {
        return projectService.updateDbml(id, request.getRawDbmlCode());
    }
}
