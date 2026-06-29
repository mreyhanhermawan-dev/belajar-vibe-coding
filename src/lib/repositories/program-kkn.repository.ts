import prisma from "@/lib/prisma";
import { IRepository } from "@/lib/interfaces/base.interface";
import {
  IProgramKkn,
  ICreateProgramKknDTO,
  IUpdateProgramKknDTO,
  ProgramKknStatus,
} from "@/lib/interfaces/program-kkn.interface";

export class ProgramKknRepository
  implements IRepository<IProgramKkn, ICreateProgramKknDTO, IUpdateProgramKknDTO>
{
  async findAll(): Promise<IProgramKkn[]> {
    return prisma.programKkn.findMany({
      orderBy: { createdAt: "desc" },
    }) as Promise<IProgramKkn[]>;
  }

  async findByStatus(status: ProgramKknStatus): Promise<IProgramKkn[]> {
    return prisma.programKkn.findMany({
      where: { status },
      orderBy: { createdAt: "desc" },
    }) as Promise<IProgramKkn[]>;
  }

  async findById(id: string): Promise<IProgramKkn | null> {
    return prisma.programKkn.findUnique({
      where: { id },
    }) as Promise<IProgramKkn | null>;
  }

  async create(data: ICreateProgramKknDTO): Promise<IProgramKkn> {
    return prisma.programKkn.create({
      data: {
        title: data.title,
        description: data.description,
        imageUrl: data.imageUrl,
        status: data.status ?? "COMING_SOON",
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        location: data.location,
      },
    }) as Promise<IProgramKkn>;
  }

  async update(id: string, data: IUpdateProgramKknDTO): Promise<IProgramKkn> {
    return prisma.programKkn.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
    }) as Promise<IProgramKkn>;
  }

  async delete(id: string): Promise<void> {
    await prisma.programKkn.delete({ where: { id } });
  }
}
