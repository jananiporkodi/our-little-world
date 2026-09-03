"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isCorrectPasscode, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/auth";

export interface LoginState {
  error?: string;
}

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const passcode = String(formData.get("passcode") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/");

  let correct = false;
  try {
    correct = isCorrectPasscode(passcode);
  } catch {
    return { error: "The app isn't configured yet — set APP_PASSCODE in .env.local." };
  }

  if (!correct) {
    return { error: "That's not quite it — try again." };
  }

  cookies().set(SESSION_COOKIE_NAME, passcode.trim(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });

  redirect(redirectTo || "/");
}
