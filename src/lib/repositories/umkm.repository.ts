import prisma from "@/lib/prisma";
import { IRepository } from "@/lib/interfaces/base.interface";
import { IUmkm, ICreateUmkmDTO, IUpdateUmkmDTO, UmkmCategory } from "@/lib/interfaces/umkm.interface";

export class UmkmRepository implements IRepository<IUmkm, ICreateUmkmDTO, IUpdateUmkmDTO> {
  async findAll(): Promise<IUmkm[]> {
    return prisma.umkm.findMany({
      orderBy: { createdAt: "desc" },
    }) as Promise<IUmkm[]>;
  }

  async findActive(): Promise<IUmkm[]> {
    return prisma.umkm.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    }) as Promise<IUmkm[]>;
  }

  async findByCategory(category: UmkmCategory): Promise<IUmkm[]> {
    return prisma.umkm.findMany({
      where: { category, isActive: true },
      orderBy: { createdAt: "desc" },
    }) as Promise<IUmkm[]>;
  }

  async findById(id: string): Promise<IUmkm | null> {
    return prisma.umkm.findUnique({ where: { id } }) as Promise<IUmkm | null>;
  }

  async create(data: ICreateUmkmDTO): Promise<IUmkm> {
    return prisma.umkm.create({ data }) as Promise<IUmkm>;
  }

  async update(id: string, data: IUpdateUmkmDTO): Promise<IUmkm> {
    return prisma.umkm.update({ where: { id }, data }) as Promise<IUmkm>;
  }

  async delete(id: string): Promise<void> {
    await prisma.umkm.delete({ where: { id } });
  }
}
