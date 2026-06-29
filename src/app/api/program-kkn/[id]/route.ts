import { NextRequest, NextResponse } from "next/server";
import { ProgramKknService } from "@/lib/services/program-kkn.service";
import { ApiResponse } from "@/lib/interfaces/base.interface";
import { IProgramKkn } from "@/lib/interfaces/program-kkn.interface";

const service = new ProgramKknService();

type Params = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: Params): Promise<NextResponse<ApiResponse<IProgramKkn>>> {
  try {
    const { id } = await params;
    const data = await service.getById(id);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ success: false, error: message }, { status: 404 });
  }
}

export async function PUT(request: NextRequest, { params }: Params): Promise<NextResponse<ApiResponse<IProgramKkn>>> {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = await service.update(id, body);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function DELETE(_: NextRequest, { params }: Params): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const { id } = await params;
    await service.remove(id);
    return NextResponse.json({ success: true, message: "Berhasil dihapus" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ success: false, error: message }, { status: 404 });
  }
}
