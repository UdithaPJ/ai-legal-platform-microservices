package com.project.lawyerprofileservice.model;

/**
 * Lifecycle states of a lawyer's verification with the platform.
 *
 * <pre>
 *  Registration
 *       │
 *       ▼
 * PENDING_ONBOARDING ──► (lawyer completes profile wizard)
 *       │
 *       ▼
 * PENDING_VERIFICATION ──► (admin reviews)
 *      / \
 *     ▼   ▼
 * VERIFIED  REJECTED
 *     │
 *     ▼
 * SUSPENDED  (admin action post-approval)
 * </pre>
 */
public enum VerificationStatus {

    /**
     * Registration complete, professional profile not yet submitted.
     * Lawyer is not visible in search results.
     */
    PENDING_ONBOARDING,

    /**
     * Profile submitted; waiting for admin review.
     * Lawyer is not visible in search results.
     */
    PENDING_VERIFICATION,

    /**
     * Admin approved. Lawyer is searchable and can receive appointments
     * when {@code is_available = true}.
     */
    VERIFIED,

    /**
     * Admin rejected the application.
     * Lawyer is not visible in search results.
     */
    REJECTED,

    /**
     * Account suspended by an admin after prior approval.
     * Lawyer is not visible in search results.
     */
    SUSPENDED
}
