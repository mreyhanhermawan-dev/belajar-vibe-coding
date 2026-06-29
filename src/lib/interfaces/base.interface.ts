export interface IBaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRepository<T, CreateDTO, UpdateDTO> {
  findAll(): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  create(data: CreateDTO): Promise<T>;
  update(id: string, data: UpdateDTO): Promise<T>;
  delete(id: string): Promise<void>;
}

export interface IService<T, CreateDTO, UpdateDTO> {
  getAll(): Promise<T[]>;
  getById(id: string): Promise<T>;
  create(data: CreateDTO): Promise<T>;
  update(id: string, data: UpdateDTO): Promise<T>;
  remove(id: string): Promise<void>;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
