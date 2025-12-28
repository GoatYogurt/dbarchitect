package com.dbarchitect.backend.repositories;

import com.dbarchitect.backend.entities.DesignProject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DesignProjectRepository extends JpaRepository<DesignProject, Long> {
}
