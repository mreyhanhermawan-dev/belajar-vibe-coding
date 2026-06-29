import { NextRequest, NextResponse } from "next/server";
import { ProgramKknService } from "@/lib/services/program-kkn.service";
import { ApiResponse } from "@/lib/interfaces/base.interface";
import { IProgramKkn } from "@/lib/interfaces/program-kkn.interface";

const service = new ProgramKknService();

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<IProgramKkn[]>>> {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const data = status
      ? await service.getByStatus(status as "COMING_SOON" | "COMPLETED")
      : await service.getAll();

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<IProgramKkn>>> {
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
