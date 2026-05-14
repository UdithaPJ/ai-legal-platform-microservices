package com.project.messaging.config;

import org.springframework.security.oauth2.jwt.Jwt;

import java.security.Principal;

public class JwtPrincipal implements Principal {

    private final Jwt jwt;

    public JwtPrincipal(Jwt jwt) {
        this.jwt = jwt;
    }

    @Override
    public String getName() {
        return jwt.getSubject();
    }

    public Jwt getJwt() {
        return jwt;
    }
}