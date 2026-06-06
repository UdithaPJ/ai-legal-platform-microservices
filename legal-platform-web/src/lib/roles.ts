export const ROLES = {
  ADMIN: "ADMIN",
  LAWYER: "LAWYER",
  CLIENT: "CLIENT",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export function isAdmin(roles: string[]): boolean {
  return roles.includes(ROLES.ADMIN);
}

export function isLawyer(roles: string[]): boolean {
  return roles.includes(ROLES.LAWYER);
}

export function isClient(roles: string[]): boolean {
  return roles.includes(ROLES.CLIENT);
}
