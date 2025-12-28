package com.dbarchitect.backend.utils;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig {
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**") // Áp dụng cho tất cả các URL
//                        .allowedOrigins("http://localhost:3000") // Domain của Frontend
//                        .allowedOrigins("https://x7nbr74s-3000.asse.devtunnels.ms")
                        .allowedOriginPatterns("*") // Cho phép tất cả các pattern origin
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS") // Các phương thức cho phép
                        .allowedHeaders("*") // Cho phép tất cả các Header
                        .allowCredentials(true); // Cho phép gửi Cookie/Auth header
            }
        };
    }
}
