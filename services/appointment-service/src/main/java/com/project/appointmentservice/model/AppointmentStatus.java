package com.project.appointmentservice.model;

public enum AppointmentStatus {
    PENDING,    // Client booked, waiting for lawyer to accept
    CONFIRMED,  // Lawyer accepted
    REJECTED,   // Lawyer rejected
    CANCELLED,  // Client cancelled
    COMPLETED   // Consultation done
}