package com.dbarchitect.backend.services;

import com.dbarchitect.backend.entities.Project;
import com.dbarchitect.backend.repositories.ProjectRepository;
import com.dbarchitect.backend.responses.ProjectResponse;
import com.dbarchitect.backend.utils.DBMLCode;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class ProjectService {
    private ProjectRepository projectRepository;

    public ProjectService(ProjectRepository projectRepository) {
        this.projectRepository = projectRepository;
    }

    public ResponseEntity<ProjectResponse> createProject(String projectName, String rawDbmlCode) {
        Project project = new Project();
        project.setName(projectName);
        project.setRawDbmlCode(rawDbmlCode);
        projectRepository.save(project);

        ProjectResponse response = new ProjectResponse();
        response.setProjectId(project.getId());
        response.setProjectName(project.getName());
        response.setCleanDbmlCode(DBMLCode.extractCleanDbmlCode(rawDbmlCode));

        return ResponseEntity.ok(response);
    }

    public ResponseEntity<ProjectResponse> getProjectById(Long projectId) {
        Project project = projectRepository.findById(projectId).orElse(null);
        if (project == null) {
            return ResponseEntity.ok(null);
        }

        ProjectResponse response = new ProjectResponse();
        response.setProjectId(project.getId());
        response.setProjectName(project.getName());
        response.setCleanDbmlCode(DBMLCode.extractCleanDbmlCode(project.getRawDbmlCode()));

        return ResponseEntity.ok(response);
    }

    public ResponseEntity<List<ProjectResponse>> getAllProjects() {
        List<Project> projects = projectRepository.findAll();
        List<ProjectResponse> response = new ArrayList<>();

        for (Project project : projects) {
            ProjectResponse projectResponse = new ProjectResponse();
            projectResponse.setProjectId(project.getId());
            projectResponse.setProjectName(project.getName());
            projectResponse.setCleanDbmlCode(DBMLCode.extractCleanDbmlCode(project.getRawDbmlCode()));
            response.add(projectResponse);
        }

        return ResponseEntity.ok(response);
    }

    public ResponseEntity<ProjectResponse> updateDbml(Long projectId, String newRawDbmlCode) {
        Optional<Project> optionalProject = projectRepository.findById(projectId);
        if (optionalProject.isEmpty()) {
            return null;
        }

        Project project = optionalProject.get();
        project.setRawDbmlCode(newRawDbmlCode);
        projectRepository.save(project);

        ProjectResponse projectResponse = new ProjectResponse();
        projectResponse.setProjectId(project.getId());
        projectResponse.setProjectName(project.getName());
        projectResponse.setCleanDbmlCode(DBMLCode.extractCleanDbmlCode(newRawDbmlCode));

        return ResponseEntity.ok(projectResponse);
    }
}
