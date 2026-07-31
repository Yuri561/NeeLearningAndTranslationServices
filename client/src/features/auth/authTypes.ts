export type UserRole = "admin" | "tutor" | "learner";

export type AuthUser = {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  auth_provider: string;
  is_active: boolean;
  created_at: string;
};

export type AuthToken = {
  access_token: string;
  token_type: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = LoginInput & {
  full_name: string;
  role: "learner";
};

export type GoogleAuthorization = {
  authorization_url: string;
};

export type ChangePasswordInput = {
  current_password: string;
  new_password: string;
};

export type ChangePasswordResult = {
  message: string;
};
