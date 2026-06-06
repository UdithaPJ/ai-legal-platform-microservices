"use server";

import { signIn, signOut } from "@/lib/auth";

// ── Login ─────────────────────────────────────────────────────────────────────

export async function login() {
  await signIn("keycloak", { redirectTo: "/dashboard" });
}

// ── Registration ──────────────────────────────────────────────────────────────
//
// All registration actions use the "keycloak-register" provider which points
// at Keycloak's /registrations endpoint.  Auth.js generates the state + nonce
// cookies correctly, so the callback succeeds — unlike a raw redirect to
// /registrations which bypassed Auth.js and caused the Configuration error.

/** Generic registration — shows the role-selection screen (Step 1). */
export async function register() {
  await signIn("keycloak-register", { redirectTo: "/dashboard" });
}

/** Registration pre-filled for a client ("Find a Lawyer" CTA). */
export async function registerAsClient() {
  await signIn("keycloak-register", { redirectTo: "/dashboard" }, {
    "user.attributes.role": "CLIENT",
  });
}

/** Registration pre-filled for a lawyer ("I'm a Lawyer" CTA). */
export async function registerAsLawyer() {
  await signIn("keycloak-register", { redirectTo: "/dashboard" }, {
    "user.attributes.role": "LAWYER",
  });
}

// ── Logout ────────────────────────────────────────────────────────────────────

export async function logout() {
  await signOut({ redirectTo: "/" });
}
