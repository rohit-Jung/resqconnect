export interface ISuperAdminLoginResponse {
  token: string;
  superAdmin: {
    id: string;
    email: string;
    name: string;
    role: 'super_admin';
  };
  message?: string;
}

export interface ISuperAdminProfileResponse {
  id: string;
  name: string;
  email: string;
  role: 'super_admin';
  createdAt: string;
}
