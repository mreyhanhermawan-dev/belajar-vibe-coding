import { IBaseEntity } from "./base.interface";

export type UmkmCategory = "MAKANAN" | "MINUMAN" | "KERAJINAN" | "JASA" | "LAINNYA";

export interface IUmkm extends IBaseEntity {
  name: string;
  description: string;
  ownerName: string;
  address: string;
  phone: string;
  category: UmkmCategory;
  imageUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
}

export interface ICreateUmkmDTO {
  name: string;
  description: string;
  ownerName: string;
  address: string;
  phone: string;
  category: UmkmCategory;
  imageUrl?: string;
  latitude?: number;
  longitude?: number;
}

export interface IUpdateUmkmDTO extends Partial<ICreateUmkmDTO> {
  isActive?: boolean;
}
