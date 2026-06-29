import { NextRequest, NextResponse } from "next/server";
import { PemetaanMasalahService } from "@/lib/services/pemetaan-masalah.service";
import { ApiResponse } from "@/lib/interfaces/base.interface";
import { IPemetaanMasalah, PemetaanCategory } from "@/lib/interfaces/pemetaan-masalah.interface";

const service = new PemetaanMasalahService();

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<IPemetaanMasalah[]>>> {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") as PemetaanCategory | null;

    const data = category
      ? await service.getByCategory(category)
      : await service.getAll();

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<IPemetaanMasalah>>> {
  try {
    const body = await request.json();
    const data = await service.create(body);
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    const status = message.includes("wajib") || message.includes("harus") ? 400 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
