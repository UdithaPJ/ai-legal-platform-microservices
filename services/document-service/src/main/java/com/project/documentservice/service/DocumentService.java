package com.project.documentservice.service;

import com.project.documentservice.dto.*;
import com.project.documentservice.event.DocumentEvent;
import com.project.documentservice.event.DocumentEventPublisher;
import com.project.documentservice.event.DocumentEventType;
import com.project.documentservice.model.Document;
import com.project.documentservice.model.DocumentRequest;
import com.project.documentservice.model.DocumentRequestStatus;
import com.project.documentservice.repository.DocumentRepository;
import com.project.documentservice.repository.DocumentRequestRepository;
import io.minio.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentService {

    private final DocumentRequestRepository requestRepository;
    private final DocumentRepository documentRepository;
    private final MinioClient minioClient;
    private final DocumentEventPublisher eventPublisher;

    @Value("${minio.bucket}")
    private String bucket;

    @Transactional
    public DocumentRequestResponseDTO createRequest(CreateDocumentRequestDTO dto) {
        DocumentRequest request = DocumentRequest.builder()
                .appointmentId(dto.appointmentId())
                .clientId(dto.clientId())
                .lawyerId(dto.lawyerId())
                .documentType(dto.documentType())
                .description(dto.description())
                .status(DocumentRequestStatus.PENDING)
                .build();

        request = requestRepository.save(request);

        eventPublisher.publish(new DocumentEvent(
                DocumentEventType.DOCUMENT_REQUESTED,
                request.getId(),
                request.getAppointmentId(),
                request.getClientId(),
                request.getLawyerId(),
                request.getDocumentType(),
                "Client requested document: " + request.getDocumentType(),
                OffsetDateTime.now(ZoneOffset.UTC)
        ));

        log.info("Document request created: id={} clientId={} lawyerId={}", request.getId(), dto.clientId(), dto.lawyerId());
        return toResponseDTO(request);
    }

    @Transactional(readOnly = true)
    public DocumentRequestResponseDTO getRequest(Long id) {
        return toResponseDTO(findRequest(id));
    }

    @Transactional(readOnly = true)
    public List<DocumentRequestResponseDTO> getRequestsByClient(UUID clientId) {
        return requestRepository.findByClientIdOrderByCreatedAtDesc(clientId)
                .stream().map(this::toResponseDTO).toList();
    }

    @Transactional(readOnly = true)
    public List<DocumentRequestResponseDTO> getRequestsByLawyer(UUID lawyerId) {
        return requestRepository.findByLawyerIdOrderByCreatedAtDesc(lawyerId)
                .stream().map(this::toResponseDTO).toList();
    }

    @Transactional(readOnly = true)
    public List<DocumentRequestResponseDTO> getRequestsByAppointment(Long appointmentId) {
        return requestRepository.findByAppointmentIdOrderByCreatedAtDesc(appointmentId)
                .stream().map(this::toResponseDTO).toList();
    }

    @Transactional
    public DocumentRequestResponseDTO updateStatus(Long id, UpdateRequestStatusDTO dto) {
        DocumentRequest request = findRequest(id);

        DocumentRequestStatus newStatus = dto.status();

        if (newStatus == DocumentRequestStatus.REJECTED && (dto.rejectionReason() == null || dto.rejectionReason().isBlank())) {
            throw new IllegalArgumentException("rejectionReason is required when rejecting a request");
        }

        if (request.getStatus() == DocumentRequestStatus.COMPLETED) {
            throw new IllegalStateException("Cannot change status of a completed request");
        }

        request.setStatus(newStatus);
        if (newStatus == DocumentRequestStatus.REJECTED) {
            request.setRejectionReason(dto.rejectionReason());
        }
        request = requestRepository.save(request);

        DocumentEventType eventType = switch (newStatus) {
            case IN_PROGRESS -> DocumentEventType.DOCUMENT_IN_PROGRESS;
            case REJECTED -> DocumentEventType.DOCUMENT_REJECTED;
            default -> null;
        };

        if (eventType != null) {
            eventPublisher.publish(new DocumentEvent(
                    eventType,
                    request.getId(),
                    request.getAppointmentId(),
                    request.getClientId(),
                    request.getLawyerId(),
                    request.getDocumentType(),
                    null,
                    OffsetDateTime.now(ZoneOffset.UTC)
            ));
        }

        return toResponseDTO(request);
    }

    @Transactional
    public DocumentRequestResponseDTO uploadDocument(Long requestId, MultipartFile file) {
        DocumentRequest request = findRequest(requestId);

        if (request.getStatus() == DocumentRequestStatus.REJECTED) {
            throw new IllegalStateException("Cannot upload document for a rejected request");
        }

        if (file.isEmpty()) {
            throw new IllegalArgumentException("Uploaded file is empty");
        }

        String fileKey = "requests/" + requestId + "/" + UUID.randomUUID() + "_" + file.getOriginalFilename();

        try (InputStream is = file.getInputStream()) {
            minioClient.putObject(PutObjectArgs.builder()
                    .bucket(bucket)
                    .object(fileKey)
                    .stream(is, file.getSize(), -1)
                    .contentType(file.getContentType())
                    .build());
        } catch (Exception e) {
            log.error("Failed to upload file to MinIO for request {}: {}", requestId, e.getMessage());
            throw new IllegalStateException("File storage failed: " + e.getMessage());
        }

        Document document = Document.builder()
                .request(request)
                .fileName(file.getOriginalFilename())
                .fileKey(fileKey)
                .contentType(file.getContentType())
                .fileSizeBytes(file.getSize())
                .build();
        documentRepository.save(document);

        request.setStatus(DocumentRequestStatus.COMPLETED);
        request = requestRepository.save(request);

        eventPublisher.publish(new DocumentEvent(
                DocumentEventType.DOCUMENT_COMPLETED,
                request.getId(),
                request.getAppointmentId(),
                request.getClientId(),
                request.getLawyerId(),
                request.getDocumentType(),
                "Document '" + file.getOriginalFilename() + "' has been uploaded and is ready for download.",
                OffsetDateTime.now(ZoneOffset.UTC)
        ));

        log.info("Document uploaded for request {}: key={}", requestId, fileKey);
        return toResponseDTO(requestRepository.findById(requestId).orElseThrow());
    }

    public InputStream downloadFile(Long fileId, String[] contentTypeHolder) {
        Document document = documentRepository.findById(fileId)
                .orElseThrow(() -> new IllegalArgumentException("File not found: " + fileId));

        try {
            GetObjectResponse response = minioClient.getObject(GetObjectArgs.builder()
                    .bucket(bucket)
                    .object(document.getFileKey())
                    .build());
            if (contentTypeHolder != null && contentTypeHolder.length > 0) {
                contentTypeHolder[0] = document.getContentType() != null ? document.getContentType() : "application/octet-stream";
            }
            return response;
        } catch (Exception e) {
            log.error("Failed to download file {} from MinIO: {}", fileId, e.getMessage());
            throw new IllegalStateException("File download failed: " + e.getMessage());
        }
    }

    public String getFileName(Long fileId) {
        return documentRepository.findById(fileId)
                .map(Document::getFileName)
                .orElseThrow(() -> new IllegalArgumentException("File not found: " + fileId));
    }

    private DocumentRequest findRequest(Long id) {
        return requestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Document request not found: " + id));
    }

    private DocumentRequestResponseDTO toResponseDTO(DocumentRequest req) {
        List<DocumentFileResponseDTO> docs = documentRepository.findByRequestId(req.getId())
                .stream()
                .map(d -> new DocumentFileResponseDTO(
                        d.getId(),
                        req.getId(),
                        d.getFileName(),
                        d.getContentType(),
                        d.getFileSizeBytes(),
                        d.getCreatedAt()
                ))
                .toList();

        return new DocumentRequestResponseDTO(
                req.getId(),
                req.getAppointmentId(),
                req.getClientId(),
                req.getLawyerId(),
                req.getDocumentType(),
                req.getDescription(),
                req.getStatus(),
                req.getRejectionReason(),
                docs,
                req.getCreatedAt(),
                req.getUpdatedAt()
        );
    }
}
