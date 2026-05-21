package com.project.appointmentservice.controller;

import com.project.appointmentservice.dto.AppointmentRequestDTO;
import com.project.appointmentservice.dto.AppointmentResponseDTO;
import com.project.appointmentservice.dto.AppointmentScheduleRequestDTO;
import com.project.appointmentservice.dto.AppointmentStatusUpdateDTO;
import com.project.appointmentservice.model.AppointmentStatus;
import com.project.appointmentservice.service.AppointmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;

    @PostMapping
    public ResponseEntity<AppointmentResponseDTO> createAppointment(
            @Valid @RequestBody AppointmentRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(appointmentService.createAppointment(request));
    }

    @GetMapping
    public ResponseEntity<List<AppointmentResponseDTO>> getAll() {
        return ResponseEntity.ok(appointmentService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AppointmentResponseDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(appointmentService.getById(id));
    }

    @GetMapping("/client/{clientId}")
    public ResponseEntity<List<AppointmentResponseDTO>> getByClientId(
            @PathVariable UUID clientId) {
        return ResponseEntity.ok(appointmentService.getByClientId(clientId));
    }

    @GetMapping("/client/{clientId}/status/{status}")
    public ResponseEntity<List<AppointmentResponseDTO>> getByClientIdAndStatus(
            @PathVariable UUID clientId,
            @PathVariable AppointmentStatus status) {
        return ResponseEntity.ok(
                appointmentService.getByClientIdAndStatus(clientId, status));
    }

    @GetMapping("/lawyer/{lawyerId}")
    public ResponseEntity<List<AppointmentResponseDTO>> getByLawyerId(
            @PathVariable UUID lawyerId) {
        return ResponseEntity.ok(appointmentService.getByLawyerId(lawyerId));
    }

    @GetMapping("/lawyer/{lawyerId}/status/{status}")
    public ResponseEntity<List<AppointmentResponseDTO>> getByLawyerIdAndStatus(
            @PathVariable UUID lawyerId,
            @PathVariable AppointmentStatus status) {
        return ResponseEntity.ok(
                appointmentService.getByLawyerIdAndStatus(lawyerId, status));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<AppointmentResponseDTO> patchStatus(
            @PathVariable Long id,
            @Valid @RequestBody AppointmentStatusUpdateDTO request) {
        return ResponseEntity.ok(appointmentService.updateStatus(id, request));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<AppointmentResponseDTO> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody AppointmentStatusUpdateDTO request) {
        return ResponseEntity.ok(appointmentService.updateStatus(id, request));
    }

    @PostMapping("/{id}/video-request")
    public ResponseEntity<AppointmentResponseDTO> requestVideoCall(@PathVariable Long id) {
        return ResponseEntity.ok(appointmentService.requestVideoCall(id));
    }

    @PostMapping("/{id}/schedule")
    public ResponseEntity<AppointmentResponseDTO> scheduleAppointment(
            @PathVariable Long id,
            @Valid @RequestBody AppointmentScheduleRequestDTO request) {
        return ResponseEntity.ok(appointmentService.scheduleAppointment(id, request));
    }

    @PatchMapping("/{id}/complete")
    public ResponseEntity<AppointmentResponseDTO> completeAppointment(@PathVariable Long id) {
        return ResponseEntity.ok(appointmentService.completeAppointment(id));
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<AppointmentResponseDTO> cancelAppointment(
            @PathVariable Long id,
            @RequestParam UUID clientId) {
        return ResponseEntity.ok(appointmentService.cancelAppointment(id, clientId));
    }
}
