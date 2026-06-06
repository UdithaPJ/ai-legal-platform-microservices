package com.project.lawyerprofileservice.dto;

import lombok.Data;

/** Body for admin approve / reject actions. */
@Data
public class AdminDecisionRequest {

    /** Optional free-text reason, recommended when rejecting. */
    private String reason;
}
