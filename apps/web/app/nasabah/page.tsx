'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  Users,
  Search,
  Plus,
  Eye,
  CheckCircle,
  AlertCircle,
  Clock,
  Shield,
  Filter,
  X,
  UserCheck,
} from 'lucide-react'
import { api } from '@/lib/api'

type Nasabah = {
  id: string
  nama: string
  nik: string
  noRek: string
  hp: string
  email: string
  lahir: string
  alamat: string
  ibu: {
    nama: string
    lahir: string
    alamat: string
  }
  kerja: string
  gaji: number
  cicilan: number
  riwayat: 'Lancar' | 'Telat'
  slik: 'K1' | 'K2' | 'K3' | 'K4' | 'K5'
  hutangLain: number
  lembaga: number
  tunggakan: boolean
  catatan?: string
  rasio?: number
  risiko?: 'Rendah' | 'Sedang' | 'Tinggi'
}

type NasabahForm = {
  nama: string
  nik: string
  noRek: string
  hp: string
  email: string
  lahir: string
  alamat: string
  ibuNama: string
  ibuLahir: string
  ibuAlamat: string
  kerja: string
  gaji: string
  cicilan: string
  riwayat: Nasabah['riwayat']
  slik: Nasabah['slik']
  lembaga: string
  hutangLain: string
  tunggakan: 'Tidak Ada' | 'Ada Tunggakan'
  catatan: string
}

type SubmitState = {
  isSubmitting: boolean
  message: string | null
  error: string | null
}

const pekerjaanOptions = ['PNS', 'Wiraswasta', 'Karyawan Swasta', 'Freelance', 'Petani', 'Buruh', 'Lainnya']
const riwayatOptions: Nasabah['riwayat'][] = ['Lancar', 'Telat']
const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

const defaultSampleNasabah: Nasabah[] = [
  {
    id: '1',
    nama: 'Samuel Santoso',
    nik: '3174090123456789',
    noRek: 'SP-00101',
    hp: '081234567891',
    email: 'samuel@example.com',
    lahir: '1988-04-12',
    alamat: 'Jl. Merdeka No. 45, Jakarta',
    ibu: { nama: 'Siti Aminah', lahir: '1965-02-10', alamat: 'Jl. Merdeka No. 45, Jakarta' },
    kerja: 'PNS',
    gaji: 7500000,
    cicilan: 1350000,
    riwayat: 'Lancar',
    slik: 'K1',
    hutangLain: 0,
    lembaga: 0,
    tunggakan: false,
    catatan: 'Profil risiko aman',
    rasio: 18,
    risiko: 'Rendah',
  },
  {
    id: '2',
    nama: 'Dewi Permata',
    nik: '3275090123456789',
    noRek: 'SP-00102',
    hp: '081234567892',
    email: 'dewi@example.com',
    lahir: '1992-08-20',
    alamat: 'Jl. Anggrek No. 12, Bandung',
    ibu: { nama: 'Ratna Sari', lahir: '1968-11-15', alamat: 'Jl. Anggrek No. 12, Bandung' },
    kerja: 'Freelance',
    gaji: 6000000,
    cicilan: 1500000,
    riwayat: 'Lancar',
    slik: 'K1',
    hutangLain: 2000000,
    lembaga: 1,
    tunggakan: false,
    catatan: 'Riwayat pembayaran baik',
    rasio: 25,
    risiko: 'Rendah',
  },
  {
    id: '3',
    nama: 'Ahmad Fauzi',
    nik: '3374090123456789',
    noRek: 'SP-00103',
    hp: '081234567893',
    email: 'ahmad@example.com',
    lahir: '1985-12-05',
    alamat: 'Jl. Diponegoro No. 88, Semarang',
    ibu: { nama: 'Nurhayati', lahir: '1960-05-22', alamat: 'Jl. Diponegoro No. 88, Semarang' },
    kerja: 'Wiraswasta',
    gaji: 8500000,
    cicilan: 2975000,
    riwayat: 'Lancar',
    slik: 'K2',
    hutangLain: 5000000,
    lembaga: 2,
    tunggakan: false,
    catatan: 'Perlu verifikasi rekening koran',
    rasio: 35,
    risiko: 'Sedang',
  },
  {
    id: '4',
    nama: 'Budi Santoso',
    nik: '3578090123456789',
    noRek: 'SP-00104',
    hp: '081234567894',
    email: 'budi@example.com',
    lahir: '1990-03-14',
    alamat: 'Jl. Pahlawan No. 21, Surabaya',
    ibu: { nama: 'Endang Sulastri', lahir: '1966-09-08', alamat: 'Jl. Pahlawan No. 21, Surabaya' },
    kerja: 'Buruh',
    gaji: 4200000,
    cicilan: 2310000,
    riwayat: 'Telat',
    slik: 'K3',
    hutangLain: 8000000,
    lembaga: 3,
    tunggakan: true,
    catatan: 'Terdapat riwayat tunggakan di lembaga lain',
    rasio: 55,
    risiko: 'Tinggi',
  },
]

const initialForm: NasabahForm = {
  nama: '',
  nik: '',
  noRek: '',
  hp: '',
  email: '',
  lahir: '',
  alamat: '',
  ibuNama: '',
  ibuLahir: '',
  ibuAlamat: '',
  kerja: 'PNS',
  gaji: '',
  cicilan: '',
  riwayat: 'Lancar',
  slik: 'K1',
  lembaga: '0',
  hutangLain: '0',
  tunggakan: 'Tidak Ada',
  catatan: '',
}

export default function NasabahPage() {
  const [nasabahList, setNasabahList] = useState<Nasabah[]>(defaultSampleNasabah)
  const [form, setForm] = useState<NasabahForm>(initialForm)
  const [selectedNasabah, setSelectedNasabah] = useState<Nasabah | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRisiko, setFilterRisiko] = useState('Semua')
  const [submitState, setSubmitState] = useState<SubmitState>({ isSubmitting: false, message: null, error: null })
  const [isFormOpen, setIsFormOpen] = useState(false)

  const {
    nama,
    nik,
    noRek,
    hp,
    email,
    lahir,
    alamat,
    ibuNama,
    ibuLahir,
    ibuAlamat,
    kerja,
    gaji,
    cicilan,
    riwayat,
    slik,
    lembaga,
    hutangLain,
    tunggakan,
    catatan,
  } = form

  const setFormField = (field: string, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value } as NasabahForm))

  const isNikValid = nik.length === 16 && /^[0-9]+$/.test(nik)
  const isFormValid =
    nama.trim() !== '' &&
    isNikValid &&
    noRek.trim() !== '' &&
    hp.trim() !== '' &&
    email.trim() !== '' &&
    lahir !== '' &&
    alamat.trim() !== '' &&
    ibuNama.trim() !== '' &&
    ibuLahir !== '' &&
    ibuAlamat.trim() !== '' &&
    Number(gaji) > 0 &&
    Number(cicilan) >= 0

  useEffect(() => {
    const loadNasabah = async () => {
      try {
        const data = await api.getNasabah()
        if (Array.isArray(data) && data.length > 0) {
          const mappedData = data.map((item: any) => ({
            id: String(item.id ?? crypto.randomUUID()),
            nama: item.nama ?? 'Nama belum tersedia',
            nik: item.nik ?? '',
            noRek: item.noRek ?? item.rekening ?? item.noRekening ?? '-',
            hp: item.hp ?? item.noHp ?? '-',
            email: item.email ?? '-',
            lahir: item.lahir ?? item.tanggalLahir ?? '-',
            alamat: item.alamat ?? '-',
            ibu: {
              nama: item.ibu?.nama ?? item.ibuNama ?? item.namaIbu ?? '-',
              lahir: item.ibu?.lahir ?? item.ibuLahir ?? item.tanggalLahirIbu ?? '-',
              alamat: item.ibu?.alamat ?? item.ibuAlamat ?? item.alamatIbu ?? '-',
            },
            kerja: item.pekerjaan ?? item.kerja ?? 'Lainnya',
            gaji: Number(item.penghasilan ?? item.gaji ?? 0),
            cicilan: Number(item.cicilan ?? item.cicilanBulanan ?? 0),
            riwayat: item.riwayatPembayaran === 'telat' || item.riwayat === 'Telat' ? 'Telat' : 'Lancar',
            slik: item.slik ?? 'K1',
            hutangLain: Number(item.hutangLain ?? item.totalHutangLain ?? 0),
            lembaga: Number(item.lembaga ?? item.jumlahLembaga ?? 0),
            tunggakan: Boolean(item.tunggakan ?? item.adaTunggakan ?? false),
            catatan: item.catatan ?? item.keterangan ?? '',
            rasio: Number(
              item.rasio ??
                (Number(item.cicilan ?? item.cicilanBulanan ?? 0) > 0 && Number(item.penghasilan ?? item.gaji ?? 0) > 0
                  ? (Number(item.cicilan ?? item.cicilanBulanan ?? 0) / Number(item.penghasilan ?? item.gaji ?? 0)) * 100
                  : 0)
            ),
            risiko: item.risiko ?? 'Rendah',
          })) as Nasabah[]

          setNasabahList(mappedData)
        }
      } catch (error) {
        console.error('Gagal memuat data nasabah, menggunakan data lokal default', error)
      }
    }

    loadNasabah()
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isFormValid) return

    setSubmitState({ isSubmitting: true, message: null, error: null })

    const payload = {
      nama,
      nik,
      noRek,
      hp,
      email,
      lahir,
      alamat,
      ibu: { nama: ibuNama, lahir: ibuLahir, alamat: ibuAlamat },
      kerja,
      gaji: Number(gaji),
      cicilan: Number(cicilan),
      riwayat,
      slik,
      hutangLain: Number(hutangLain),
      lembaga: Number(lembaga),
      tunggakan: tunggakan === 'Ada Tunggakan',
      catatan: catatan.trim() || undefined,
    }

    try {
      const created = await api.createNasabah(payload)
      const savedId = created && typeof created === 'object' && 'id' in created ? String((created as any).id) : String(Date.now())

      const rasioVal = Number(gaji) > 0 ? (Number(cicilan) / Number(gaji)) * 100 : 0
      const isHighBi = slik === 'K3' || slik === 'K4' || slik === 'K5'
      const risikoVal = isHighBi
        ? 'Tinggi'
        : slik === 'K2'
        ? rasioVal > 30
          ? 'Tinggi'
          : 'Sedang'
        : rasioVal <= 30
        ? 'Rendah'
        : rasioVal <= 50
        ? 'Sedang'
        : 'Tinggi'

      const newNasabah: Nasabah = {
        id: savedId,
        nama: payload.nama,
        nik: payload.nik,
        noRek: payload.noRek,
        hp: payload.hp,
        email: payload.email,
        lahir: payload.lahir,
        alamat: payload.alamat,
        ibu: payload.ibu,
        kerja: payload.kerja,
        gaji: payload.gaji,
        cicilan: payload.cicilan,
        riwayat: payload.riwayat,
        slik: payload.slik,
        hutangLain: payload.hutangLain,
        lembaga: payload.lembaga,
        tunggakan: payload.tunggakan,
        catatan: payload.catatan,
        rasio: Number(rasioVal.toFixed(1)),
        risiko: risikoVal,
      }

      setNasabahList((current) => [newNasabah, ...current])
      setForm({ ...initialForm })
      setSubmitState({ isSubmitting: false, message: 'Data anggota berhasil ditambahkan!', error: null })
      setIsFormOpen(false)
    } catch (error) {
      console.error('Gagal menyimpan data nasabah', error)
      const errorMessage = error instanceof Error ? error.message : 'Gagal menyimpan data nasabah.'
      setSubmitState({ isSubmitting: false, message: null, error: errorMessage })
    }
  }

  const processedRows = useMemo(() => {
    return nasabahList.map((item) => {
      const rasio = item.gaji > 0 ? (item.cicilan / item.gaji) * 100 : 0
      const rounded = Number(rasio.toFixed(1))
      const status = item.slik
      const isHighBi = status === 'K3' || status === 'K4' || status === 'K5'
      const risiko = isHighBi
        ? 'Tinggi'
        : status === 'K2'
        ? rounded > 30
          ? 'Tinggi'
          : 'Sedang'
        : status === 'K1'
        ? rounded <= 30
          ? 'Rendah'
          : rounded <= 50
          ? 'Sedang'
          : 'Tinggi'
        : 'Tinggi'

      const biStatusLabel =
        status === 'K1'
          ? 'K1 (Lancar)'
          : status === 'K2'
          ? 'K2 (DPK)'
          : status === 'K3'
          ? 'K3 (Kurang Lancar)'
          : status === 'K4'
          ? 'K4 (Diragukan)'
          : 'K5 (Macet)'

      const biBadgeClass =
        status === 'K1'
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : status === 'K2'
          ? 'bg-amber-50 text-amber-700 border-amber-200'
          : 'bg-red-50 text-red-700 border-red-200'

      return { ...item, rasio: rounded, risiko: risiko as 'Rendah' | 'Sedang' | 'Tinggi', biStatusLabel, biBadgeClass }
    })
  }, [nasabahList])

  const filteredRows = useMemo(() => {
    return processedRows.filter((item) => {
      const matchSearch =
        item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nik.includes(searchTerm) ||
        item.noRek.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.hp.includes(searchTerm)
      const matchRisiko = filterRisiko === 'Semua' || item.risiko === filterRisiko
      return matchSearch && matchRisiko
    })
  }, [processedRows, searchTerm, filterRisiko])

  return (
    <main className="min-h-screen bg-[#f8f9fa] p-4 sm:p-6 md:p-8 lg:p-10 text-slate-900">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[0.85rem] font-medium text-slate-500">Master Data / Anggota</div>
          <h1 className="my-1 text-2xl font-bold text-[#111]">Data Anggota (Nasabah)</h1>
          <p className="m-0 text-[0.95rem] text-slate-500">
            Kelola data identitas, profil keuangan, dan riwayat kredit anggota koperasi
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-800"
          >
            <Plus className="h-4 w-4" />
            {isFormOpen ? 'Tutup Form' : 'Tambah Anggota Baru'}
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">Total Anggota</span>
            <div className="rounded-lg bg-green-50 p-2 text-green-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{nasabahList.length}</div>
          <p className="mt-1 text-xs text-slate-500">Terdaftar aktif di sistem</p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">Risiko Rendah</span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <Shield className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600">
            {processedRows.filter((r) => r.risiko === 'Rendah').length}
          </div>
          <p className="mt-1 text-xs text-slate-500">Kolektibilitas K1 Lancar</p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">Risiko Sedang</span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600">
            {processedRows.filter((r) => r.risiko === 'Sedang').length}
          </div>
          <p className="mt-1 text-xs text-slate-500">Perlu monitoring rutin</p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">Risiko Tinggi / Telat</span>
            <div className="rounded-lg bg-red-50 p-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-red-600">
            {processedRows.filter((r) => r.risiko === 'Tinggi').length}
          </div>
          <p className="mt-1 text-xs text-slate-500">Perhatian khusus penagihan</p>
        </div>
      </div>

      {/* Collapsible Form Tambah Anggota */}
      {isFormOpen && (
        <div className="mb-8 rounded-xl border border-slate-100 bg-white p-6 shadow-sm transition-all">
          <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Form Pendaftaran Anggota Baru</h2>
              <p className="text-sm text-slate-500">Lengkapi seluruh data pribadi, ibu kandung, dan data finansial nasabah.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Data Pribadi */}
            <div>
              <h3 className="mb-3 text-sm font-bold text-green-800 uppercase tracking-wide">1. Data Pribadi</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Nama Lengkap *</label>
                  <input
                    type="text"
                    value={nama}
                    onChange={(e) => setFormField('nama', e.target.value)}
                    placeholder="Contoh: Siti Rahmawati"
                    required
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-green-600 focus:ring-1 focus:ring-green-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">NIK (16 Digit) *</label>
                  <input
                    type="text"
                    maxLength={16}
                    value={nik}
                    onChange={(e) => setFormField('nik', e.target.value)}
                    placeholder="Contoh: 3174090123456789"
                    required
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-green-600 focus:ring-1 focus:ring-green-600 outline-none"
                  />
                  {!isNikValid && nik.length > 0 && (
                    <span className="text-[11px] text-red-500 mt-1 block">NIK harus 16 digit angka</span>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">No. Rekening *</label>
                  <input
                    type="text"
                    value={noRek}
                    onChange={(e) => setFormField('noRek', e.target.value)}
                    placeholder="Contoh: SP-00105"
                    required
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-green-600 focus:ring-1 focus:ring-green-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">No. Handphone *</label>
                  <input
                    type="tel"
                    value={hp}
                    onChange={(e) => setFormField('hp', e.target.value)}
                    placeholder="Contoh: 081234567890"
                    required
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-green-600 focus:ring-1 focus:ring-green-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Email *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setFormField('email', e.target.value)}
                    placeholder="Contoh: nasabah@email.com"
                    required
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-green-600 focus:ring-1 focus:ring-green-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Tanggal Lahir *</label>
                  <input
                    type="date"
                    value={lahir}
                    onChange={(e) => setFormField('lahir', e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-green-600 focus:ring-1 focus:ring-green-600 outline-none"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Alamat Lengkap *</label>
                  <textarea
                    rows={2}
                    value={alamat}
                    onChange={(e) => setFormField('alamat', e.target.value)}
                    placeholder="Alamat domisili saat ini"
                    required
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-green-600 focus:ring-1 focus:ring-green-600 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 2. Data Ibu Kandung */}
            <div className="border-t border-slate-100 pt-4">
              <h3 className="mb-3 text-sm font-bold text-green-800 uppercase tracking-wide">2. Data Ibu Kandung</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Nama Ibu Kandung *</label>
                  <input
                    type="text"
                    value={ibuNama}
                    onChange={(e) => setFormField('ibuNama', e.target.value)}
                    placeholder="Nama lengkap ibu kandung"
                    required
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-green-600 focus:ring-1 focus:ring-green-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Tanggal Lahir Ibu *</label>
                  <input
                    type="date"
                    value={ibuLahir}
                    onChange={(e) => setFormField('ibuLahir', e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-green-600 focus:ring-1 focus:ring-green-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Alamat Ibu Kandung *</label>
                  <input
                    type="text"
                    value={ibuAlamat}
                    onChange={(e) => setFormField('ibuAlamat', e.target.value)}
                    placeholder="Alamat tempat tinggal ibu"
                    required
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-green-600 focus:ring-1 focus:ring-green-600 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 3. Pekerjaan & Finansial */}
            <div className="border-t border-slate-100 pt-4">
              <h3 className="mb-3 text-sm font-bold text-green-800 uppercase tracking-wide">3. Pekerjaan & Data Finansial</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Pekerjaan</label>
                  <select
                    value={kerja}
                    onChange={(e) => setFormField('kerja', e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-green-600 focus:ring-1 focus:ring-green-600 outline-none"
                  >
                    {pekerjaanOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Penghasilan / Bln (Rp) *</label>
                  <input
                    type="number"
                    min="0"
                    step="100000"
                    value={gaji}
                    onChange={(e) => setFormField('gaji', e.target.value)}
                    placeholder="Contoh: 6000000"
                    required
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-green-600 focus:ring-1 focus:ring-green-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Cicilan / Bln (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    step="50000"
                    value={cicilan}
                    onChange={(e) => setFormField('cicilan', e.target.value)}
                    placeholder="Contoh: 1200000"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-green-600 focus:ring-1 focus:ring-green-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Riwayat Pembayaran</label>
                  <select
                    value={riwayat}
                    onChange={(e) => setFormField('riwayat', e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-green-600 focus:ring-1 focus:ring-green-600 outline-none"
                  >
                    {riwayatOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 4. BI Checking / SLIK */}
            <div className="border-t border-slate-100 pt-4">
              <h3 className="mb-3 text-sm font-bold text-green-800 uppercase tracking-wide">4. Catatan SLIK / BI Checking</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Kolektibilitas SLIK</label>
                  <select
                    value={slik}
                    onChange={(e) => setFormField('slik', e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-green-600 focus:ring-1 focus:ring-green-600 outline-none"
                  >
                    <option value="K1">K1 - Lancar</option>
                    <option value="K2">K2 - Dalam Perhatian Khusus</option>
                    <option value="K3">K3 - Kurang Lancar</option>
                    <option value="K4">K4 - Diragukan</option>
                    <option value="K5">K5 - Macet</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Hutang di Tempat Lain (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    value={hutangLain}
                    onChange={(e) => setFormField('hutangLain', e.target.value)}
                    placeholder="0"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-green-600 focus:ring-1 focus:ring-green-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Jumlah Lembaga</label>
                  <input
                    type="number"
                    min="0"
                    value={lembaga}
                    onChange={(e) => setFormField('lembaga', e.target.value)}
                    placeholder="0"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-green-600 focus:ring-1 focus:ring-green-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Status Tunggakan</label>
                  <select
                    value={tunggakan}
                    onChange={(e) => setFormField('tunggakan', e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-green-600 focus:ring-1 focus:ring-green-600 outline-none"
                  >
                    <option value="Tidak Ada">Tidak Ada Tunggakan</option>
                    <option value="Ada Tunggakan">Ada Tunggakan</option>
                  </select>
                </div>
              </div>
            </div>

            {submitState.error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{submitState.error}</div>
            )}
            {submitState.message && (
              <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{submitState.message}</div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={!isFormValid || submitState.isSubmitting}
                className="rounded-lg bg-green-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-green-800 transition disabled:opacity-50"
              >
                {submitState.isSubmitting ? 'Menyimpan...' : 'Simpan Data Anggota'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter & Search Bar */}
      <section className="mb-6 rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari berdasarkan nama, NIK, No. Rekening, atau No. HP..."
              className="w-full rounded-lg border border-slate-200 pl-9 pr-4 py-2.5 text-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase">Filter Risiko:</span>
            {['Semua', 'Rendah', 'Sedang', 'Tinggi'].map((risk) => (
              <button
                key={risk}
                type="button"
                onClick={() => setFilterRisiko(risk)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  filterRisiko === risk
                    ? 'bg-green-700 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {risk}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Table Nasabah */}
      <section className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#111]">Daftar Nasabah Anggota</h2>
          <span className="text-sm text-slate-500">Menampilkan {filteredRows.length} dari {nasabahList.length} anggota</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500 font-semibold">
                <th className="p-3">Nama Anggota</th>
                <th className="p-3">No. Rekening</th>
                <th className="p-3">No. HP</th>
                <th className="p-3">Pekerjaan</th>
                <th className="p-3">Penghasilan / Bln</th>
                <th className="p-3">Rasio Cicilan</th>
                <th className="p-3">SLIK / BI</th>
                <th className="p-3">Risiko</th>
                <th className="p-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    Tidak ditemukan data anggota yang sesuai filter/pencarian.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const risikoBadge =
                    row.risiko === 'Rendah'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : row.risiko === 'Sedang'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-red-50 text-red-700 border border-red-200'

                  return (
                    <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">{row.nama}</div>
                        <div className="text-xs text-slate-400">{row.nik}</div>
                      </td>
                      <td className="p-3 font-mono text-xs text-slate-700">{row.noRek}</td>
                      <td className="p-3 text-slate-600">{row.hp}</td>
                      <td className="p-3 text-slate-600">{row.kerja}</td>
                      <td className="p-3 font-medium text-slate-900">{currencyFormatter.format(row.gaji)}</td>
                      <td className="p-3">
                        <div className="text-xs font-semibold text-slate-700">{row.rasio}%</div>
                        <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden mt-1">
                          <div
                            className={`h-full ${
                              row.rasio <= 30 ? 'bg-emerald-500' : row.rasio <= 50 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(100, row.rasio)}%` }}
                          />
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold border ${row.biBadgeClass}`}>
                          {row.biStatusLabel}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-bold ${risikoBadge}`}>
                          {row.risiko}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedNasabah(row)}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-xs"
                        >
                          <Eye className="h-3.5 w-3.5 text-slate-500" />
                          Detail
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Detail Nasabah Modal */}
      {selectedNasabah && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 p-6 bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Detail Anggota Koperasi</h3>
                <p className="text-xs text-slate-500">ID Anggota: #{selectedNasabah.id} • {selectedNasabah.noRek}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNasabah(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Profile Card */}
              <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 border border-slate-100">
                <div>
                  <span className="text-xs text-slate-400 font-medium">Nama Lengkap</span>
                  <p className="font-bold text-slate-900">{selectedNasabah.nama}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-medium">NIK (KTP)</span>
                  <p className="font-bold text-slate-900">{selectedNasabah.nik}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-medium">No. Telepon / HP</span>
                  <p className="font-semibold text-slate-800">{selectedNasabah.hp}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-medium">Email</span>
                  <p className="font-semibold text-slate-800">{selectedNasabah.email}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-medium">Tanggal Lahir</span>
                  <p className="font-semibold text-slate-800">{selectedNasabah.lahir}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-medium">Alamat Domisili</span>
                  <p className="font-semibold text-slate-800">{selectedNasabah.alamat}</p>
                </div>
              </div>

              {/* Data Ibu Kandung */}
              <div className="rounded-xl border border-slate-100 p-4 space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Data Ibu Kandung</h4>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="text-xs text-slate-400">Nama Ibu:</span>
                    <p className="font-semibold text-slate-800">{selectedNasabah.ibu.nama}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Tanggal Lahir Ibu:</span>
                    <p className="font-semibold text-slate-800">{selectedNasabah.ibu.lahir}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Alamat Ibu:</span>
                    <p className="font-semibold text-slate-800">{selectedNasabah.ibu.alamat}</p>
                  </div>
                </div>
              </div>

              {/* Data Finansial */}
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-xl border border-slate-100 p-4">
                  <span className="text-xs text-slate-400">Pekerjaan</span>
                  <p className="text-base font-bold text-slate-900 mt-1">{selectedNasabah.kerja}</p>
                </div>
                <div className="rounded-xl border border-slate-100 p-4">
                  <span className="text-xs text-slate-400">Penghasilan / Bln</span>
                  <p className="text-base font-bold text-emerald-700 mt-1">
                    {currencyFormatter.format(selectedNasabah.gaji)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 p-4">
                  <span className="text-xs text-slate-400">Cicilan Saat Ini</span>
                  <p className="text-base font-bold text-slate-900 mt-1">
                    {currencyFormatter.format(selectedNasabah.cicilan)}
                  </p>
                </div>
              </div>

              {/* SLIK / BI Checking Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-100 p-4">
                  <span className="text-xs text-slate-400">Kolektibilitas SLIK</span>
                  <div className="mt-2">
                    <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-bold border ${selectedNasabah.biBadgeClass}`}>
                      {selectedNasabah.biStatusLabel}
                    </span>
                    <p className="text-xs text-slate-500 mt-2">
                      Total Hutang Lain: {currencyFormatter.format(selectedNasabah.hutangLain)} ({selectedNasabah.lembaga} lembaga)
                    </p>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-100 p-4">
                  <span className="text-xs text-slate-400">Tingkat Risiko Kredit</span>
                  <div className="mt-2">
                    <span
                      className={`inline-flex rounded-md px-3 py-1 text-xs font-bold ${
                        selectedNasabah.risiko === 'Rendah'
                          ? 'bg-emerald-100 text-emerald-800'
                          : selectedNasabah.risiko === 'Sedang'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      Risiko {selectedNasabah.risiko} (DSR: {selectedNasabah.rasio}%)
                    </span>
                    <p className="text-xs text-slate-500 mt-2">
                      Status Tunggakan: {selectedNasabah.tunggakan ? 'Ada Tunggakan Aktif' : 'Tidak Ada Tunggakan'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-100 bg-slate-50 p-6">
              <button
                type="button"
                onClick={() => setSelectedNasabah(null)}
                className="rounded-lg bg-green-700 px-5 py-2 text-sm font-semibold text-white hover:bg-green-800 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
