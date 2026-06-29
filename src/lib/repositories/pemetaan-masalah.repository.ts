import prisma from "@/lib/prisma";
import { IRepository } from "@/lib/interfaces/base.interface";
import {
  IPemetaanMasalah,
  ICreatePemetaanDTO,
  IUpdatePemetaanDTO,
  PemetaanCategory,
} from "@/lib/interfaces/pemetaan-masalah.interface";

export class PemetaanMasalahRepository
  implements IRepository<IPemetaanMasalah, ICreatePemetaanDTO, IUpdatePemetaanDTO>
{
  async findAll(): Promise<IPemetaanMasalah[]> {
    return prisma.pemetaanMasalah.findMany({
      orderBy: { createdAt: "desc" },
    }) as Promise<IPemetaanMasalah[]>;
  }

  async findByCategory(category: PemetaanCategory): Promise<IPemetaanMasalah[]> {
    return prisma.pemetaanMasalah.findMany({
      where: { category },
      orderBy: { createdAt: "desc" },
    }) as Promise<IPemetaanMasalah[]>;
  }

  async findById(id: string): Promise<IPemetaanMasalah | null> {
    return prisma.pemetaanMasalah.findUnique({
      where: { id },
    }) as Promise<IPemetaanMasalah | null>;
  }

  async create(data: ICreatePemetaanDTO): Promise<IPemetaanMasalah> {
    return prisma.pemetaanMasalah.create({ data }) as Promise<IPemetaanMasalah>;
  }

  async update(id: string, data: IUpdatePemetaanDTO): Promise<IPemetaanMasalah> {
    return prisma.pemetaanMasalah.update({
      where: { id },
      data,
    }) as Promise<IPemetaanMasalah>;
  }

  async delete(id: string): Promise<void> {
    await prisma.pemetaanMasalah.delete({ where: { id } });
  }
}
