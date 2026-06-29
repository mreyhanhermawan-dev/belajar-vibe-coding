# Target Repository
https://github.com/mreyhanhermawan-dev/belajar-vibe-coding.git

# Execution Kit — Website Kelurahan Palabuhanratu

> **Target**: Model murah (GPT-3.5 / Haiku / Llama-8B)
> **Stack**: Next.js 14 App Router · TypeScript · Supabase · Prisma ORM
> **Pattern**: Strict OOP — Service Layer, Repository Pattern, DTO Validation

---

## GLOBAL CONVENTIONS (Berlaku untuk SEMUA Modul)

### Folder Structure

```
src/
├── app/
│   ├── (public)/          # Halaman publik
│   ├── admin/             # Halaman admin (protected)
│   │   ├── layout.tsx
│   │   ├── program-kkn/
│   │   ├── pemetaan-masalah/
│   │   ├── umkm/
│   │   └── profil-desa/
│   ├── api/
│   │   ├── auth/
│   │   ├── program-kkn/
│   │   ├── pemetaan-masalah/
│   │   ├── umkm/
│   │   └── profil-desa/
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── prisma.ts          # Prisma singleton
│   ├── supabase/
│   │   ├── server.ts      # createServerClient
│   │   ├── client.ts      # createBrowserClient
│   ├── repositories/      # Repository classes
│   ├── services/          # Service classes (business logic)
│   ├── dto/               # Data Transfer Objects
│   ├── interfaces/        # TypeScript interfaces
│   ├── middleware/         # Auth middleware helpers
│   └── utils/             # Helpers
├── components/
│   ├── ui/                # Reusable UI components
│   ├── forms/             # Form components per module
│   └── layouts/           # Layout components
├── prisma/
│   └── schema.prisma
├── middleware.ts           # Next.js root middleware
└── types/                 # Global types
```

### Prisma Singleton

```typescript
// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
```

### Base Interfaces

```typescript
// src/lib/interfaces/base.interface.ts
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
```

### Supabase Client Setup

```typescript
// src/lib/supabase/server.ts
import { createServerClient as _createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createServerClient() {
  const cookieStore = await cookies();
  return _createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}

// src/lib/supabase/client.ts
import { createBrowserClient as _createBrowserClient } from "@supabase/ssr";

export function createBrowserClient() {
  return _createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

---
---

## MODUL 1: Authentication & Admin Role

### 1.1 SYSTEM PROMPT

```
Kamu adalah Senior TypeScript Engineer. Kamu HANYA menghasilkan kode OOP TypeScript untuk Next.js 14 App Router dengan Supabase Auth.

ATURAN KETAT:
- Autentikasi menggunakan Supabase Auth (email/password), BUKAN Prisma.
- Role admin disimpan di tabel `admin_profiles` (Prisma) yang terhubung ke Supabase auth.users via `authUserId`.
- Middleware Next.js memproteksi semua route /admin/*.
- Gunakan Server Actions untuk login/logout.
- JANGAN gunakan `any`. Semua harus typed.
- JANGAN buat fungsi di luar class kecuali untuk factory/helper murni.
- Gunakan pattern: AuthService class yang membungkus Supabase client.
- Response selalu menggunakan interface ApiResponse<T>.
```

### 1.2 DATA MODEL

```prisma
// prisma/schema.prisma (bagian auth)
model AdminProfile {
  id         String   @id @default(cuid())
  authUserId String   @unique // FK ke Supabase auth.users.id
  email      String   @unique
  fullName   String
  role       Role     @default(ADMIN)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@map("admin_profiles")
}

enum Role {
  SUPER_ADMIN
  ADMIN
}
```

```typescript
// src/lib/interfaces/auth.interface.ts
export interface IAdminProfile {
  id: string;
  authUserId: string;
  email: string;
  fullName: string;
  role: "SUPER_ADMIN" | "ADMIN";
  createdAt: Date;
  updatedAt: Date;
}

export interface ILoginDTO {
  email: string;
  password: string;
}

export interface IAuthResult {
  user: IAdminProfile | null;
  accessToken?: string;
  error?: string;
}
```

### 1.3 FEW-SHOT EXAMPLE

```typescript
// src/lib/services/auth.service.ts
import { createServerClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { ILoginDTO, IAuthResult, IAdminProfile } from "@/lib/interfaces/auth.interface";
import { ApiResponse } from "@/lib/interfaces/base.interface";

export class AuthService {
  /**
   * Login admin via Supabase Auth, lalu fetch profil dari Prisma.
   */
  async login(dto: ILoginDTO): Promise<ApiResponse<IAuthResult>> {
    try {
      const supabase = await createServerClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: dto.email,
        password: dto.password,
      });

      if (error || !data.user) {
        return { success: false, error: error?.message ?? "Login gagal" };
      }

      const profile = await prisma.adminProfile.findUnique({
        where: { authUserId: data.user.id },
      });

      if (!profile) {
        await supabase.auth.signOut();
        return { success: false, error: "Akun tidak terdaftar sebagai admin" };
      }

      return {
        success: true,
        data: {
          user: profile as IAdminProfile,
          accessToken: data.session?.access_token,
        },
      };
    } catch (err) {
      return { success: false, error: "Internal server error" };
    }
  }

  /**
   * Logout admin — hapus session Supabase.
   */
  async logout(): Promise<ApiResponse<null>> {
    try {
      const supabase = await createServerClient();
      await supabase.auth.signOut();
      return { success: true, message: "Logged out" };
    } catch {
      return { success: false, error: "Logout gagal" };
    }
  }

  /**
   * Ambil current user session + profile.
   */
  async getCurrentAdmin(): Promise<IAdminProfile | null> {
    try {
      const supabase = await createServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      return await prisma.adminProfile.findUnique({
        where: { authUserId: user.id },
      }) as IAdminProfile | null;
    } catch {
      return null;
    }
  }
}
```

```typescript
// src/middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Proteksi route /admin/*
  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Jika sudah login, redirect dari /login ke /admin
  if (request.nextUrl.pathname === "/login" && user) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
};
```

```typescript
// src/app/login/actions.ts
"use server";

import { AuthService } from "@/lib/services/auth.service";
import { redirect } from "next/navigation";
import { ILoginDTO } from "@/lib/interfaces/auth.interface";

const authService = new AuthService();

export async function loginAction(formData: FormData) {
  const dto: ILoginDTO = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const result = await authService.login(dto);

  if (!result.success) {
    return { error: result.error };
  }

  redirect("/admin");
}

export async function logoutAction() {
  await authService.logout();
  redirect("/login");
}
```

### 1.4 STEP-BY-STEP GENERATION INSTRUCTION

```
LANGKAH GENERASI KODE MODUL AUTH:

1. BUAT file `src/lib/interfaces/auth.interface.ts`
   - Definisikan IAdminProfile, ILoginDTO, IAuthResult sesuai spec.

2. BUAT file `src/lib/services/auth.service.ts`
   - Class AuthService dengan method: login(), logout(), getCurrentAdmin().
   - login() memanggil Supabase signInWithPassword, lalu query Prisma adminProfile.
   - SELALU return ApiResponse<T>. Jangan throw — tangkap error dan return object error.

3. BUAT file `src/middleware.ts`
   - Cek auth via supabase.auth.getUser().
   - Redirect ke /login jika user null dan route dimulai dengan /admin.
   - Redirect ke /admin jika user ada dan route adalah /login.
   - Export config.matcher = ["/admin/:path*", "/login"].

4. BUAT file `src/app/login/actions.ts`
   - Server Action loginAction(formData) — extract email & password, panggil authService.login().
   - Server Action logoutAction() — panggil authService.logout(), redirect ke /login.

5. BUAT file `src/app/login/page.tsx`
   - Form dengan input email, password, submit button.
   - Gunakan useFormState atau useActionState untuk handle error dari server action.
   - Tampilkan error message dari result.

6. VALIDASI:
   - Pastikan semua import path benar (gunakan @/ alias).
   - Pastikan tidak ada `any`.
   - Pastikan middleware.ts ada di root `src/`.
```

---
---

## MODUL 2: CRUD Program KKN (Coming Soon & Completed)

### 2.1 SYSTEM PROMPT

```
Kamu adalah Senior TypeScript Engineer. Kamu HANYA menghasilkan kode OOP TypeScript untuk Next.js 14 App Router + Prisma ORM.

ATURAN KETAT:
- Ikuti pattern: Repository → Service → API Route Handler.
- Repository class mengenkapsulasi semua query Prisma.
- Service class berisi business logic, memanggil Repository.
- API Route (route.ts) hanya memanggil Service, parse request, dan return NextResponse.
- Gunakan DTO interface untuk input validation.
- Status program: COMING_SOON | COMPLETED.
- JANGAN gunakan `any`. JANGAN buat fungsi loose di luar class.
- Response selalu ApiResponse<T>.
- Semua method async, semua error di-catch di Service layer.
```

### 2.2 DATA MODEL

```prisma
model ProgramKkn {
  id          String           @id @default(cuid())
  title       String
  description String           @db.Text
  imageUrl    String?
  status      ProgramKknStatus @default(COMING_SOON)
  startDate   DateTime?
  endDate     DateTime?
  location    String?
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  @@map("program_kkn")
}

enum ProgramKknStatus {
  COMING_SOON
  COMPLETED
}
```

```typescript
// src/lib/interfaces/program-kkn.interface.ts
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
```

### 2.3 FEW-SHOT EXAMPLE

```typescript
// src/lib/repositories/program-kkn.repository.ts
import prisma from "@/lib/prisma";
import { IRepository } from "@/lib/interfaces/base.interface";
import {
  IProgramKkn,
  ICreateProgramKknDTO,
  IUpdateProgramKknDTO,
  ProgramKknStatus,
} from "@/lib/interfaces/program-kkn.interface";

export class ProgramKknRepository
  implements IRepository<IProgramKkn, ICreateProgramKknDTO, IUpdateProgramKknDTO>
{
  async findAll(): Promise<IProgramKkn[]> {
    return prisma.programKkn.findMany({
      orderBy: { createdAt: "desc" },
    }) as Promise<IProgramKkn[]>;
  }

  async findByStatus(status: ProgramKknStatus): Promise<IProgramKkn[]> {
    return prisma.programKkn.findMany({
      where: { status },
      orderBy: { createdAt: "desc" },
    }) as Promise<IProgramKkn[]>;
  }

  async findById(id: string): Promise<IProgramKkn | null> {
    return prisma.programKkn.findUnique({
      where: { id },
    }) as Promise<IProgramKkn | null>;
  }

  async create(data: ICreateProgramKknDTO): Promise<IProgramKkn> {
    return prisma.programKkn.create({
      data: {
        title: data.title,
        description: data.description,
        imageUrl: data.imageUrl,
        status: data.status ?? "COMING_SOON",
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        location: data.location,
      },
    }) as Promise<IProgramKkn>;
  }

  async update(id: string, data: IUpdateProgramKknDTO): Promise<IProgramKkn> {
    return prisma.programKkn.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
    }) as Promise<IProgramKkn>;
  }

  async delete(id: string): Promise<void> {
    await prisma.programKkn.delete({ where: { id } });
  }
}
```

```typescript
// src/lib/services/program-kkn.service.ts
import { ProgramKknRepository } from "@/lib/repositories/program-kkn.repository";
import { IService, ApiResponse } from "@/lib/interfaces/base.interface";
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
```

```typescript
// src/app/api/program-kkn/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ProgramKknService } from "@/lib/services/program-kkn.service";
import { ApiResponse } from "@/lib/interfaces/base.interface";
import { IProgramKkn } from "@/lib/interfaces/program-kkn.interface";

const service = new ProgramKknService();

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<IProgramKkn[]>>> {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const data = status
      ? await service.getByStatus(status as "COMING_SOON" | "COMPLETED")
      : await service.getAll();

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<IProgramKkn>>> {
  try {
    const body = await request.json();
    const data = await service.create(body);
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    const status = message.includes("wajib") ? 400 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
```

```typescript
// src/app/api/program-kkn/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ProgramKknService } from "@/lib/services/program-kkn.service";
import { ApiResponse } from "@/lib/interfaces/base.interface";
import { IProgramKkn } from "@/lib/interfaces/program-kkn.interface";

const service = new ProgramKknService();

type Params = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: Params): Promise<NextResponse<ApiResponse<IProgramKkn>>> {
  try {
    const { id } = await params;
    const data = await service.getById(id);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ success: false, error: message }, { status: 404 });
  }
}

export async function PUT(request: NextRequest, { params }: Params): Promise<NextResponse<ApiResponse<IProgramKkn>>> {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = await service.update(id, body);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function DELETE(_: NextRequest, { params }: Params): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const { id } = await params;
    await service.remove(id);
    return NextResponse.json({ success: true, message: "Berhasil dihapus" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ success: false, error: message }, { status: 404 });
  }
}
```

### 2.4 STEP-BY-STEP GENERATION INSTRUCTION

```
LANGKAH GENERASI KODE MODUL PROGRAM KKN:

1. PASTIKAN schema.prisma sudah berisi model ProgramKkn dan enum ProgramKknStatus.

2. BUAT `src/lib/interfaces/program-kkn.interface.ts`
   - IProgramKkn extends IBaseEntity.
   - ICreateProgramKknDTO (field wajib: title, description).
   - IUpdateProgramKknDTO = Partial<ICreateProgramKknDTO>.

3. BUAT `src/lib/repositories/program-kkn.repository.ts`
   - Class ProgramKknRepository implements IRepository<...>.
   - Methods: findAll, findByStatus, findById, create, update, delete.
   - Semua menggunakan prisma client.

4. BUAT `src/lib/services/program-kkn.service.ts`
   - Class ProgramKknService implements IService<...>.
   - Inject ProgramKknRepository di constructor.
   - getById() harus throw Error jika null.
   - create() validasi field wajib.
   - update() & remove() panggil getById() dulu untuk cek existence.

5. BUAT `src/app/api/program-kkn/route.ts`
   - GET: support query param `?status=COMING_SOON|COMPLETED`.
   - POST: parse body, panggil service.create().
   - Semua response pakai NextResponse.json({ success, data/error }).

6. BUAT `src/app/api/program-kkn/[id]/route.ts`
   - GET, PUT, DELETE handlers.
   - params diakses via `const { id } = await params;` (Next.js 15 pattern).

7. VALIDASI:
   - Tidak ada `any`.
   - Semua method return type eksplisit.
   - Error handling konsisten: catch → return ApiResponse error.
```

---
---

## MODUL 3: CRUD Pemetaan Masalah (Tempat Sampah & Evakuasi)

### 3.1 SYSTEM PROMPT

```
Kamu adalah Senior TypeScript Engineer. Kamu HANYA menghasilkan kode OOP TypeScript untuk Next.js 14 App Router + Prisma ORM.

ATURAN KETAT:
- Ikuti pattern: Repository → Service → API Route Handler.
- Modul ini menyimpan titik pemetaan masalah dengan koordinat GPS (latitude, longitude).
- Kategori: TEMPAT_SAMPAH | JALUR_EVAKUASI.
- Setiap titik punya nama, deskripsi, koordinat, gambar, dan kategori.
- Repository extends IRepository. Service extends IService.
- JANGAN gunakan `any`. JANGAN buat fungsi loose di luar class.
- Response selalu ApiResponse<T>.
- Field latitude dan longitude bertipe Float di Prisma, number di TypeScript.
```

### 3.2 DATA MODEL

```prisma
model PemetaanMasalah {
  id          String              @id @default(cuid())
  name        String
  description String              @db.Text
  category    PemetaanCategory
  latitude    Float
  longitude   Float
  imageUrl    String?
  address     String?
  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt

  @@map("pemetaan_masalah")
}

enum PemetaanCategory {
  TEMPAT_SAMPAH
  JALUR_EVAKUASI
}
```

```typescript
// src/lib/interfaces/pemetaan-masalah.interface.ts
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
```

### 3.3 FEW-SHOT EXAMPLE

```typescript
// src/lib/repositories/pemetaan-masalah.repository.ts
import prisma from "@/lib/prisma";
import { IRepository } from "@/lib/interfaces/base.interface";
import {
  IPemetaanMasalah,
  ICreatePemetaanDTO,
  IUpdatePemetaanDTO,
  PemetaanCategory,
} from "@/lib/interfaces/pemetaan-masalah.interface";

export class PemetaanMasalahRepository
  implements IRepository<IPemetaanMasalah, ICreatePemetaanDTO, IUpdatePemetaanDTO>
{
  async findAll(): Promise<IPemetaanMasalah[]> {
    return prisma.pemetaanMasalah.findMany({
      orderBy: { createdAt: "desc" },
    }) as Promise<IPemetaanMasalah[]>;
  }

  async findByCategory(category: PemetaanCategory): Promise<IPemetaanMasalah[]> {
    return prisma.pemetaanMasalah.findMany({
      where: { category },
      orderBy: { createdAt: "desc" },
    }) as Promise<IPemetaanMasalah[]>;
  }

  async findById(id: string): Promise<IPemetaanMasalah | null> {
    return prisma.pemetaanMasalah.findUnique({
      where: { id },
    }) as Promise<IPemetaanMasalah | null>;
  }

  async create(data: ICreatePemetaanDTO): Promise<IPemetaanMasalah> {
    return prisma.pemetaanMasalah.create({ data }) as Promise<IPemetaanMasalah>;
  }

  async update(id: string, data: IUpdatePemetaanDTO): Promise<IPemetaanMasalah> {
    return prisma.pemetaanMasalah.update({
      where: { id },
      data,
    }) as Promise<IPemetaanMasalah>;
  }

  async delete(id: string): Promise<void> {
    await prisma.pemetaanMasalah.delete({ where: { id } });
  }
}
```

```typescript
// src/lib/services/pemetaan-masalah.service.ts
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
```

```typescript
// src/app/api/pemetaan-masalah/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PemetaanMasalahService } from "@/lib/services/pemetaan-masalah.service";
import { ApiResponse } from "@/lib/interfaces/base.interface";
import { IPemetaanMasalah, PemetaanCategory } from "@/lib/interfaces/pemetaan-masalah.interface";

const service = new PemetaanMasalahService();

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<IPemetaanMasalah[]>>> {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") as PemetaanCategory | null;

    const data = category
      ? await service.getByCategory(category)
      : await service.getAll();

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<IPemetaanMasalah>>> {
  try {
    const body = await request.json();
    const data = await service.create(body);
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    const status = message.includes("wajib") || message.includes("harus") ? 400 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
```

### 3.4 STEP-BY-STEP GENERATION INSTRUCTION

```
LANGKAH GENERASI KODE MODUL PEMETAAN MASALAH:

1. PASTIKAN schema.prisma sudah berisi model PemetaanMasalah dan enum PemetaanCategory.

2. BUAT `src/lib/interfaces/pemetaan-masalah.interface.ts`
   - IPemetaanMasalah extends IBaseEntity (punya latitude: number, longitude: number).
   - ICreatePemetaanDTO (wajib: name, description, category, latitude, longitude).
   - IUpdatePemetaanDTO = Partial<ICreatePemetaanDTO>.

3. BUAT `src/lib/repositories/pemetaan-masalah.repository.ts`
   - Class PemetaanMasalahRepository implements IRepository<...>.
   - Tambahkan method findByCategory(category).
   - Semua query via prisma.pemetaanMasalah.

4. BUAT `src/lib/services/pemetaan-masalah.service.ts`
   - Class PemetaanMasalahService implements IService<...>.
   - Validasi create: cek field wajib + tipe latitude/longitude harus number.
   - Tambah method getByCategory().

5. BUAT `src/app/api/pemetaan-masalah/route.ts` (GET + POST)
   - GET support query param `?category=TEMPAT_SAMPAH|JALUR_EVAKUASI`.

6. BUAT `src/app/api/pemetaan-masalah/[id]/route.ts` (GET + PUT + DELETE)
   - Ikuti pattern persis seperti modul Program KKN [id]/route.ts.

7. VALIDASI:
   - latitude/longitude bertipe Float di Prisma, number di TypeScript.
   - Tidak ada `any`.
   - Error handling konsisten.
```

---
---

## MODUL 4: CRUD UMKM Palabuhanratu

### 4.1 SYSTEM PROMPT

```
Kamu adalah Senior TypeScript Engineer. Kamu HANYA menghasilkan kode OOP TypeScript untuk Next.js 14 App Router + Prisma ORM.

ATURAN KETAT:
- Ikuti pattern: Repository → Service → API Route Handler.
- UMKM punya: nama, deskripsi, pemilik, alamat, nomor telepon, kategori, gambar, dan koordinat opsional.
- Kategori UMKM: MAKANAN | MINUMAN | KERAJINAN | JASA | LAINNYA.
- Repository extends IRepository. Service extends IService.
- JANGAN gunakan `any`. JANGAN buat fungsi loose di luar class.
- Response selalu ApiResponse<T>.
```

### 4.2 DATA MODEL

```prisma
model Umkm {
  id          String       @id @default(cuid())
  name        String
  description String       @db.Text
  ownerName   String
  address     String
  phone       String
  category    UmkmCategory
  imageUrl    String?
  latitude    Float?
  longitude   Float?
  isActive    Boolean      @default(true)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  @@map("umkm")
}

enum UmkmCategory {
  MAKANAN
  MINUMAN
  KERAJINAN
  JASA
  LAINNYA
}
```

```typescript
// src/lib/interfaces/umkm.interface.ts
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
```

### 4.3 FEW-SHOT EXAMPLE

```typescript
// src/lib/repositories/umkm.repository.ts
import prisma from "@/lib/prisma";
import { IRepository } from "@/lib/interfaces/base.interface";
import { IUmkm, ICreateUmkmDTO, IUpdateUmkmDTO, UmkmCategory } from "@/lib/interfaces/umkm.interface";

export class UmkmRepository implements IRepository<IUmkm, ICreateUmkmDTO, IUpdateUmkmDTO> {
  async findAll(): Promise<IUmkm[]> {
    return prisma.umkm.findMany({
      orderBy: { createdAt: "desc" },
    }) as Promise<IUmkm[]>;
  }

  async findActive(): Promise<IUmkm[]> {
    return prisma.umkm.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    }) as Promise<IUmkm[]>;
  }

  async findByCategory(category: UmkmCategory): Promise<IUmkm[]> {
    return prisma.umkm.findMany({
      where: { category, isActive: true },
      orderBy: { createdAt: "desc" },
    }) as Promise<IUmkm[]>;
  }

  async findById(id: string): Promise<IUmkm | null> {
    return prisma.umkm.findUnique({ where: { id } }) as Promise<IUmkm | null>;
  }

  async create(data: ICreateUmkmDTO): Promise<IUmkm> {
    return prisma.umkm.create({ data }) as Promise<IUmkm>;
  }

  async update(id: string, data: IUpdateUmkmDTO): Promise<IUmkm> {
    return prisma.umkm.update({ where: { id }, data }) as Promise<IUmkm>;
  }

  async delete(id: string): Promise<void> {
    await prisma.umkm.delete({ where: { id } });
  }
}
```

```typescript
// src/lib/services/umkm.service.ts
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
```

```typescript
// src/app/api/umkm/route.ts
import { NextRequest, NextResponse } from "next/server";
import { UmkmService } from "@/lib/services/umkm.service";
import { ApiResponse } from "@/lib/interfaces/base.interface";
import { IUmkm, UmkmCategory } from "@/lib/interfaces/umkm.interface";

const service = new UmkmService();

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<IUmkm[]>>> {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") as UmkmCategory | null;
    const activeOnly = searchParams.get("active") === "true";

    let data: IUmkm[];
    if (category) {
      data = await service.getByCategory(category);
    } else if (activeOnly) {
      data = await service.getActive();
    } else {
      data = await service.getAll();
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<IUmkm>>> {
  try {
    const body = await request.json();
    const data = await service.create(body);
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    const status = message.includes("wajib") ? 400 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
```

### 4.4 STEP-BY-STEP GENERATION INSTRUCTION

```
LANGKAH GENERASI KODE MODUL UMKM:

1. PASTIKAN schema.prisma sudah berisi model Umkm dan enum UmkmCategory.

2. BUAT `src/lib/interfaces/umkm.interface.ts`
   - IUmkm extends IBaseEntity.
   - ICreateUmkmDTO (wajib: name, description, ownerName, address, phone, category).
   - IUpdateUmkmDTO extends Partial<ICreateUmkmDTO> + { isActive?: boolean }.

3. BUAT `src/lib/repositories/umkm.repository.ts`
   - Class UmkmRepository implements IRepository<...>.
   - Extra methods: findActive(), findByCategory().

4. BUAT `src/lib/services/umkm.service.ts`
   - Class UmkmService implements IService<...>.
   - Extra methods: getActive(), getByCategory(), toggleActive().
   - Validasi create: loop requiredFields, throw jika kosong.

5. BUAT `src/app/api/umkm/route.ts` (GET + POST)
   - GET support `?category=MAKANAN` dan `?active=true`.

6. BUAT `src/app/api/umkm/[id]/route.ts` (GET + PUT + DELETE)
   - Tambah PATCH handler untuk toggleActive.
   - Pattern params: `const { id } = await params;`.

7. VALIDASI:
   - Semua 6 required fields divalidasi di Service layer.
   - isActive default true di Prisma.
   - Tidak ada `any`.
```

---
---

## MODUL 5: CRUD Profil Desa

### 5.1 SYSTEM PROMPT

```
Kamu adalah Senior TypeScript Engineer. Kamu HANYA menghasilkan kode OOP TypeScript untuk Next.js 14 App Router + Prisma ORM.

ATURAN KETAT:
- Profil Desa adalah SINGLETON — hanya ada 1 record di database.
- Ikuti pattern: Repository → Service → API Route Handler.
- Repository TIDAK perlu findAll, hanya find() (ambil satu-satunya record).
- Service method: get() dan update(). TIDAK ADA create() karena record di-seed saat setup.
- Jika belum ada record, Service.get() return default values.
- JANGAN gunakan `any`. JANGAN buat fungsi loose di luar class.
- Response selalu ApiResponse<T>.
```

### 5.2 DATA MODEL

```prisma
model ProfilDesa {
  id              String   @id @default(cuid())
  villageName     String   @default("Kelurahan Palabuhanratu")
  districtName    String   @default("Kecamatan Palabuhanratu")
  regencyName     String   @default("Kabupaten Sukabumi")
  provinceName    String   @default("Jawa Barat")
  postalCode      String   @default("")
  address         String   @default("")
  phone           String   @default("")
  email           String   @default("")
  headName        String   @default("") // Nama Lurah
  headTitle       String   @default("Lurah")
  vision          String   @db.Text @default("")
  mission         String   @db.Text @default("")
  history         String   @db.Text @default("")
  population      Int      @default(0)
  area            Float    @default(0) // Luas wilayah km²
  logoUrl         String?
  bannerUrl       String?
  mapEmbedUrl     String?  // Google Maps embed URL
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@map("profil_desa")
}
```

```typescript
// src/lib/interfaces/profil-desa.interface.ts
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
```

### 5.3 FEW-SHOT EXAMPLE

```typescript
// src/lib/repositories/profil-desa.repository.ts
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
```

```typescript
// src/lib/services/profil-desa.service.ts
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
```

```typescript
// src/app/api/profil-desa/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ProfilDesaService } from "@/lib/services/profil-desa.service";
import { ApiResponse } from "@/lib/interfaces/base.interface";
import { IProfilDesa } from "@/lib/interfaces/profil-desa.interface";

const service = new ProfilDesaService();

export async function GET(): Promise<NextResponse<ApiResponse<IProfilDesa>>> {
  try {
    const data = await service.get();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse<ApiResponse<IProfilDesa>>> {
  try {
    const body = await request.json();
    const data = await service.update(body);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
```

### 5.4 STEP-BY-STEP GENERATION INSTRUCTION

```
LANGKAH GENERASI KODE MODUL PROFIL DESA:

1. PASTIKAN schema.prisma sudah berisi model ProfilDesa.

2. BUAT `src/lib/interfaces/profil-desa.interface.ts`
   - IProfilDesa extends IBaseEntity.
   - IUpdateProfilDesaDTO — semua field optional (Partial pattern).
   - TIDAK ADA ICreateProfilDesaDTO (singleton, pakai upsert).

3. BUAT `src/lib/repositories/profil-desa.repository.ts`
   - Class ProfilDesaRepository (TIDAK implements IRepository karena singleton).
   - Methods: find() (findFirst), upsert(data).
   - upsert: jika ada record → update, jika belum → create dengan defaults.

4. BUAT `src/lib/services/profil-desa.service.ts`
   - Class ProfilDesaService (TIDAK implements IService).
   - Methods: get(), update().
   - get() return default object jika belum ada record.

5. BUAT `src/app/api/profil-desa/route.ts`
   - GET: panggil service.get().
   - PUT: panggil service.update(body).
   - TIDAK ADA POST dan DELETE (singleton).

6. VALIDASI:
   - Hanya ada 1 record di database (singleton pattern).
   - Tidak ada `any`.
   - Default values konsisten antara Prisma dan Service.
```

---
---

## COMPLETE PRISMA SCHEMA

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ===== AUTH =====
model AdminProfile {
  id         String   @id @default(cuid())
  authUserId String   @unique
  email      String   @unique
  fullName   String
  role       Role     @default(ADMIN)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@map("admin_profiles")
}

enum Role {
  SUPER_ADMIN
  ADMIN
}

// ===== PROGRAM KKN =====
model ProgramKkn {
  id          String           @id @default(cuid())
  title       String
  description String           @db.Text
  imageUrl    String?
  status      ProgramKknStatus @default(COMING_SOON)
  startDate   DateTime?
  endDate     DateTime?
  location    String?
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  @@map("program_kkn")
}

enum ProgramKknStatus {
  COMING_SOON
  COMPLETED
}

// ===== PEMETAAN MASALAH =====
model PemetaanMasalah {
  id          String           @id @default(cuid())
  name        String
  description String           @db.Text
  category    PemetaanCategory
  latitude    Float
  longitude   Float
  imageUrl    String?
  address     String?
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  @@map("pemetaan_masalah")
}

enum PemetaanCategory {
  TEMPAT_SAMPAH
  JALUR_EVAKUASI
}

// ===== UMKM =====
model Umkm {
  id          String       @id @default(cuid())
  name        String
  description String       @db.Text
  ownerName   String
  address     String
  phone       String
  category    UmkmCategory
  imageUrl    String?
  latitude    Float?
  longitude   Float?
  isActive    Boolean      @default(true)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  @@map("umkm")
}

enum UmkmCategory {
  MAKANAN
  MINUMAN
  KERAJINAN
  JASA
  LAINNYA
}

// ===== PROFIL DESA =====
model ProfilDesa {
  id           String   @id @default(cuid())
  villageName  String   @default("Kelurahan Palabuhanratu")
  districtName String   @default("Kecamatan Palabuhanratu")
  regencyName  String   @default("Kabupaten Sukabumi")
  provinceName String   @default("Jawa Barat")
  postalCode   String   @default("")
  address      String   @default("")
  phone        String   @default("")
  email        String   @default("")
  headName     String   @default("")
  headTitle    String   @default("Lurah")
  vision       String   @db.Text @default("")
  mission      String   @db.Text @default("")
  history      String   @db.Text @default("")
  population   Int      @default(0)
  area         Float    @default(0)
  logoUrl      String?
  bannerUrl    String?
  mapEmbedUrl  String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@map("profil_desa")
}
```

---
---

## USAGE GUIDE — Cara Pakai Kit Ini

### Cara Memberi Perintah ke Model Murah

**Format prompt ke model murah:**

```
[PASTE SYSTEM PROMPT MODUL X di atas]

[PASTE DATA MODEL MODUL X di atas]

[PASTE FEW-SHOT EXAMPLE MODUL X di atas]

[PASTE STEP-BY-STEP INSTRUCTION MODUL X di atas]

---

SEKARANG, buatkan kode lengkap untuk [NAMA MODUL] sesuai instruksi di atas.
Mulai dari langkah 1 sampai selesai. Output setiap file secara lengkap.
```

### Urutan Eksekusi yang Disarankan

| Urutan | Modul | Alasan |
|--------|-------|--------|
| 1 | Global Conventions + Prisma Schema | Fondasi seluruh proyek |
| 2 | Modul 1: Auth & Admin | Diperlukan oleh semua modul admin |
| 3 | Modul 5: Profil Desa | Paling sederhana (singleton), good test |
| 4 | Modul 2: Program KKN | CRUD standar, medium complexity |
| 5 | Modul 3: Pemetaan Masalah | CRUD + koordinat GPS |
| 6 | Modul 4: UMKM | CRUD paling kompleks (banyak field) |

### Tips Agar Model Murah Tidak Salah

1. **Selalu sertakan FEW-SHOT** — model murah butuh contoh konkret.
2. **Sertakan SYSTEM PROMPT** — ini membatasi model agar tidak menyimpang.
3. **Minta output per file** — jangan minta semua sekaligus, pecah per file jika context window kecil.
4. **Verifikasi import paths** — model murah sering salah import. Cek `@/lib/...` pattern.
5. **Cek `params` pattern** — Next.js 14/15 menggunakan `await params`, model murah sering lupa `await`.
