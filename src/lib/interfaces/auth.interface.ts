export interface IAdminProfile {
  id: string;
  authUserId: string;
  email: string;
  fullName: string;
  role: "SUPER_ADMIN" | "ADMIN";
  createdAt: Date;
  updatedAt: Date;
}

export interface ILoginDTO {
  email: string;
  password: string;
}

export interface IAuthResult {
  user: IAdminProfile | null;
  accessToken?: string;
  error?: string;
}
