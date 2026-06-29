import { createServerClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { ILoginDTO, IAuthResult, IAdminProfile } from "@/lib/interfaces/auth.interface";
import { ApiResponse } from "@/lib/interfaces/base.interface";

export class AuthService {
  /**
   * Login admin via Supabase Auth, lalu fetch profil dari Prisma.
   */
  async login(dto: ILoginDTO): Promise<ApiResponse<IAuthResult>> {
    try {
      const supabase = await createServerClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: dto.email,
        password: dto.password,
      });

      if (error || !data.user) {
        return { success: false, error: error?.message ?? "Login gagal" };
      }

      const profile = await prisma.adminProfile.findUnique({
        where: { authUserId: data.user.id },
      });

      if (!profile) {
        await supabase.auth.signOut();
        return { success: false, error: "Akun tidak terdaftar sebagai admin" };
      }

      return {
        success: true,
        data: {
          user: profile as IAdminProfile,
          accessToken: data.session?.access_token,
        },
      };
    } catch (err) {
      return { success: false, error: "Internal server error" };
    }
  }

  /**
   * Logout admin — hapus session Supabase.
   */
  async logout(): Promise<ApiResponse<null>> {
    try {
      const supabase = await createServerClient();
      await supabase.auth.signOut();
      return { success: true, message: "Logged out" };
    } catch {
      return { success: false, error: "Logout gagal" };
    }
  }

  /**
   * Ambil current user session + profile.
   */
  async getCurrentAdmin(): Promise<IAdminProfile | null> {
    try {
      const supabase = await createServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      return await prisma.adminProfile.findUnique({
        where: { authUserId: user.id },
      }) as IAdminProfile | null;
    } catch {
      return null;
    }
  }
}
