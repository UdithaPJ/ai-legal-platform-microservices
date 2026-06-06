export type VideoSessionStatus = "SCHEDULED" | "STARTED" | "ENDED" | "CANCELLED";

export interface VideoSessionResponseDTO {
  id: number;
  appointmentId: number;
  roomName: string;
  meetingUrl: string;
  status: VideoSessionStatus;
  scheduledAt?: string;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
  updatedAt: string;
  /** Short-lived JaaS JWT — moderator=true for the lawyer, false for the client. */
  jitsiToken?: string;
}
