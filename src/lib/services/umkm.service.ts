import { UmkmRepository } from "@/lib/repositories/umkm.repository";
import { IService } from "@/lib/interfaces/base.interface";
import { IUmkm, ICreateUmkmDTO, IUpdateUmkmDTO, UmkmCategory } from "@/lib/interfaces/umkm.interface";

export class UmkmService implements IService<IUmkm, ICreateUmkmDTO, IUpdateUmkmDTO> {
  private readonly repository: UmkmRepository;

  constructor() {
    this.repository = new UmkmRepository();
  }

  async getAll(): Promise<IUmkm[]> {
    return this.repository.findAll();
  }

  async getActive(): Promise<IUmkm[]> {
    return this.repository.findActive();
  }

  async getByCategory(category: UmkmCategory): Promise<IUmkm[]> {
    return this.repository.findByCategory(category);
  }

  async getById(id: string): Promise<IUmkm> {
    const umkm = await this.repository.findById(id);
    if (!umkm) throw new Error("UMKM tidak ditemukan");
    return umkm;
  }

  async create(data: ICreateUmkmDTO): Promise<IUmkm> {
    const requiredFields: (keyof ICreateUmkmDTO)[] = [
      "name", "description", "ownerName", "address", "phone", "category",
    ];
    for (const field of requiredFields) {
      if (!data[field]) throw new Error(`Field ${field} wajib diisi`);
    }
    return this.repository.create(data);
  }

  async update(id: string, data: IUpdateUmkmDTO): Promise<IUmkm> {
    await this.getById(id);
    return this.repository.update(id, data);
  }

  async remove(id: string): Promise<void> {
    await this.getById(id);
    await this.repository.delete(id);
  }

  async toggleActive(id: string): Promise<IUmkm> {
    const umkm = await this.getById(id);
    return this.repository.update(id, { isActive: !umkm.isActive });
  }
}
