import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, pattern = "PPP") {
  return format(new Date(date), pattern);
}

export function formatCurrency(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

export function extractPrimaryRole(roles: string[]): "CLIENT" | "LAWYER" | "ADMIN" {
  if (roles.includes("ADMIN")) return "ADMIN";
  if (roles.includes("LAWYER")) return "LAWYER";
  return "CLIENT";
}
