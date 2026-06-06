package com.project.api_gateway.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Global CORS configuration for Spring Cloud Gateway.
 *
 * Allowed origins are driven by the {@code cors.allowed-origins} property so
 * they can be extended in any Spring profile or environment variable without
 * recompiling.  The gateway itself is also the CORS authority — downstream
 * microservices do not need their own CORS configuration.
 */
@Configuration
public class CorsConfig {

    /**
     * Comma-separated list of allowed origins injected from application.yaml.
     * Example value (production):
     *   https://legal-platform.azurestaticapps.net,https://yourdomain.com
     */
    @Value("${cors.allowed-origins:http://localhost:3000}")
    private List<String> allowedOrigins;

    @Bean
    public CorsWebFilter corsWebFilter() {
        CorsConfiguration config = new CorsConfiguration();

        // Explicit origins — never use "*" with allowCredentials: true
        config.setAllowedOrigins(allowedOrigins);

        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));

        // Allow all request headers the frontend might send
        config.setAllowedHeaders(List.of(
                "Authorization",
                "Content-Type",
                "Accept",
                "Origin",
                "X-Requested-With",
                "Access-Control-Request-Method",
                "Access-Control-Request-Headers"
        ));

        // Expose headers the frontend JS needs to read
        config.setExposedHeaders(List.of("Authorization", "Content-Disposition"));

        // Required so the browser sends the Authorization cookie/header cross-origin
        config.setAllowCredentials(true);

        // Cache preflight response for 1 hour
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return new CorsWebFilter(source);
    }
}
