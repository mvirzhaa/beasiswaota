"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";

export interface HasilLogin {
  error?: string;
}

export async function loginAction(
  _prevState: HasilLogin,
  formData: FormData,
): Promise<HasilLogin> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: (formData.get("callbackUrl") as string) || "/",
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        error: "Email atau kata sandi salah, atau akun Anda belum diverifikasi.",
      };
    }
    throw error;
  }
}
