package com.project.api_gateway.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.security.oauth2.server.resource.authentication.ReactiveJwtAuthenticationConverterAdapter;

@Configuration
@EnableWebFluxSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthConverter jwtAuthConverter;

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {

        return http
                .csrf(ServerHttpSecurity.CsrfSpec::disable)

                .authorizeExchange(exchange -> exchange

                        // Public endpoints
                        .pathMatchers("/actuator/**").permitAll()
                        .pathMatchers("/uploads/**").permitAll()

                        // Admin-only actions (example)
                        .pathMatchers(HttpMethod.DELETE, "/users/**").hasRole("ADMIN")

                        // User endpoints
                        .pathMatchers("/users/**").hasAnyRole("CLIENT", "ADMIN")

                        // Everything else must be authenticated
                        .anyExchange().authenticated()
                )

                .oauth2ResourceServer(oauth2 ->
                        oauth2.jwt(jwt ->
                                jwt.jwtAuthenticationConverter(
                                        new ReactiveJwtAuthenticationConverterAdapter(jwtAuthConverter)
                                )
                        )
                )

                .build();
    }
}