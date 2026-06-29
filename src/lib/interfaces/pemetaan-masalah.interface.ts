import { IBaseEntity } from "./base.interface";

export type PemetaanCategory = "TEMPAT_SAMPAH" | "JALUR_EVAKUASI";

export interface IPemetaanMasalah extends IBaseEntity {
  name: string;
  description: string;
  category: PemetaanCategory;
  latitude: number;
  longitude: number;
  imageUrl: string | null;
  address: string | null;
}

export interface ICreatePemetaanDTO {
  name: string;
  description: string;
  category: PemetaanCategory;
  latitude: number;
  longitude: number;
  imageUrl?: string;
  address?: string;
}

export interface IUpdatePemetaanDTO extends Partial<ICreatePemetaanDTO> {}
