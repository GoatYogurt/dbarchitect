package ${packageName}.controller;

import ${packageName}.entity.${className};
import ${packageName}.service.${className}Service;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/${tableName}")
public class ${className}Controller {

    private final ${className}Service service;

    public ${className}Controller(${className}Service service) {
        this.service = service;
    }

    @GetMapping
    public List<${className}> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<${className}> getById(@PathVariable ${idType!"Long"} id) {
        return service.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ${className} create(@RequestBody ${className} entity) {
        return service.save(entity);
    }

    @PutMapping("/{id}")
    public ResponseEntity<${className}> update(@PathVariable ${idType!"Long"} id, @RequestBody ${className} entity) {
        return service.findById(id).map(existing -> {
            entity.setId(id);
            return ResponseEntity.ok(service.save(entity));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable ${idType!"Long"} id) {
        service.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}