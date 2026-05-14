package com.project.appointmentservice.repository;

import com.project.appointmentservice.model.Appointment;
import com.project.appointmentservice.model.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    // All appointments for a client
    List<Appointment> findByClientId(Long clientId);

    // All appointments for a lawyer
    List<Appointment> findByLawyerId(Long lawyerId);

    // Filter by client + status (e.g. all PENDING appointments for a client)
    List<Appointment> findByClientIdAndStatus(Long clientId, AppointmentStatus status);

    // Filter by lawyer + status (e.g. all PENDING requests for a lawyer)
    List<Appointment> findByLawyerIdAndStatus(Long lawyerId, AppointmentStatus status);

    // Check for scheduling conflicts:
    // Does the lawyer have any CONFIRMED appointment that overlaps the requested slot?
    List<Appointment> findByLawyerIdAndStatusAndAppointmentDateTimeBetween(
            Long lawyerId,
            AppointmentStatus status,
            LocalDateTime start,
            LocalDateTime end
    );
}