package ${packageName}.service;

import ${packageName}.entity.${className};
import ${packageName}.repository.${className}Repository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class ${className}Service {

    private final ${className}Repository repository;

    public ${className}Service(${className}Repository repository) {
        this.repository = repository;
    }

    public List<${className}> findAll() {
        return repository.findAll();
    }

    public Optional<${className}> findById(${idType!"Long"} id) {
        return repository.findById(id);
    }

    public ${className} save(${className} entity) {
        return repository.save(entity);
    }

    public void deleteById(${idType!"Long"} id) {
        repository.deleteById(id);
    }
}