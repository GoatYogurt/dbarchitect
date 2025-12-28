package com.dbarchitect.backend.services;

import com.dbarchitect.backend.entities.DesignProject;
import com.dbarchitect.backend.repositories.DesignProjectRepository;
import com.dbarchitect.backend.requests.GenerateDBMLRequest;
import com.dbarchitect.backend.responses.DesignProjectResponse;
import com.dbarchitect.backend.utils.CodeGenerator;
import com.dbarchitect.backend.utils.DBMLCode;
import org.springframework.stereotype.Service;
import com.dbarchitect.backend.utils.DBMLGenerator;

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

    public DesignProject getDesignProjectById(Long projectId) {
        return designProjectRepository.findById(projectId).orElse(null);
    }

    public List<DesignProject> getAllDesignProjects() {
        return designProjectRepository.findAll();
    }
}
