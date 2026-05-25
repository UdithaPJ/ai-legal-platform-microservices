export interface ReviewResponseDTO {
  id: number;
  lawyerId: string;
  clientId: string;
  appointmentId: number;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewRequest {
  lawyerId: string;
  clientId: string;
  appointmentId: number;
  rating: number;
  comment: string;
}

export interface LawyerRatingSummaryDTO {
  lawyerId: string;
  averageRating: number;
  totalReviews: number;
  starBreakdown: Record<number, number>;
}
