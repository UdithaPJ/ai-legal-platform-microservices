package com.project.user.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    // e.g. "/app/uploads/profile-pictures/" (Docker) or
    //      "services/user-service/uploads/profile-pictures/" (local dev)
    @Value("${file.upload-dir}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Strip trailing slash, get parent dir so that /uploads/profile-pictures/x.jpg
        // resolves to <uploadDir>/x.jpg correctly.
        String normalized = uploadDir.endsWith("/")
                ? uploadDir.substring(0, uploadDir.length() - 1)
                : uploadDir;
        String parent = Paths.get(normalized).getParent().toString().replace("\\", "/") + "/";
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + parent);
    }
}
