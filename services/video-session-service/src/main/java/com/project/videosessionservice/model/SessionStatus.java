package com.project.videosessionservice.model;

public enum SessionStatus {
    SCHEDULED,   // Session created, not yet started
    ACTIVE,      // One or both participants have joined
    ENDED        // Session has been ended
}