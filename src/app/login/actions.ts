"use server";

import { AuthService } from "@/lib/services/auth.service";
import { redirect } from "next/navigation";
import { ILoginDTO } from "@/lib/interfaces/auth.interface";

const authService = new AuthService();

export async function loginAction(formData: FormData) {
  const dto: ILoginDTO = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const result = await authService.login(dto);

  if (!result.success) {
    return { error: result.error };
  }

  redirect("/admin");
}

export async function logoutAction() {
  await authService.logout();
  redirect("/login");
}
