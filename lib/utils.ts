import { clsx, type ClassValue } from "clsx";

import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const clientRedirectByRole = (router, role?: string) => {
  switch (role) {
    case "trainer":
      router.replace("/trainer");
      break;
    case "client":
      router.replace("/client");
      break;
    default:
      router.replace("/onboarding"); // fallback
  }
};

export const serverRedirectByRole = (redirect, role?: string) => {
  switch (role) {
    case "trainer":
      redirect("/trainer");
      break;
    case "client":
      redirect("/client");
      break;
    default:
      redirect("/onboarding"); // fallback
  }
};
