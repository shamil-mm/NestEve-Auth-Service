export interface LoginDataDTO {
  id: string;
  email: string;
  name: string;
  role: "user" | "organizer" | "admin";
  avatarUrl?: string;
  is_block: boolean;
}


export interface LoginResponse {
  status: boolean;
  message: string;
  data: LoginDataDTO;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}