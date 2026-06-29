import { IBaseEntity } from "./base.interface";

export interface IProfilDesa extends IBaseEntity {
  villageName: string;
  districtName: string;
  regencyName: string;
  provinceName: string;
  postalCode: string;
  address: string;
  phone: string;
  email: string;
  headName: string;
  headTitle: string;
  vision: string;
  mission: string;
  history: string;
  population: number;
  area: number;
  logoUrl: string | null;
  bannerUrl: string | null;
  mapEmbedUrl: string | null;
}

export interface IUpdateProfilDesaDTO {
  villageName?: string;
  districtName?: string;
  regencyName?: string;
  provinceName?: string;
  postalCode?: string;
  address?: string;
  phone?: string;
  email?: string;
  headName?: string;
  headTitle?: string;
  vision?: string;
  mission?: string;
  history?: string;
  population?: number;
  area?: number;
  logoUrl?: string;
  bannerUrl?: string;
  mapEmbedUrl?: string;
}
