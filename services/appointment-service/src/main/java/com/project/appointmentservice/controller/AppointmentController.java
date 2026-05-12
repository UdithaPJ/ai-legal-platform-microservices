package com.project.appointmentservice.controller;

import com.project.appointmentservice.dto.*;
import com.project.appointmentservice.model.AppointmentStatus;
import com.project.appointmentservice.service.AppointmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;

    // POST /appointments — Client books an appointment
    @PostMapping
    public ResponseEntity<AppointmentResponseDTO> createAppointment(
            @Valid @RequestBody AppointmentRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(appointmentService.createAppointment(request));
    }

    // GET /appointments — Get all appointments (admin/debug use)
    @GetMapping
    public ResponseEntity<List<AppointmentResponseDTO>> getAll() {
        return ResponseEntity.ok(appointmentService.getAll());
    }

    // GET /appointments/{id} — Get a specific appointment
    @GetMapping("/{id}")
    public ResponseEntity<AppointmentResponseDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(appointmentService.getById(id));
    }

    // GET /appointments/client/{clientId} — All appointments for a client
    @GetMapping("/client/{clientId}")
    public ResponseEntity<List<AppointmentResponseDTO>> getByClientId(
            @PathVariable Long clientId) {
        return ResponseEntity.ok(appointmentService.getByClientId(clientId));
    }

    // GET /appointments/client/{clientId}/status/{status}
    // e.g. GET /appointments/client/1/status/PENDING
    @GetMapping("/client/{clientId}/status/{status}")
    public ResponseEntity<List<AppointmentResponseDTO>> getByClientIdAndStatus(
            @PathVariable Long clientId,
            @PathVariable AppointmentStatus status) {
        return ResponseEntity.ok(
                appointmentService.getByClientIdAndStatus(clientId, status));
    }

    // GET /appointments/lawyer/{lawyerId} — All appointments for a lawyer
    @GetMapping("/lawyer/{lawyerId}")
    public ResponseEntity<List<AppointmentResponseDTO>> getByLawyerId(
            @PathVariable Long lawyerId) {
        return ResponseEntity.ok(appointmentService.getByLawyerId(lawyerId));
    }

    // GET /appointments/lawyer/{lawyerId}/status/{status}
    // e.g. GET /appointments/lawyer/1/status/PENDING — lawyer sees pending requests
    @GetMapping("/lawyer/{lawyerId}/status/{status}")
    public ResponseEntity<List<AppointmentResponseDTO>> getByLawyerIdAndStatus(
            @PathVariable Long lawyerId,
            @PathVariable AppointmentStatus status) {
        return ResponseEntity.ok(
                appointmentService.getByLawyerIdAndStatus(lawyerId, status));
    }

    // PUT /appointments/{id}/status — Lawyer accepts, rejects, or completes
    @PutMapping("/{id}/status")
    public ResponseEntity<AppointmentResponseDTO> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody AppointmentStatusUpdateDTO request) {
        return ResponseEntity.ok(appointmentService.updateStatus(id, request));
    }

    // PATCH /appointments/{id}/cancel?clientId={clientId} — Client cancels
    @PatchMapping("/{id}/cancel")
    public ResponseEntity<AppointmentResponseDTO> cancelAppointment(
            @PathVariable Long id,
            @RequestParam Long clientId) {
        return ResponseEntity.ok(appointmentService.cancelAppointment(id, clientId));
    }
}