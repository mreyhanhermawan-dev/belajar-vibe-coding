import prisma from "@/lib/prisma";
import { IProfilDesa, IUpdateProfilDesaDTO } from "@/lib/interfaces/profil-desa.interface";

export class ProfilDesaRepository {
  /**
   * Ambil satu-satunya record profil desa.
   */
  async find(): Promise<IProfilDesa | null> {
    return prisma.profilDesa.findFirst() as Promise<IProfilDesa | null>;
  }

  /**
   * Update profil desa. Jika belum ada, buat baru (upsert).
   */
  async upsert(data: IUpdateProfilDesaDTO): Promise<IProfilDesa> {
    const existing = await this.find();

    if (existing) {
      return prisma.profilDesa.update({
        where: { id: existing.id },
        data,
      }) as Promise<IProfilDesa>;
    }

    return prisma.profilDesa.create({
      data: {
        ...data,
        villageName: data.villageName ?? "Kelurahan Palabuhanratu",
        districtName: data.districtName ?? "Kecamatan Palabuhanratu",
        regencyName: data.regencyName ?? "Kabupaten Sukabumi",
        provinceName: data.provinceName ?? "Jawa Barat",
      },
    }) as Promise<IProfilDesa>;
  }
}
