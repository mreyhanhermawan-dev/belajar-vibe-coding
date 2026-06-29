import { IBaseEntity } from "./base.interface";

export type ProgramKknStatus = "COMING_SOON" | "COMPLETED";

export interface IProgramKkn extends IBaseEntity {
  title: string;
  description: string;
  imageUrl: string | null;
  status: ProgramKknStatus;
  startDate: Date | null;
  endDate: Date | null;
  location: string | null;
}

export interface ICreateProgramKknDTO {
  title: string;
  description: string;
  imageUrl?: string;
  status?: ProgramKknStatus;
  startDate?: string; // ISO string dari client
  endDate?: string;
  location?: string;
}

export interface IUpdateProgramKknDTO extends Partial<ICreateProgramKknDTO> {}
