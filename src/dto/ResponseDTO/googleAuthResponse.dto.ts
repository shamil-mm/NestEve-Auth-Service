export interface GoogleAuthResponseDTO {
  email: string;
  role: "organizer" | "user" | "admin";
  isBlocked: boolean;
}