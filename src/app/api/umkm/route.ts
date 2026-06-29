import { NextRequest, NextResponse } from "next/server";
import { UmkmService } from "@/lib/services/umkm.service";
import { ApiResponse } from "@/lib/interfaces/base.interface";
import { IUmkm, UmkmCategory } from "@/lib/interfaces/umkm.interface";

const service = new UmkmService();

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<IUmkm[]>>> {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") as UmkmCategory | null;
    const activeOnly = searchParams.get("active") === "true";

    let data: IUmkm[];
    if (category) {
      data = await service.getByCategory(category);
    } else if (activeOnly) {
      data = await service.getActive();
    } else {
      data = await service.getAll();
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<IUmkm>>> {
  try {
    const body = await request.json();
    const data = await service.create(body);
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    const status = message.includes("wajib") ? 400 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
