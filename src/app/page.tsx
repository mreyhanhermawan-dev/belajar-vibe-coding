import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  let villageProfile = null;
  try {
    villageProfile = await prisma.profilDesa.findFirst();
  } catch (error) {
    console.error("Database connection failed, using fallback data.");
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans selection:bg-blue-500/30">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold">V</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Desa<span className="text-blue-600">Vibe</span>
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-600 dark:text-zinc-400">
            <Link href="#profil" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Profil Desa</Link>
            <Link href="#program" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Program KKN</Link>
            <Link href="#umkm" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">UMKM</Link>
            <Link href="#peta" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Peta Masalah</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/admin"
              className="h-9 inline-flex items-center justify-center px-4 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center">
        {/* Hero Section */}
        <section className="w-full relative overflow-hidden py-24 md:py-32 flex flex-col items-center justify-center text-center px-4">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100 via-zinc-50 to-zinc-50 dark:from-blue-900/20 dark:via-zinc-950 dark:to-zinc-950"></div>
          
          <div className="inline-flex items-center rounded-full border border-blue-200/50 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-900/20 px-3 py-1 text-sm text-blue-600 dark:text-blue-400 mb-8 backdrop-blur-sm">
            <span className="flex h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400 mr-2 animate-pulse"></span>
            Sistem Informasi Terpadu
          </div>
          
          <h1 className="max-w-4xl text-5xl md:text-7xl font-bold tracking-tighter text-zinc-900 dark:text-zinc-50 mb-6 drop-shadow-sm">
            Selamat Datang di {villageProfile?.villageName || "Desa Digital"}
          </h1>
          
          <p className="max-w-2xl text-lg md:text-xl text-zinc-600 dark:text-zinc-400 mb-10 leading-relaxed">
            Platform digital inovatif untuk memantau program KKN, memberdayakan UMKM lokal, dan memetakan potensi serta permasalahan desa secara real-time.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
            <Link
              href="/#program"
              className="h-12 inline-flex items-center justify-center px-8 rounded-full bg-blue-600 text-white font-medium hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            >
              Lihat Program KKN
            </Link>
            <Link
              href="/#umkm"
              className="h-12 inline-flex items-center justify-center px-8 rounded-full bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-800 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Jelajahi UMKM
            </Link>
          </div>
        </section>

        {/* Features Grid */}
        <section className="w-full max-w-7xl mx-auto px-4 py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="group relative rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-6 text-blue-600 dark:text-blue-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-3">Profil Desa</h3>
              <p className="text-zinc-600 dark:text-zinc-400">Informasi lengkap mengenai sejarah, visi misi, dan demografi desa kami.</p>
            </div>

            {/* Feature 2 */}
            <div className="group relative rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-6 text-emerald-600 dark:text-emerald-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
              </div>
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-3">Program KKN</h3>
              <p className="text-zinc-600 dark:text-zinc-400">Pantau perkembangan dan jadwal kegiatan mahasiswa KKN di desa.</p>
            </div>

            {/* Feature 3 */}
            <div className="group relative rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-6 text-amber-600 dark:text-amber-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              </div>
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-3">Katalog UMKM</h3>
              <p className="text-zinc-600 dark:text-zinc-400">Jelajahi dan dukung berbagai produk unggulan dari UMKM lokal desa.</p>
            </div>

            {/* Feature 4 */}
            <div className="group relative rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mb-6 text-rose-600 dark:text-rose-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="m17 5-5-3-5 3"/><path d="m7 19 5 3 5-3"/></svg>
              </div>
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-3">Peta Masalah</h3>
              <p className="text-zinc-600 dark:text-zinc-400">Pemetaan lokasi infrastruktur dan titik penting untuk mitigasi bersama.</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-12">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between text-zinc-500 dark:text-zinc-400 text-sm">
          <p>© {new Date().getFullYear()} {villageProfile?.villageName || "Desa Digital"}. Hak Cipta Dilindungi.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <Link href="#" className="hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors">Bantuan</Link>
            <Link href="#" className="hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors">Privasi</Link>
            <Link href="#" className="hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors">Kontak</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
