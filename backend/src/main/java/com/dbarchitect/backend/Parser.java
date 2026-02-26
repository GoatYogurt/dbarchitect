package com.dbarchitect.backend;

import com.github.javaparser.StaticJavaParser;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.Modifier;
import com.github.javaparser.ast.body.ClassOrInterfaceDeclaration;
import com.github.javaparser.ast.body.FieldDeclaration;
import com.github.javaparser.ast.body.MethodDeclaration;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;

public class Parser {
    public static void analyzeController(String filePath) throws IOException {
        CompilationUnit cu = StaticJavaParser.parse(new File(filePath));

        cu.findAll(MethodDeclaration.class).forEach(method ->
                System.out.println("Method Name: " + method.getNameAsString()));

        cu.getClassByName("DesignProject").ifPresent(cls -> {
            FieldDeclaration field = cls.addField("String", "newField", Modifier.Keyword.PRIVATE);
            field.addMarkerAnnotation("NotNull");
        });

        cu.addImport("jakarta.validation.constraints.NotNull");
        try (FileOutputStream out = new FileOutputStream(filePath)) {
            out.write(cu.toString().getBytes());
        }
    }

    public static void main(String[] args) throws IOException {
        analyzeController("D:\\CODING\\code\\kltn\\dbarchitect\\backend\\src\\main\\java\\com\\dbarchitect\\backend\\entities\\DesignProject.java");
    }
}
