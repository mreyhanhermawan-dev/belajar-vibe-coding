import { PemetaanMasalahRepository } from "@/lib/repositories/pemetaan-masalah.repository";
import { IService } from "@/lib/interfaces/base.interface";
import {
  IPemetaanMasalah,
  ICreatePemetaanDTO,
  IUpdatePemetaanDTO,
  PemetaanCategory,
} from "@/lib/interfaces/pemetaan-masalah.interface";

export class PemetaanMasalahService
  implements IService<IPemetaanMasalah, ICreatePemetaanDTO, IUpdatePemetaanDTO>
{
  private readonly repository: PemetaanMasalahRepository;

  constructor() {
    this.repository = new PemetaanMasalahRepository();
  }

  async getAll(): Promise<IPemetaanMasalah[]> {
    return this.repository.findAll();
  }

  async getByCategory(category: PemetaanCategory): Promise<IPemetaanMasalah[]> {
    return this.repository.findByCategory(category);
  }

  async getById(id: string): Promise<IPemetaanMasalah> {
    const item = await this.repository.findById(id);
    if (!item) throw new Error("Titik pemetaan tidak ditemukan");
    return item;
  }

  async create(data: ICreatePemetaanDTO): Promise<IPemetaanMasalah> {
    if (!data.name || !data.description || !data.category) {
      throw new Error("Name, description, dan category wajib diisi");
    }
    if (typeof data.latitude !== "number" || typeof data.longitude !== "number") {
      throw new Error("Latitude dan longitude harus berupa angka");
    }
    return this.repository.create(data);
  }

  async update(id: string, data: IUpdatePemetaanDTO): Promise<IPemetaanMasalah> {
    await this.getById(id);
    return this.repository.update(id, data);
  }

  async remove(id: string): Promise<void> {
    await this.getById(id);
    await this.repository.delete(id);
  }
}
