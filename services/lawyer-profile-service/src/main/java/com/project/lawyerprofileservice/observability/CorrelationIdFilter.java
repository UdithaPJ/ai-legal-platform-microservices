package com.project.lawyerprofileservice.observability;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;
import java.util.UUID;

@Component
public class CorrelationIdFilter extends OncePerRequestFilter {

    public static final String CORRELATION_ID_HEADER = "X-Correlation-Id";
    public static final String TRACEPARENT_HEADER = "traceparent";

    public static final String MDC_CORRELATION_ID = "correlationId";
    public static final String MDC_TRACEPARENT = "traceparent";

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String correlationId = Optional.ofNullable(request.getHeader(CORRELATION_ID_HEADER))
                .filter(v -> !v.isBlank())
                .orElse(UUID.randomUUID().toString());

        String traceparent = Optional.ofNullable(request.getHeader(TRACEPARENT_HEADER))
                .filter(v -> !v.isBlank())
                .orElse(null);

        MDC.put(MDC_CORRELATION_ID, correlationId);
        if (traceparent != null) {
            MDC.put(MDC_TRACEPARENT, traceparent);
        }

        response.setHeader(CORRELATION_ID_HEADER, correlationId);

        try {
            filterChain.doFilter(request, response);
        } finally {
            MDC.remove(MDC_CORRELATION_ID);
            MDC.remove(MDC_TRACEPARENT);
        }
    }
}
