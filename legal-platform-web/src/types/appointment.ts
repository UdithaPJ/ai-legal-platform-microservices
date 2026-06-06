export type AppointmentStatus =
  | "REQUESTED"
  | "ACCEPTED"
  | "REJECTED"
  | "CONFIRMED"
  | "SCHEDULED"
  | "VIDEO_REQUESTED"
  | "COMPLETED"
  | "CANCELLED";

export interface AppointmentResponseDTO {
  id: number;
  clientId: string;
  lawyerId: string;
  lawyerName: string;
  appointmentDateTime?: string;
  durationMinutes?: number;
  description: string;
  status: AppointmentStatus;
  lawyerNote?: string;
  meetingUrl?: string;
  consultationFee?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentRequest {
  clientId: string;
  lawyerId: string;
  appointmentDateTime?: string;
  durationMinutes: number;
  description: string;
}

export interface ScheduleAppointmentRequest {
  appointmentDateTime: string;
}

export interface UpdateAppointmentStatusRequest {
  status: AppointmentStatus;
  lawyerNote?: string;
}
