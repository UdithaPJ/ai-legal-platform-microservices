package com.project.videosessionservice.service;

import io.jsonwebtoken.Jwts;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.util.Base64;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * Signs RS256 JWTs accepted by 8x8 JaaS (Jitsi-as-a-Service).
 *
 * Token shape JaaS expects:
 *   header.kid:  vpaas-magic-cookie-<appId>/<apiKeyId>
 *   payload:
 *     aud: "jitsi"
 *     iss: "chat"
 *     sub: vpaas-magic-cookie-<appId>
 *     room: "*"  (or specific room)
 *     iat / nbf / exp
 *     context.user: { id, name, email, avatar, moderator }
 *     context.features: { livestreaming, recording, transcription, ... }
 *
 * See https://developer.8x8.com/jaas/docs/api-keys-jwt
 */
@Service
@Slf4j
public class JaaSTokenService {

    @Value("${jaas.app-id}")
    private String appId;

    /** Full Key ID from JaaS console — format: appId/keyId */
    @Value("${jaas.kid}")
    private String kid;

    /** Path inside the container/classpath to the PEM private key file */
    @Value("${jaas.private-key-path}")
    private String privateKeyPath;

    /** Token lifetime in seconds (4 hours by default) */
    @Value("${jaas.ttl-seconds:14400}")
    private long ttlSeconds;

    private PrivateKey privateKey;

    @PostConstruct
    void loadKey() throws Exception {
        String pem = Files.readString(Path.of(privateKeyPath))
                .replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replaceAll("\\s+", "");
        byte[] der = Base64.getDecoder().decode(pem);
        PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(der);
        this.privateKey = KeyFactory.getInstance("RSA").generatePrivate(spec);
        log.info("Loaded JaaS RSA private key from {}", privateKeyPath);
    }

    public String signToken(String roomName, String userId, String displayName,
                            String email, boolean moderator) {
        Map<String, Object> user = new HashMap<>();
        user.put("id", userId);
        user.put("name", displayName);
        user.put("avatar", "");
        user.put("email", email != null ? email : "");
        // JaaS expects moderator as a string
        user.put("moderator", moderator ? "true" : "false");

        // Feature flags — enable common features; tighten as you like
        Map<String, Object> features = new HashMap<>();
        features.put("livestreaming", moderator ? "true" : "false");
        features.put("recording",     moderator ? "true" : "false");
        features.put("transcription", "true");
        features.put("outbound-call", "false");

        Map<String, Object> context = new HashMap<>();
        context.put("user", user);
        context.put("features", features);

        long nowMs = System.currentTimeMillis();
        return Jwts.builder()
                .header().keyId(kid).type("JWT").and()
                .issuer("chat")
                // JaaS requires aud as a plain string, not an array — set as a custom claim.
                .claim("aud", "jitsi")
                .subject(appId)
                .claim("room", roomName)
                .claim("context", context)
                .issuedAt(new Date(nowMs))
                .notBefore(new Date(nowMs - 5_000))
                .expiration(new Date(nowMs + ttlSeconds * 1000L))
                .signWith(privateKey, Jwts.SIG.RS256)
                .compact();
    }
}
