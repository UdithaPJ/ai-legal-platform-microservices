package com.project.api_gateway.config;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtTimestampValidator;
import org.springframework.security.oauth2.jwt.NimbusReactiveJwtDecoder;
import org.springframework.security.oauth2.jwt.ReactiveJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.ReactiveJwtAuthenticationConverterAdapter;

import java.util.List;
import java.util.Set;

@Configuration
@EnableWebFluxSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    /** Injected from keycloak.jwks-uri — override with KEYCLOAK_JWKS_URI env var in Docker */
    @Value("${keycloak.jwks-uri}")
    private String jwksUri;

    /** Injected from keycloak.trusted-issuers in application.yaml (comma-separated string) */
    @Value("${keycloak.trusted-issuers:http://localhost:8181/realms/legal-platform}")
    private List<String> trustedIssuers;

    private final JwtAuthConverter jwtAuthConverter;

    @Bean
    public ReactiveJwtDecoder jwtDecoder() {
        NimbusReactiveJwtDecoder decoder = NimbusReactiveJwtDecoder.withJwkSetUri(jwksUri).build();
        Set<String> issuerSet = Set.copyOf(trustedIssuers);
        OAuth2TokenValidator<Jwt> issuerValidator = jwt -> {
            String issuer = jwt.getIssuer() != null ? jwt.getIssuer().toString() : "";
            if (issuerSet.contains(issuer)) {
                return OAuth2TokenValidatorResult.success();
            }
            return OAuth2TokenValidatorResult.failure(
                    new OAuth2Error("invalid_token", "Untrusted issuer: " + issuer, null));
        };
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
                new JwtTimestampValidator(),
                issuerValidator
        ));
        return decoder;
    }

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {

        return http
                .csrf(ServerHttpSecurity.CsrfSpec::disable)

                .authorizeExchange(exchange -> exchange

                        // Public endpoints
                        .pathMatchers("/actuator/**").permitAll()
                        .pathMatchers("/uploads/**").permitAll()

                        // Swagger / OpenAPI (gateway aggregated docs)
                        .pathMatchers(
                                "/swagger-ui.html",
                                "/swagger-ui/**",
                                "/v3/api-docs/**",
                                "/analysis/openapi.json",
                                "/analysis/docs",
                                "/analysis/docs/**",
                                "/analysis/redoc"
                        ).permitAll()

                        // WebSocket handshake (JWT is validated at STOMP CONNECT in messaging-service)
                        .pathMatchers("/ws-chat/**").permitAll()
                        .pathMatchers("/ws-chat").permitAll()

                        // Admin-only actions (example)
//                        .pathMatchers(HttpMethod.DELETE, "/users/**").hasRole("ADMIN")
//
//                        // User endpoints
//                        .pathMatchers("/users/**").hasAnyRole("CLIENT", "ADMIN")

                        // Everything else must be authenticated
                        .anyExchange().permitAll()
//                        .anyExchange().authenticated()
                )

                .oauth2ResourceServer(oauth2 ->
                        oauth2.jwt(jwt -> jwt
                                .jwtDecoder(jwtDecoder())
                                .jwtAuthenticationConverter(
                                        new ReactiveJwtAuthenticationConverterAdapter(jwtAuthConverter)
                                )
                        )
                )

                .build();
    }
}