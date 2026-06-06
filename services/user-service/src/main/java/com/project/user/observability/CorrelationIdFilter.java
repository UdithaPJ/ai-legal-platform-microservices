package com.project.user.observability;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * Propagates the {@code X-Correlation-Id} request header into MDC so that all
 * log lines emitted during request processing carry the same correlation ID.
 * Mirrors the identical filter used in lawyer-profile-service and review-rating-service.
 */
@Component
public class CorrelationIdFilter extends OncePerRequestFilter {

    public static final String MDC_CORRELATION_ID = "correlationId";
    public static final String MDC_TRACEPARENT    = "traceparent";
    public static final String HEADER_CORRELATION = "X-Correlation-Id";
    public static final String HEADER_TRACEPARENT = "traceparent";

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest  request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain         chain) throws ServletException, IOException {

        String correlationId = request.getHeader(HEADER_CORRELATION);
        if (correlationId == null || correlationId.isBlank()) {
            correlationId = UUID.randomUUID().toString();
        }

        String traceparent = request.getHeader(HEADER_TRACEPARENT);

        MDC.put(MDC_CORRELATION_ID, correlationId);
        if (traceparent != null) MDC.put(MDC_TRACEPARENT, traceparent);

        response.setHeader(HEADER_CORRELATION, correlationId);

        try {
            chain.doFilter(request, response);
        } finally {
            MDC.remove(MDC_CORRELATION_ID);
            MDC.remove(MDC_TRACEPARENT);
        }
    }
}
