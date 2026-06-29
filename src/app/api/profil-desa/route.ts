import { NextRequest, NextResponse } from "next/server";
import { ProfilDesaService } from "@/lib/services/profil-desa.service";
import { ApiResponse } from "@/lib/interfaces/base.interface";
import { IProfilDesa } from "@/lib/interfaces/profil-desa.interface";

const service = new ProfilDesaService();

export async function GET(): Promise<NextResponse<ApiResponse<IProfilDesa>>> {
  try {
    const data = await service.get();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse<ApiResponse<IProfilDesa>>> {
  try {
    const body = await request.json();
    const data = await service.update(body);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
