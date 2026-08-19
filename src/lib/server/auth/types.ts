export type ProfileRole = "admin" | "staff" | "customer";
export type AccountStatus = "active" | "inactive" | "pending";

/** Nest session user shape (api-contract.md#session-user-shape). */
export type SessionUser = {
  id: string;
  email: string | null;
  role: ProfileRole;
  account_status: AccountStatus;
  owner_id: string;
  must_change_password: boolean;
};

export type AuthSession = {
  user: SessionUser | null;
};

export type AuthTokensResponse = {
  user: SessionUser;
  access_token: string;
  refresh_token: string;
};
