export type Specialization =
  | "CORPORATE_LAW"
  | "CRIMINAL_LAW"
  | "FAMILY_LAW"
  | "INTELLECTUAL_PROPERTY"
  | "IMMIGRATION_LAW"
  | "EMPLOYMENT_LAW"
  | "REAL_ESTATE_LAW"
  | "TAX_LAW"
  | "PERSONAL_INJURY"
  | "BANKRUPTCY_LAW";

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
  totalRating: number;
  reviewCount: number;
  averageRating: number;
  createdAt: string;
  updatedAt: string;
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
