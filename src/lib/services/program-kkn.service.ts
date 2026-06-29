import { ProgramKknRepository } from "@/lib/repositories/program-kkn.repository";
import { IService } from "@/lib/interfaces/base.interface";
import {
  IProgramKkn,
  ICreateProgramKknDTO,
  IUpdateProgramKknDTO,
  ProgramKknStatus,
} from "@/lib/interfaces/program-kkn.interface";

export class ProgramKknService
  implements IService<IProgramKkn, ICreateProgramKknDTO, IUpdateProgramKknDTO>
{
  private readonly repository: ProgramKknRepository;

  constructor() {
    this.repository = new ProgramKknRepository();
  }

  async getAll(): Promise<IProgramKkn[]> {
    return this.repository.findAll();
  }

  async getByStatus(status: ProgramKknStatus): Promise<IProgramKkn[]> {
    return this.repository.findByStatus(status);
  }

  async getById(id: string): Promise<IProgramKkn> {
    const program = await this.repository.findById(id);
    if (!program) throw new Error("Program KKN tidak ditemukan");
    return program;
  }

  async create(data: ICreateProgramKknDTO): Promise<IProgramKkn> {
    if (!data.title || !data.description) {
      throw new Error("Title dan description wajib diisi");
    }
    return this.repository.create(data);
  }

  async update(id: string, data: IUpdateProgramKknDTO): Promise<IProgramKkn> {
    await this.getById(id); // Pastikan exists
    return this.repository.update(id, data);
  }

  async remove(id: string): Promise<void> {
    await this.getById(id);
    await this.repository.delete(id);
  }
}
