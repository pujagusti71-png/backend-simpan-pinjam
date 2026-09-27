import type { NextConfig } from "next"

const rawBackendUrl =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://simpan-pinjam-backend-production.up.railway.app'
// Pastikan selalu ada protocol https:// (Railway kadang menyimpan URL tanpa protocol)
const backendUrl = (
  rawBackendUrl.startsWith('http') ? rawBackendUrl : `https://${rawBackendUrl}`
).replace(/\/$/, '')

const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/ui"],
  async redirects() {
    return [
      { source: "/", destination: "/login", permanent: false },
    ]
  },
  async rewrites() {
    return [
      { source: "/auth/:path*", destination: `${backendUrl}/auth/:path*` },
      { source: "/nasabah/:path*", destination: `${backendUrl}/nasabah/:path*` },
      { source: "/pinjaman/:path*", destination: `${backendUrl}/pinjaman/:path*` },
      { source: "/pembayaran/:path*", destination: `${backendUrl}/pembayaran/:path*` },
      { source: "/simpanan/:path*", destination: `${backendUrl}/simpanan/:path*` },
      { source: "/analisis-pekerjaan/:path*", destination: `${backendUrl}/analisis-pekerjaan/:path*` },
      { source: "/analisis-risiko/:path*", destination: `${backendUrl}/analisis-risiko/:path*` },
      { source: "/dashboard/:path*", destination: `${backendUrl}/dashboard/:path*` },
      { source: "/risiko-nasabah/:path*", destination: `${backendUrl}/risiko-nasabah/:path*` },
      { source: "/riwayat-kredit/:path*", destination: `${backendUrl}/riwayat-kredit/:path*` },
      { source: "/peminjamaneksternal/:path*", destination: `${backendUrl}/peminjamaneksternal/:path*` },
    ]
  },
}

export default nextConfig
