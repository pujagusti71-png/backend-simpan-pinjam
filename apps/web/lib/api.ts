const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '')
const DEV_ADMIN_CREDENTIALS = { username: 'admin', password: 'admin123' }

export function getToken(): string | null {
  if (typeof window === 'undefined') return null

  try {
    return sessionStorage.getItem('sp_token')
  } catch {
    return null
  }
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return

  try {
    sessionStorage.setItem('sp_token', token)
  } catch {
    // ignore storage issues in private/incognito modes
  }

  localStorage.removeItem('sp_token')
  document.cookie = `sp_token=${token}; path=/; SameSite=Lax`
}

export function removeToken(): void {
  if (typeof window === 'undefined') return

  sessionStorage.removeItem('sp_token')
  localStorage.removeItem('sp_token')

  document.cookie = 'sp_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax'
  document.cookie = 'sp_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; domain=' + window.location.hostname
}

async function parseResponseBody(res: Response) {
  const contentType = res.headers.get('content-type') || ''
  const hasJsonBody = contentType.includes('application/json')
  return hasJsonBody ? await res.json().catch(() => null) : await res.text().catch(() => null)
}

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = getToken()
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  let res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  let responseBody = await parseResponseBody(res)

  if (res.status === 401 && endpoint !== '/auth/login' && process.env.NODE_ENV !== 'production') {
    try {
      const loginRes = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(DEV_ADMIN_CREDENTIALS),
      })

      const loginBody = await parseResponseBody(loginRes)
      const loginToken = loginBody?.token || loginBody?.access_token

      if (loginRes.ok && loginToken) {
        setToken(loginToken)
        headers.set('Authorization', `Bearer ${loginToken}`)
        res = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers,
        })
        responseBody = await parseResponseBody(res)
      }
    } catch (error) {
      console.error('Gagal melakukan auto-login untuk API lokal', error)
    }
  }

  if (!res.ok) {
    const errorMessage =
      (responseBody as any)?.message ||
      (responseBody as any)?.error ||
      `HTTP Error ${res.status}`
    throw new Error(errorMessage)
  }

  return responseBody
}

export const api = {
  // Auth
  login: (username: string, password: string) =>
    apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  // Nasabah
  getNasabah: () => apiFetch('/nasabah'),
  getNasabahById: (id: number) => apiFetch(`/nasabah/${id}`),
  createNasabah: (data: any) =>
    apiFetch('/nasabah', { method: 'POST', body: JSON.stringify(data) }),
  updateNasabah: (id: number, data: any) =>
    apiFetch(`/nasabah/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteNasabah: (id: number) => apiFetch(`/nasabah/${id}`, { method: 'DELETE' }),

  // Pinjaman
  getPinjaman: () => apiFetch('/pinjaman'),
  getPinjamanById: (id: number) => apiFetch(`/pinjaman/${id}`),
  createPinjaman: (data: any) =>
    apiFetch('/pinjaman', { method: 'POST', body: JSON.stringify(data) }),
  updatePinjaman: (id: number, data: any) =>
    apiFetch(`/pinjaman/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Pembayaran
  getPembayaran: () => apiFetch('/pembayaran'),
  getPembayaranByPinjaman: (pinjamanId: number) =>
    apiFetch(`/pembayaran/pinjaman/${pinjamanId}`),
  createPembayaran: (data: any) =>
    apiFetch('/pembayaran', { method: 'POST', body: JSON.stringify(data) }),

  // Simpanan
  getSimpanan: () => apiFetch('/simpanan'),
  getSimpananByNasabah: (nasabahId: number) =>
    apiFetch(`/simpanan/nasabah/${nasabahId}`),
  getSaldoNasabah: (nasabahId: number) =>
    apiFetch(`/simpanan/saldo/${nasabahId}`),
  getSimpananSummary: (nasabahId: number) =>
    apiFetch(`/simpanan/summary/${nasabahId}`),

  // Analisis
  getAnalisisPekerjaan: () => apiFetch('/analisis-pekerjaan'),
  getAnalisisRisiko: () => apiFetch('/analisis-risiko'),
  getAnalisisRisikoByNasabah: (nasabahId: number) =>
    apiFetch(`/analisis-risiko/nasabah/${nasabahId}`),
  recomputeAnalisisRisiko: () =>
    apiFetch('/analisis-risiko/recompute', { method: 'POST' }),
  recomputeAnalisisRisikoNasabah: (nasabahId: number) =>
    apiFetch(`/analisis-risiko/recompute/${nasabahId}`, { method: 'POST' }),

  // Riwayat Kredit (SLIK / BI-checking)
  getRiwayatKreditByNasabah: (nasabahId: number) =>
    apiFetch(`/riwayat-kredit/nasabah/${nasabahId}`),
  createRiwayatKredit: (data: any) =>
    apiFetch('/riwayat-kredit', { method: 'POST', body: JSON.stringify(data) }),

  // Pinjaman Eksternal
  getPeminjamanEksternalByNasabah: (nasabahId: number) =>
    apiFetch(`/peminjamaneksternal/nasabah/${nasabahId}`),
  createPeminjamanEksternal: (data: any) =>
    apiFetch('/peminjamaneksternal', { method: 'POST', body: JSON.stringify(data) }),

  // Risiko Nasabah (Data Analyst Engine)
  getRisikoNasabah: (nasabahId: number) => apiFetch(`/risiko-nasabah/${nasabahId}`),
  calculateRiskScore: (nasabahId: number) =>
    apiFetch(`/risiko-nasabah/calculate/${nasabahId}`, { method: 'POST' }),
  getKeputusan: (nasabahId: number) =>
    apiFetch(`/risiko-nasabah/${nasabahId}/keputusan`),
  getRasioCicilan: (nasabahId: number) =>
    apiFetch(`/risiko-nasabah/${nasabahId}/rasio-cicilan`),
  getBIChecking: (nasabahId: number) =>
    apiFetch(`/risiko-nasabah/${nasabahId}/bi-checking`),
  preLoanCheck: (data: { nasabahId: number; jumlahPinjaman: number; tenor: number; jenisBunga?: string }) =>
    apiFetch('/risiko-nasabah/pre-loan-check', { method: 'POST', body: JSON.stringify(data) }),
  getLaporanRisikoSemua: () => apiFetch('/risiko-nasabah/laporan/semua'),

  // Pinjaman Actions
  approvePinjaman: (id: number) =>
    apiFetch(`/pinjaman/${id}/approve`, { method: 'POST' }),
  rejectPinjaman: (id: number, alasan?: string) =>
    apiFetch(`/pinjaman/${id}/reject`, { method: 'POST', body: JSON.stringify({ alasan }) }),

  // Dashboard Monitoring
  getDashboardSummary: () => apiFetch('/dashboard/summary'),
  getDashboardLaporan: () => apiFetch('/dashboard/laporan'),
  getDashboardChart: () => apiFetch('/dashboard/chart'),
}
