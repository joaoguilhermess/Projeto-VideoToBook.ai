export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/**
 * API endpoints for local authentication
 */
export const AUTH_ENDPOINTS = {
  LOGIN: "/api/auth/login",
  REGISTER: "/api/auth/register",
  LOGOUT: "/api/trpc/auth.logout",
} as const;
