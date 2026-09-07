export interface AdminUser {
  userId: number;

  fullName: string;
  email: string;
  phoneNumber?: string | null;
  avatarUrl?: string | null;

  isActive: boolean;
  createdAt: string;

  roles: string[];
}
