"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";

export interface HasilLoginAdmin {
  error?: string;
}

export async function loginAdminAction(
  _prevState: HasilLoginAdmin,
  formData: FormData,
): Promise<HasilLoginAdmin> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      mode: "admin",
      redirectTo: (formData.get("callbackUrl") as string) || "/admin",
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
