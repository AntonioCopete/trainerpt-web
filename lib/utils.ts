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
    case "member":
      router.replace("/member");
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
    case "member":
      redirect("/member");
      break;
    default:
      redirect("/onboarding"); // fallback
  }
};
