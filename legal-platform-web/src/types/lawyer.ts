export type Specialization =
  | "CRIMINAL_LAW"
  | "CIVIL_LAW"
  | "CORPORATE_LAW"
  | "FAMILY_LAW"
  | "INTELLECTUAL_PROPERTY"
  | "LABOR_LAW"
  | "REAL_ESTATE_LAW"
  | "IMMIGRATION_LAW"
  | "TAX_LAW"
  | "CONSTITUTIONAL_LAW";

export type VerificationStatus =
  | "PENDING_ONBOARDING"
  | "PENDING_VERIFICATION"
  | "VERIFIED"
  | "REJECTED"
  | "SUSPENDED";

export interface LawyerResponseDTO {
  id: number;
  userId: string;
  barRegistrationNumber: string;
  specializations: Specialization[];
  yearsOfExperience: number;
  bio: string;
  consultationFee: number;
  location: string;
  isAvailable: boolean;
  verificationStatus?: VerificationStatus;
  reviewCount: number;
  averageRating?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface LawyerDocument {
  id: number;
  lawyerId: number;
  documentType: string;
  fileUrl: string;
  uploadedAt: string;
}

export interface LawyerRequestDTO {
  userId: string;
  barRegistrationNumber: string;
  specializations: Specialization[];
  yearsOfExperience: number;
  bio: string;
  consultationFee: number;
  location: string;
}
