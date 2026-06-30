export type User = {
  id: string;
  name: string;
  email: string;
  company?: string;
  role?: string;
};

export type AuthSession = {
  user: User;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  fullName: string;
  company: string;
  email: string;
  password: string;
};

export type DocumentSummary = {
  id: string;
  name: string;
  type: string;
  status: string;
  uploadedAt: string;
  vendor?: string;
  confidence?: number;
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};
