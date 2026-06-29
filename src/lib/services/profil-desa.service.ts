import { ProfilDesaRepository } from "@/lib/repositories/profil-desa.repository";
import { IProfilDesa, IUpdateProfilDesaDTO } from "@/lib/interfaces/profil-desa.interface";

export class ProfilDesaService {
  private readonly repository: ProfilDesaRepository;

  constructor() {
    this.repository = new ProfilDesaRepository();
  }

  async get(): Promise<IProfilDesa> {
    const profil = await this.repository.find();
    if (!profil) {
      // Return default — belum pernah di-update
      return {
        id: "",
        villageName: "Kelurahan Palabuhanratu",
        districtName: "Kecamatan Palabuhanratu",
        regencyName: "Kabupaten Sukabumi",
        provinceName: "Jawa Barat",
        postalCode: "",
        address: "",
        phone: "",
        email: "",
        headName: "",
        headTitle: "Lurah",
        vision: "",
        mission: "",
        history: "",
        population: 0,
        area: 0,
        logoUrl: null,
        bannerUrl: null,
        mapEmbedUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
    return profil;
  }

  async update(data: IUpdateProfilDesaDTO): Promise<IProfilDesa> {
    return this.repository.upsert(data);
  }
}
