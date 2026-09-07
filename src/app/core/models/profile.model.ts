export interface UserProfile {
  userId: number;
  fullName: string;
  email: string;

  phoneNumber?: string | null;
  avatarUrl?: string | null;

  isActive: boolean;
  roles: string[];
}

export interface UpdateProfileRequest {
  fullName: string;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}
