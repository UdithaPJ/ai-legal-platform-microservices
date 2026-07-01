package com.project.documentservice.controller;

import com.project.documentservice.dto.*;
import com.project.documentservice.service.DocumentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/documents")
@RequiredArgsConstructor
@Slf4j
public class DocumentController {

    private final DocumentService documentService;

    @PostMapping("/requests")
    public ResponseEntity<DocumentRequestResponseDTO> createRequest(
            @Valid @RequestBody CreateDocumentRequestDTO dto) {
        return ResponseEntity.status(201).body(documentService.createRequest(dto));
    }

    @GetMapping("/requests/{id}")
    public ResponseEntity<DocumentRequestResponseDTO> getRequest(@PathVariable Long id) {
        return ResponseEntity.ok(documentService.getRequest(id));
    }

    @GetMapping("/requests/client/{clientId}")
    public ResponseEntity<List<DocumentRequestResponseDTO>> getRequestsByClient(
            @PathVariable UUID clientId) {
        return ResponseEntity.ok(documentService.getRequestsByClient(clientId));
    }

    @GetMapping("/requests/lawyer/{lawyerId}")
    public ResponseEntity<List<DocumentRequestResponseDTO>> getRequestsByLawyer(
            @PathVariable UUID lawyerId) {
        return ResponseEntity.ok(documentService.getRequestsByLawyer(lawyerId));
    }

    @GetMapping("/requests/appointment/{appointmentId}")
    public ResponseEntity<List<DocumentRequestResponseDTO>> getRequestsByAppointment(
            @PathVariable Long appointmentId) {
        return ResponseEntity.ok(documentService.getRequestsByAppointment(appointmentId));
    }

    @PatchMapping("/requests/{id}/status")
    public ResponseEntity<DocumentRequestResponseDTO> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateRequestStatusDTO dto) {
        return ResponseEntity.ok(documentService.updateStatus(id, dto));
    }

    @PostMapping(value = "/requests/{id}/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DocumentRequestResponseDTO> uploadDocument(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(documentService.uploadDocument(id, file));
    }

    @GetMapping("/files/{fileId}/download")
    public ResponseEntity<InputStreamResource> downloadFile(@PathVariable Long fileId) {
        String[] contentTypeHolder = new String[1];
        InputStream stream = documentService.downloadFile(fileId, contentTypeHolder);
        String fileName = documentService.getFileName(fileId);
        String contentType = contentTypeHolder[0] != null ? contentTypeHolder[0] : "application/octet-stream";

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .body(new InputStreamResource(stream));
    }
}
