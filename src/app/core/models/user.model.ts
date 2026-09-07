export interface CurrentUser {
  userId: number;
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  roles: string[];
}
