package com.project.appointmentservice.repository;

import com.project.appointmentservice.model.Appointment;
import com.project.appointmentservice.model.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByClientId(UUID clientId);
    List<Appointment> findByLawyerId(UUID lawyerId);
    List<Appointment> findByClientIdAndStatus(UUID clientId, AppointmentStatus status);
    List<Appointment> findByLawyerIdAndStatus(UUID lawyerId, AppointmentStatus status);
    List<Appointment> findByLawyerIdAndStatusInAndAppointmentDateTimeBetween(
            UUID lawyerId,
            Collection<AppointmentStatus> statuses,
            OffsetDateTime start,
            OffsetDateTime end
    );
}
