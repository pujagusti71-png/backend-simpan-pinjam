'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  PlusCircle,
  ShieldCheck,
  Search,
  CreditCard,
  User,
  FileText,
  Clock,
  Calendar,
  CheckCircle,
  X,
} from 'lucide-react'

import { api } from '@/lib/api'
import OriginalPinjaman from '@/components/original-pinjaman'

const actionCards = [
  {
    icon: PlusCircle,
    title: 'Pengajuan Baru',
    description: 'Buat pengajuan pinjaman baru',
  },
  {
    icon: ShieldCheck,
    title: 'Analisis & Skor Risiko',
    description: 'Analisis risiko otomatis berbasis data',
    href: '/pinjaman/analisis-skor-risiko',
  },
  {
    icon: Search,
    title: 'Pre-Loan Checking',
    description: 'Cek kelayakan awal sebelum pengajuan',
    href: '/pinjaman/pre-loan-checking',
  },
  {
    icon: CreditCard,
    title: 'Pembayaran',
    description: 'Catat pembayaran cicilan nasabah',
    href: '/pinjaman/pembayaran',
  },
]

type NasabahDetail = {
  id: number
  nama: string
  nik: string
  rekening: string
  hp: string
  email: string
  lahir: string
  alamat: string
  ibu: {
    nama: string
    lahir: string
    alamat: string
  }
  pekerjaan: string
  penghasilan: number
  cicilan: number
  riwayatPembayaran: string
  rasio: number
  bi: {
    status: string
    tempat: number
    totalHutang: number
    adaTunggakan: boolean
    catatan: string
  }
  jumlah: number
  tenor: number
  bunga: string
  tujuan: string
  slik: string
  jumlahLembaga: string
  totalHutangLain: string
  adaTunggakan: string
  catatan: string
  risiko: string
  risk: string
  rekomendasi: string
}

const summaryRows = [
  {
    icon: FileText,
    label: 'Pinjaman Aktif',
    value: '125',
    iconBg: 'bg-blue-50',
    iconText: 'text-blue-600',
  },
  {
    icon: Clock,
    label: 'Telat Bayar',
    value: '28',
    iconBg: 'bg-red-50',
    iconText: 'text-red-500',
  },
  {
    icon: Calendar,
    label: 'Akan Jatuh Tempo (7 Hari)',
    value: '18',
    iconBg: 'bg-orange-50',
    iconText: 'text-orange-500',
  },
  {
    icon: CheckCircle,
    label: 'Lunas Bulan Ini',
    value: '32',
    iconBg: 'bg-emerald-50',
    iconText: 'text-emerald-500',
  },
]

export default function PinjamanPage() {
  const [selectedNasabah, setSelectedNasabah] = useState<NasabahDetail | null>(null)
  const [isPengajuanOpen, setIsPengajuanOpen] = useState(false)
  const [isAllPengajuanOpen, setIsAllPengajuanOpen] = useState(false)
  const [pengajuanForm, setPengajuanForm] = useState({
    nama: '',
    nik: '',
    noRekening: '',
    noHp: '',
    email: '',
    tanggalLahir: '',
    alamat: '',
    namaIbu: '',
    tanggalLahirIbu: '',
    alamatIbu: '',
    pekerjaan: 'PNS',
    penghasilan: '',
    cicilan: '',
    riwayat: 'Lancar',
    slik: 'K1',
    jumlahLembaga: '0',
    totalHutangLain: '0',
    adaTunggakan: 'Tidak Ada',
    catatan: '',
    jumlahPinjaman: '',
    tenor: '12',
    bunga: '',
    tujuan: '',
  })
  const [pengajuanList, setPengajuanList] = useState<NasabahDetail[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editForm, setEditForm] = useState<NasabahDetail>({} as NasabahDetail)

  useEffect(() => {
    const loadPinjaman = async () => {
      setIsLoading(true)
      setFetchError(null)

      try {
        const data = await api.getPinjaman()
        if (Array.isArray(data)) {
          const mapped = data.map((item: any, index: number) => ({
            id: item.id ?? index + 1,
            nama: item.nama ?? item.nasabah?.nama ?? '',
            nik: item.nik ?? item.nasabah?.nik ?? '',
            rekening: item.rekening ?? item.noRekening ?? '',
            hp: item.hp ?? item.noHp ?? '',
            email: item.email ?? '',
            lahir: item.lahir ?? item.tanggalLahir ?? '',
            alamat: item.alamat ?? '',
            ibu: {
              nama: item.ibu?.nama ?? item.namaIbu ?? '',
              lahir: item.ibu?.lahir ?? item.tanggalLahirIbu ?? '',
              alamat: item.ibu?.alamat ?? item.alamatIbu ?? '',
            },
            pekerjaan: item.pekerjaan ?? 'PNS',
            penghasilan: Number(item.penghasilan ?? 0),
            cicilan: Number(item.cicilan ?? 0),
            riwayatPembayaran: item.riwayatPembayaran ?? item.riwayat ?? 'Lancar',
            rasio: Number(item.rasio ?? 0),
            bi: {
              status: item.slik ?? item.bi?.status ?? 'K1',
              tempat: Number(item.jumlahLembaga ?? item.bi?.tempat ?? 0),
              totalHutang: Number(item.totalHutangLain ?? item.bi?.totalHutang ?? 0),
              adaTunggakan: Boolean(item.adaTunggakan ?? item.bi?.adaTunggakan),
              catatan: item.catatan ?? item.bi?.catatan ?? '',
            },
            jumlah: Number(item.jumlah ?? item.jumlahPinjaman ?? 0),
            tenor: Number(item.tenor ?? 12),
            bunga: item.bunga ?? '',
            tujuan: item.tujuan ?? '',
            slik: item.slik ?? item.bi?.status ?? 'K1',
            jumlahLembaga: String(item.jumlahLembaga ?? item.bi?.tempat ?? 0),
            totalHutangLain: String(item.totalHutangLain ?? item.bi?.totalHutang ?? 0),
            adaTunggakan: item.adaTunggakan ? 'Ada Tunggakan' : item.bi?.adaTunggakan ? 'Ada Tunggakan' : 'Tidak Ada',
            catatan: item.catatan ?? item.bi?.catatan ?? '',
            risiko: item.risiko ?? 'Rendah',
            risk: item.risk ?? item.risiko ?? 'Rendah',
            rekomendasi: item.rekomendasi ?? 'Approve',
          }))
          const defaultSamplePinjaman: NasabahDetail[] = [
            {
              id: 1,
              nama: 'Samuel Santoso',
              nik: '3174090123456789',
              rekening: 'SP-00101',
              hp: '081234567891',
              email: 'samuel@example.com',
              lahir: '1988-04-12',
              alamat: 'Jl. Merdeka No. 45, Jakarta',
              ibu: { nama: 'Siti Aminah', lahir: '1965-02-10', alamat: 'Jl. Merdeka No. 45, Jakarta' },
              pekerjaan: 'PNS',
              penghasilan: 7500000,
              cicilan: 1350000,
              riwayatPembayaran: 'Lancar',
              rasio: 18,
              bi: { status: 'K1', tempat: 0, totalHutang: 0, adaTunggakan: false, catatan: 'Kolektibilitas lancar' },
              jumlah: 15000000,
              tenor: 12,
              bunga: '1.2%',
              tujuan: 'Modal Usaha UMKM',
              slik: 'K1',
              jumlahLembaga: '0',
              totalHutangLain: '0',
              adaTunggakan: 'Tidak Ada',
              catatan: 'Profil risiko aman',
              risiko: 'Rendah',
              risk: 'Rendah',
              rekomendasi: 'Approve',
            },
            {
              id: 2,
              nama: 'Dewi Permata',
              nik: '3275090123456789',
              rekening: 'SP-00102',
              hp: '081234567892',
              email: 'dewi@example.com',
              lahir: '1992-08-20',
              alamat: 'Jl. Anggrek No. 12, Bandung',
              ibu: { nama: 'Ratna Sari', lahir: '1968-11-15', alamat: 'Jl. Anggrek No. 12, Bandung' },
              pekerjaan: 'Freelance',
              penghasilan: 6000000,
              cicilan: 1500000,
              riwayatPembayaran: 'Lancar',
              rasio: 25,
              bi: { status: 'K1', tempat: 1, totalHutang: 2000000, adaTunggakan: false, catatan: 'Riwayat bayar baik' },
              jumlah: 24000000,
              tenor: 18,
              bunga: '1.4%',
              tujuan: 'Pembelian Alat Usaha',
              slik: 'K1',
              jumlahLembaga: '1',
              totalHutangLain: '2000000',
              adaTunggakan: 'Tidak Ada',
              catatan: 'Riwayat bayar lancar',
              risiko: 'Sedang',
              risk: 'Sedang',
              rekomendasi: 'Approve',
            },
            {
              id: 3,
              nama: 'Rian Setiawan',
              nik: '3376090123456789',
              rekening: 'SP-00103',
              hp: '081234567893',
              email: 'rian@example.com',
              lahir: '1985-01-30',
              alamat: 'Desa Sukamaju RT 02/03',
              ibu: { nama: 'Sumarni', lahir: '1962-09-08', alamat: 'Desa Sukamaju RT 02/03' },
              pekerjaan: 'Petani',
              penghasilan: 4000000,
              cicilan: 1800000,
              riwayatPembayaran: 'Telat',
              rasio: 45,
              bi: { status: 'K2', tempat: 2, totalHutang: 5000000, adaTunggakan: true, catatan: 'Pernah telat 15 hari' },
              jumlah: 18000000,
              tenor: 12,
              bunga: '1.1%',
              tujuan: 'Pengadaan Pupuk Pertanian',
              slik: 'K2',
              jumlahLembaga: '2',
              totalHutangLain: '5000000',
              adaTunggakan: 'Ada Tunggakan',
              catatan: 'Perlu jaminan tambahan',
              risiko: 'Tinggi',
              risk: 'Tinggi',
              rekomendasi: 'Review',
            },
            {
              id: 4,
              nama: 'Nina Rahma',
              nik: '3477090123456790',
              rekening: 'SP-00104',
              hp: '081234567894',
              email: 'nina@example.com',
              lahir: '1990-12-05',
              alamat: 'Jl. Melati No. 88, Surabaya',
              ibu: { nama: 'Endang', lahir: '1967-05-22', alamat: 'Jl. Melati No. 88, Surabaya' },
              pekerjaan: 'Karyawan Swasta',
              penghasilan: 8200000,
              cicilan: 1600000,
              riwayatPembayaran: 'Lancar',
              rasio: 20,
              bi: { status: 'K1', tempat: 0, totalHutang: 0, adaTunggakan: false, catatan: 'Kolektibilitas lancar' },
              jumlah: 32000000,
              tenor: 24,
              bunga: '1.3%',
              tujuan: 'Renovasi Rumah',
              slik: 'K1',
              jumlahLembaga: '0',
              totalHutangLain: '0',
              adaTunggakan: 'Tidak Ada',
              catatan: 'Kemampuan bayar tinggi',
              risiko: 'Rendah',
              risk: 'Rendah',
              rekomendasi: 'Approve',
            },
          ]
          setPengajuanList(mapped.length > 0 ? mapped : defaultSamplePinjaman)
        } else {
          setPengajuanList([])
        }
      } catch (error) {
        console.error('Gagal memuat data pinjaman', error)
        setFetchError(error instanceof Error ? error.message : 'Gagal memuat data pinjaman')
      } finally {
        setIsLoading(false)
      }
    }

    loadPinjaman()
  }, [])

  const openModal = (row: NasabahDetail) => {
    setSelectedNasabah(row)
  }

  const closeModal = () => {
    setSelectedNasabah(null)
  }

  const openEditModal = () => {
    if (!selectedNasabah) return
    setEditForm({ ...selectedNasabah })
    setSelectedNasabah(null)
    setIsEditOpen(true)
  }

  const closeEditModal = () => {
    setIsEditOpen(false)
    setEditForm({} as NasabahDetail)
  }

  const openPengajuanModal = () => {
    setIsPengajuanOpen(true)
  }

  const openAllPengajuanModal = () => {
    setIsAllPengajuanOpen(true)
  }

  const closeAllPengajuanModal = () => {
    setIsAllPengajuanOpen(false)
  }

  const showComingSoon = (feature: string) => {
    alert(`Fitur ${feature} akan segera tersedia`)
  }

  const showSummaryInfo = (label: string) => {
    const messages: Record<string, string> = {
      'Pinjaman Aktif': '125 pinjaman aktif saat ini',
      'Telat Bayar': '28 nasabah telat bayar bulan ini',
      'Akan Jatuh Tempo (7 Hari)': '18 pinjaman akan jatuh tempo dalam 7 hari',
      'Lunas Bulan Ini': '32 pinjaman lunas bulan ini',
    }
    alert(messages[label] ?? label)
  }

  const handleCreatePengajuan = async () => {
    const penghasilan = Number(pengajuanForm.penghasilan)
    const cicilan = Number(pengajuanForm.cicilan)
    const jumlahPinjaman = Number(pengajuanForm.jumlahPinjaman)
    const rasio = penghasilan > 0 ? (cicilan / penghasilan) * 100 : 0
    let calculatedRisk = 'Rendah'

    if (['K3', 'K4', 'K5'].includes(pengajuanForm.slik)) {
      calculatedRisk = 'Tinggi'
    } else if (pengajuanForm.slik === 'K2') {
      calculatedRisk = rasio > 30 ? 'Tinggi' : 'Sedang'
    } else if (pengajuanForm.slik === 'K1') {
      calculatedRisk = rasio <= 30 ? 'Rendah' : rasio <= 50 ? 'Sedang' : 'Tinggi'
    }

    const recommendation = calculatedRisk === 'Rendah' ? 'Approve' : calculatedRisk === 'Sedang' ? 'Review' : 'Reject'

    const payload = {
      nama: pengajuanForm.nama,
      nik: pengajuanForm.nik,
      email: pengajuanForm.email,
      penghasilan,
      cicilan,
      jumlah: jumlahPinjaman,
      tenor: Number(pengajuanForm.tenor || 0),
      bunga: Number(pengajuanForm.bunga || 0),
      tujuan: pengajuanForm.tujuan,
      risiko: calculatedRisk,
      rekomendasi: recommendation,
      jumlahPinjaman: jumlahPinjaman,
      tenorBulan: Number(pengajuanForm.tenor || 0),
      sukuBunga: Number(pengajuanForm.bunga || 0),
      jenisBunga: 'efektif',
    }

    try {
      const created = await api.createPinjaman(payload)
      const saved = created && typeof created === 'object' ? created : null
      const newSubmission: NasabahDetail = {
        id: Number(saved?.id ?? Date.now()),
        nama: pengajuanForm.nama,
        nik: pengajuanForm.nik,
        rekening: pengajuanForm.noRekening,
        hp: pengajuanForm.noHp,
        email: pengajuanForm.email,
        lahir: pengajuanForm.tanggalLahir,
        alamat: pengajuanForm.alamat,
        ibu: {
          nama: pengajuanForm.namaIbu,
          lahir: pengajuanForm.tanggalLahirIbu,
          alamat: pengajuanForm.alamatIbu,
        },
        pekerjaan: pengajuanForm.pekerjaan,
        penghasilan,
        cicilan,
        riwayatPembayaran: pengajuanForm.riwayat,
        rasio: Number(rasio.toFixed(1)),
        bi: {
          status: pengajuanForm.slik,
          tempat: Number(pengajuanForm.jumlahLembaga),
          totalHutang: Number(pengajuanForm.totalHutangLain),
          adaTunggakan: pengajuanForm.adaTunggakan === 'Ada Tunggakan',
          catatan: pengajuanForm.catatan,
        },
        jumlah: jumlahPinjaman,
        tenor: Number(pengajuanForm.tenor),
        bunga: pengajuanForm.bunga,
        tujuan: pengajuanForm.tujuan,
        slik: pengajuanForm.slik,
        jumlahLembaga: pengajuanForm.jumlahLembaga,
        totalHutangLain: pengajuanForm.totalHutangLain,
        adaTunggakan: pengajuanForm.adaTunggakan,
        catatan: pengajuanForm.catatan,
        risiko: calculatedRisk,
        risk: calculatedRisk,
        rekomendasi: recommendation,
      }

      setPengajuanList((current) => [newSubmission, ...current])
      setPengajuanForm({
        nama: '',
        nik: '',
        noRekening: '',
        noHp: '',
        email: '',
        tanggalLahir: '',
        alamat: '',
        namaIbu: '',
        tanggalLahirIbu: '',
        alamatIbu: '',
        pekerjaan: 'PNS',
        penghasilan: '',
        cicilan: '',
        riwayat: 'Lancar',
        slik: 'K1',
        jumlahLembaga: '0',
        totalHutangLain: '0',
        adaTunggakan: 'Tidak Ada',
        catatan: '',
        jumlahPinjaman: '',
        tenor: '12',
        bunga: '',
        tujuan: '',
      })
      setIsPengajuanOpen(false)
      alert('Pengajuan berhasil ditambahkan!')
    } catch (error) {
      console.error('Gagal menambahkan pengajuan', error)
      alert(error instanceof Error ? error.message : 'Gagal menambahkan pengajuan.')
    }
  }

  const handleUpdatePengajuan = async () => {
    if (!editForm) return

    const penghasilan = Number(editForm.penghasilan)
    const cicilan = Number(editForm.cicilan)
    const newRasio = penghasilan > 0 ? Number(((cicilan / penghasilan) * 100).toFixed(1)) : 0
    let calculatedRisk = 'Rendah'


    if (['K3', 'K4', 'K5'].includes(editForm.slik)) {
      calculatedRisk = 'Tinggi'
    } else if (editForm.slik === 'K2') {
      calculatedRisk = newRasio > 30 ? 'Tinggi' : 'Sedang'
    } else if (editForm.slik === 'K1') {
      calculatedRisk = newRasio <= 30 ? 'Rendah' : newRasio <= 50 ? 'Sedang' : 'Tinggi'
    }

    const recommendation = calculatedRisk === 'Rendah' ? 'Approve' : calculatedRisk === 'Sedang' ? 'Review' : 'Reject'

    const jumlahPinjaman = Number(editForm.jumlah)
    const tenor = Number(editForm.tenor)
    const sukuBunga = Number(editForm.bunga || 0)

    if (isNaN(jumlahPinjaman) || jumlahPinjaman <= 0) {
      alert('Jumlah pinjaman tidak valid.')
      return
    }

    if (isNaN(tenor) || tenor <= 0) {
      alert('Tenor tidak valid.')
      return
    }

    if (isNaN(sukuBunga) || sukuBunga < 0) {
      alert('Suku bunga tidak valid.')
      return
    }

    const monthlyRate = sukuBunga / 100 / 12
    const cicilanBulanan = tenor > 0
      ? (jumlahPinjaman * monthlyRate * Math.pow(1 + monthlyRate, tenor)) /
      (Math.pow(1 + monthlyRate, tenor) - 1)
      : 0
    const totalBunga = Math.round((cicilanBulanan * tenor - jumlahPinjaman) * 100) / 100
    const totalPembayaran = Math.round((jumlahPinjaman + totalBunga) * 100) / 100

    const payload = {
      jumlahPinjaman,
      tenor,
      sukuBunga,
      cicilanBulanan: Math.round(cicilanBulanan * 100) / 100,
      totalBunga,
      totalPembayaran,
    }

    try {
      await api.updatePinjaman(Number(editForm.id), payload)
      setPengajuanList((prev) =>
        prev.map((item) =>
          item.id === editForm.id
            ? {
              ...item,
              jumlah: jumlahPinjaman,
              tenor,
              bunga: String(sukuBunga),
              cicilan: Number(editForm.cicilan),
              rasio: newRasio,
              risiko: calculatedRisk,
              rekomendasi: recommendation,
            }
            : item
        )
      )
      setIsEditOpen(false)
      setEditForm({} as NasabahDetail)
      alert('Data berhasil diperbarui!')
    } catch (error) {
      console.error('Gagal memperbarui pengajuan', error)
      alert(error instanceof Error ? error.message : 'Gagal memperbarui pengajuan.')
    }
  }

  const renderRiskBadge = (risk: string) => {
    const base = 'rounded-full px-2.5 py-0.5 text-xs font-semibold'
    if (risk === 'Rendah') return `${base} bg-green-50 text-green-600`
    if (risk === 'Sedang') return `${base} bg-yellow-50 text-yellow-600`
    return `${base} bg-red-50 text-red-600`
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(value)

  const biStatusMap: Record<
    string,
    { label: string; className: string }
  > = {
    K1: { label: 'Lancar', className: 'bg-emerald-50 text-emerald-600' },
    K2: { label: 'Perlu Diperhatikan', className: 'bg-yellow-50 text-yellow-600' },
    K3: { label: 'Mulai Bermasalah', className: 'bg-orange-50 text-orange-600' },
    K4: { label: 'Bermasalah', className: 'bg-red-50 text-red-600' },
    K5: { label: 'Macet Total', className: 'bg-rose-950 text-white' },
  }

  const renderPaymentBadge = (status: string) => {
    const base = 'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold'
    if (status === 'Lancar') return `${base} bg-emerald-50 text-emerald-600`
    return `${base} bg-red-50 text-red-600`
  }

  const formatTenor = (tenor: string | number) =>
    typeof tenor === 'number'
      ? `${tenor} bulan`
      : tenor.includes('bulan')
        ? tenor
        : `${tenor} bulan`

  const getRatioColor = (ratio: number) => {
    if (ratio <= 30) return 'bg-emerald-500'
    if (ratio <= 50) return 'bg-yellow-400'
    return 'bg-red-500'
  }

  return (
    <>
      <OriginalPinjaman
        rows={pengajuanList.map((row) => ({
          id: row.id,
          nama: row.nama,
          pekerjaan: row.pekerjaan,
          jumlah: row.jumlah,
          tenor: row.tenor,
          risiko: row.risiko,
          rekomendasi: row.rekomendasi,
        }))}
        onNew={openPengajuanModal}
        onSelect={(id) => {
          const row = pengajuanList.find((item) => item.id === id)
          if (row) openModal(row)
        }}
        isNewOpen={isPengajuanOpen}
        form={pengajuanForm}
        onFormChange={(key, value) => setPengajuanForm((current) => ({ ...current, [key]: value }))}
        onSubmit={handleCreatePengajuan}
        onCancel={() => setIsPengajuanOpen(false)}
      />
    </>
  )

  const nasabahInfo = selectedNasabah!

  return (
    <div className="min-h-screen bg-[#f8f9fa] px-10 py-10 text-slate-900">
      <div className="space-y-8">
        <header className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Pinjaman</h2>
          <p className="mt-2 text-slate-500">Kelola pengajuan, analisis risiko, dan pembayaran pinjaman</p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {actionCards.map((card) => {
            const Icon = card.icon
            return (
              <div key={card.title}>
                {card.href ? (
                  <Link
                    href={card.href}
                    className="group flex items-start space-x-4 rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-slate-900">{card.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{card.description}</p>
                    </div>
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={openPengajuanModal}
                    className="group flex items-start space-x-4 rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-slate-900">{card.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{card.description}</p>
                    </div>
                  </button>
                )}
              </div>
            )
          })}
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-lg font-bold text-slate-900">Pengajuan Terbaru</h3>
              <button
                type="button"
                onClick={() => pengajuanList[0] && openModal(pengajuanList[0])}
                disabled={pengajuanList.length === 0}
                className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <User className="h-4 w-4" />
                Data Nasabah
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm text-slate-700">
                <thead>
                  <tr>
                    <th className="border-b border-slate-100 px-3 py-3 text-xs uppercase tracking-wide text-slate-400">Nama Nasabah</th>
                    <th className="border-b border-slate-100 px-3 py-3 text-xs uppercase tracking-wide text-slate-400">Jumlah Pinjaman</th>
                    <th className="border-b border-slate-100 px-3 py-3 text-xs uppercase tracking-wide text-slate-400">Tenor</th>
                    <th className="border-b border-slate-100 px-3 py-3 text-xs uppercase tracking-wide text-slate-400">Status Risk</th>
                    <th className="border-b border-slate-100 px-3 py-3 text-xs uppercase tracking-wide text-slate-400">Rekomendasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pengajuanList.length === 0 && !isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-4 text-center text-slate-500">
                        {fetchError ? fetchError : 'Tidak ada data pinjaman.'}
                      </td>
                    </tr>
                  ) : (
                    pengajuanList.map((row, index) => {
                      const rekomendasiColor = row.rekomendasi === 'Approve'
                        ? 'text-blue-600'
                        : row.rekomendasi === 'Review'
                          ? 'text-slate-500'
                          : 'text-red-600'
                      return (
                        <tr
                          key={`${row.id}-${row.nik}-${index}`}
                          className="cursor-pointer transition hover:bg-slate-50"
                          onClick={() => openModal(row)}
                        >
                          <td className="px-3 py-4 font-medium text-slate-900">{row.nama}</td>
                          <td className="px-3 py-4">{formatCurrency(row.jumlah)}</td>
                          <td className="px-3 py-4">{row.tenor}</td>
                          <td className="px-3 py-4">
                            <span className={renderRiskBadge(row.risiko)}>{row.risiko}</span>
                          </td>
                          <td className={`px-3 py-4 font-semibold ${rekomendasiColor}`}>{row.rekomendasi}</td>
                        </tr>
                      )
                    }))}
                </tbody>
              </table>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={openAllPengajuanModal}
                className="text-sm font-semibold text-blue-600 transition hover:text-blue-800"
              >
                Lihat semua pengajuan →
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
            <h3 className="mb-6 text-lg font-bold text-slate-900">Ringkasan Pinjaman</h3>
            <div className="space-y-3">
              {summaryRows.map((row) => {
                const Icon = row.icon
                return (
                  <button
                    key={row.label}
                    type="button"
                    onClick={() => showSummaryInfo(row.label)}
                    className="flex w-full items-center justify-between rounded-lg p-3 transition hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${row.iconBg} ${row.iconText}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-sm font-medium text-slate-700">{row.label}</span>
                    </div>
                    <span className="font-bold text-slate-900">{row.value}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </section>
      </div>

      {selectedNasabah ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4 py-10 animate-fade-in">
          <div className="w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-xl bg-white shadow-xl animate-zoom-in">
            <div className="max-h-[85vh] overflow-y-auto">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white p-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Detail Data Nasabah</h2>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-8 p-6">
                <section>
                  <div className="mb-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-teal-600">Data Pribadi</p>
                    <div className="mt-3 h-px bg-slate-200" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-400 uppercase mb-1">Nama Lengkap</p>
                      <p className="text-sm font-semibold text-slate-900">{nasabahInfo.nama}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase mb-1">NIK</p>
                      <p className="text-sm font-semibold text-slate-900">{nasabahInfo.nik}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase mb-1">No. Rekening</p>
                      <p className="text-sm font-semibold text-slate-900">{nasabahInfo.rekening}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase mb-1">No. HP</p>
                      <p className="text-sm font-semibold text-slate-900">{nasabahInfo.hp}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase mb-1">Email</p>
                      <p className="text-sm font-semibold text-slate-900">{nasabahInfo.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase mb-1">Tanggal Lahir</p>
                      <p className="text-sm font-semibold text-slate-900">{nasabahInfo.lahir}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-slate-400 uppercase mb-1">Alamat</p>
                      <p className="text-sm font-semibold text-slate-900">{nasabahInfo.alamat}</p>
                    </div>
                  </div>
                </section>

                <section>
                  <div className="mb-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-teal-600">Data Ibu Kandung</p>
                    <div className="mt-3 h-px bg-slate-200" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-400 uppercase mb-1">Nama Ibu Kandung</p>
                      <p className="text-sm font-semibold text-slate-900">{nasabahInfo.ibu.nama}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase mb-1">Tanggal Lahir Ibu Kandung</p>
                      <p className="text-sm font-semibold text-slate-900">{nasabahInfo.ibu.lahir}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-slate-400 uppercase mb-1">Alamat Ibu Kandung</p>
                      <p className="text-sm font-semibold text-slate-900">{nasabahInfo.ibu.alamat}</p>
                    </div>
                  </div>
                </section>

                <section>
                  <div className="mb-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-teal-600">Data Pekerjaan & Keuangan</p>
                    <div className="mt-3 h-px bg-slate-200" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-400 uppercase mb-1">Pekerjaan</p>
                      <p className="text-sm font-semibold text-slate-900">{nasabahInfo.pekerjaan}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase mb-1">Penghasilan per Bulan</p>
                      <p className="text-sm font-semibold text-slate-900">{formatCurrency(nasabahInfo.penghasilan)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase mb-1">Cicilan per Bulan</p>
                      <p className="text-sm font-semibold text-slate-900">{formatCurrency(nasabahInfo.cicilan)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase mb-1">Riwayat Pembayaran</p>
                      <span className={renderPaymentBadge(nasabahInfo.riwayatPembayaran)}>{nasabahInfo.riwayatPembayaran}</span>
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-400 uppercase mb-1">Rasio Cicilan</p>
                        <p className="text-xs font-semibold text-slate-500">{nasabahInfo.rasio}%</p>
                      </div>
                      <div className="mt-2 rounded-full bg-slate-200 h-3 overflow-hidden">
                        <div
                          className={`${getRatioColor(nasabahInfo.rasio)} h-3 rounded-full`}
                          style={{ width: `${nasabahInfo.rasio}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl bg-slate-50 p-4">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-teal-600">BI Checking</p>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${biStatusMap[nasabahInfo.bi.status]?.className ?? 'bg-slate-200 text-slate-700'}`}>
                      {biStatusMap[nasabahInfo.bi.status]?.label ?? 'Unknown'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-400 uppercase mb-1">Hutang di berapa tempat</p>
                      <p className="text-sm font-semibold text-slate-900">{nasabahInfo.bi.tempat}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase mb-1">Total hutang di tempat lain</p>
                      <p className="text-sm font-semibold text-slate-900">{formatCurrency(nasabahInfo.bi.totalHutang)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase mb-1">Ada tunggakan di tempat lain</p>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${nasabahInfo.bi.adaTunggakan ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {nasabahInfo.bi.adaTunggakan ? 'Ya' : 'Tidak'}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-slate-400 uppercase mb-1">Catatan tambahan</p>
                      <p className={`text-sm ${nasabahInfo.bi.catatan ? 'font-semibold text-slate-900 italic text-slate-500' : 'text-slate-400'}`}>
                        {nasabahInfo.bi.catatan || 'Tidak ada catatan'}
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 text-xs text-slate-400">
                    BI Checking itu catatan hutang nasabah di tempat lain. K1 paling bagus, K5 paling buruk.
                  </p>
                </section>
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50 p-6 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={openEditModal}
                  className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
                >
                  Edit Data
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isPengajuanOpen ? (
        <div className="fixed inset-0 z-[100] isolate flex items-center justify-center bg-slate-900/50 px-4 py-10 backdrop-blur-sm animate-fade-in">
          <div className="relative z-[101] w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-xl animate-zoom-in">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white p-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Pengajuan Pinjaman Baru</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsPengajuanOpen(false)}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[75vh] overflow-y-auto p-6">
              <section className="mb-6">
                <div className="mb-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-teal-600">Data Pribadi</p>
                  <div className="mt-3 h-px bg-slate-200" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 uppercase mb-1 block" htmlFor="pengajuan-nama">
                      Nama Lengkap
                    </label>
                    <input
                      id="pengajuan-nama"
                      type="text"
                      value={pengajuanForm.nama}
                      onChange={(event) => setPengajuanForm({ ...pengajuanForm, nama: event.target.value })}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase mb-1 block" htmlFor="pengajuan-nik">
                      NIK (16 digit)
                    </label>
                    <input
                      id="pengajuan-nik"
                      type="text"
                      maxLength={16}
                      value={pengajuanForm.nik}
                      onChange={(event) => setPengajuanForm({ ...pengajuanForm, nik: event.target.value })}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase mb-1 block" htmlFor="pengajuan-rekening">
                      No. Rekening
                    </label>
                    <input
                      id="pengajuan-rekening"
                      type="text"
                      value={pengajuanForm.noRekening}
                      onChange={(event) => setPengajuanForm({ ...pengajuanForm, noRekening: event.target.value })}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase mb-1 block" htmlFor="pengajuan-hp">
                      No. HP
                    </label>
                    <input
                      id="pengajuan-hp"
                      type="text"
                      value={pengajuanForm.noHp}
                      onChange={(event) => setPengajuanForm({ ...pengajuanForm, noHp: event.target.value })}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase mb-1 block" htmlFor="pengajuan-email">
                      Email
                    </label>
                    <input
                      id="pengajuan-email"
                      type="email"
                      value={pengajuanForm.email}
                      onChange={(event) => setPengajuanForm({ ...pengajuanForm, email: event.target.value })}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase mb-1 block" htmlFor="pengajuan-lahir">
                      Tanggal Lahir
                    </label>
                    <input
                      id="pengajuan-lahir"
                      type="text"
                      value={pengajuanForm.tanggalLahir}
                      onChange={(event) => setPengajuanForm({ ...pengajuanForm, tanggalLahir: event.target.value })}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-slate-400 uppercase mb-1 block" htmlFor="pengajuan-alamat">
                      Alamat
                    </label>
                    <textarea
                      id="pengajuan-alamat"
                      rows={3}
                      value={pengajuanForm.alamat}
                      onChange={(event) => setPengajuanForm({ ...pengajuanForm, alamat: event.target.value })}
                      className="w-full resize-none border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </section>

              <section className="mb-6">
                <div className="mb-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-teal-600">Data Ibu Kandung</p>
                  <div className="mt-3 h-px bg-slate-200" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 uppercase mb-1 block" htmlFor="pengajuan-namaibu">
                      Nama Ibu Kandung
                    </label>
                    <input
                      id="pengajuan-namaibu"
                      type="text"
                      value={pengajuanForm.namaIbu}
                      onChange={(event) => setPengajuanForm({ ...pengajuanForm, namaIbu: event.target.value })}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase mb-1 block" htmlFor="pengajuan-lahiribu">
                      Tanggal Lahir Ibu Kandung
                    </label>
                    <input
                      id="pengajuan-lahiribu"
                      type="text"
                      value={pengajuanForm.tanggalLahirIbu}
                      onChange={(event) => setPengajuanForm({ ...pengajuanForm, tanggalLahirIbu: event.target.value })}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-slate-400 uppercase mb-1 block" htmlFor="pengajuan-alamatibu">
                      Alamat Ibu Kandung
                    </label>
                    <textarea
                      id="pengajuan-alamatibu"
                      rows={3}
                      value={pengajuanForm.alamatIbu}
                      onChange={(event) => setPengajuanForm({ ...pengajuanForm, alamatIbu: event.target.value })}
                      className="w-full resize-none border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </section>

              <section className="mb-6">
                <div className="mb-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-teal-600">Data Pekerjaan & Keuangan</p>
                  <div className="mt-3 h-px bg-slate-200" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 uppercase mb-1 block" htmlFor="pengajuan-pekerjaan">
                      Pekerjaan
                    </label>
                    <select
                      id="pengajuan-pekerjaan"
                      value={pengajuanForm.pekerjaan}
                      onChange={(event) => setPengajuanForm({ ...pengajuanForm, pekerjaan: event.target.value })}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="PNS">PNS</option>
                      <option value="Wiraswasta">Wiraswasta</option>
                      <option value="Freelance">Freelance</option>
                      <option value="Petani">Petani</option>
                      <option value="Buruh">Buruh</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase mb-1 block" htmlFor="pengajuan-penghasilan">
                      Penghasilan per Bulan
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-slate-500">Rp</span>
                      <input
                        id="pengajuan-penghasilan"
                        type="number"
                        value={pengajuanForm.penghasilan}
                        onChange={(event) => setPengajuanForm({ ...pengajuanForm, penghasilan: event.target.value })}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase mb-1 block" htmlFor="pengajuan-cicilan">
                      Cicilan per Bulan
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-slate-500">Rp</span>
                      <input
                        id="pengajuan-cicilan"
                        type="number"
                        value={pengajuanForm.cicilan}
                        onChange={(event) => setPengajuanForm({ ...pengajuanForm, cicilan: event.target.value })}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase mb-1 block" htmlFor="pengajuan-riwayat">
                      Riwayat Pembayaran
                    </label>
                    <select
                      id="pengajuan-riwayat"
                      value={pengajuanForm.riwayat}
                      onChange={(event) => setPengajuanForm({ ...pengajuanForm, riwayat: event.target.value })}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="Lancar">Lancar</option>
                      <option value="Telat">Telat</option>
                    </select>
                  </div>
                </div>
              </section>

              <section className="mb-6 rounded-lg bg-slate-50 p-4">
                <div className="mb-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-teal-600">BI Checking</p>
                  <div className="mt-3 h-px bg-slate-200" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 uppercase mb-1 block" htmlFor="pengajuan-slik">
                      Status SLIK
                    </label>
                    <select
                      id="pengajuan-slik"
                      value={pengajuanForm.slik}
                      onChange={(event) => setPengajuanForm({ ...pengajuanForm, slik: event.target.value })}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="K1">K1 Lancar</option>
                      <option value="K2">K2 Perlu Diperhatikan</option>
                      <option value="K3">K3 Mulai Bermasalah</option>
                      <option value="K4">K4 Bermasalah</option>
                      <option value="K5">K5 Macet Total</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase mb-1 block" htmlFor="pengajuan-jumlahlembaga">
                      Hutang di Berapa Tempat
                    </label>
                    <input
                      id="pengajuan-jumlahlembaga"
                      type="number"
                      value={pengajuanForm.jumlahLembaga}
                      onChange={(event) => setPengajuanForm({ ...pengajuanForm, jumlahLembaga: event.target.value })}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase mb-1 block" htmlFor="pengajuan-totalhutang">
                      Total Hutang di Tempat Lain
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-slate-500">Rp</span>
                      <input
                        id="pengajuan-totalhutang"
                        type="number"
                        value={pengajuanForm.totalHutangLain}
                        onChange={(event) => setPengajuanForm({ ...pengajuanForm, totalHutangLain: event.target.value })}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase mb-1 block" htmlFor="pengajuan-adatunggakan">
                      Ada Tunggakan di Tempat Lain
                    </label>
                    <select
                      id="pengajuan-adatunggakan"
                      value={pengajuanForm.adaTunggakan}
                      onChange={(event) => setPengajuanForm({ ...pengajuanForm, adaTunggakan: event.target.value })}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="Tidak Ada">Tidak Ada</option>
                      <option value="Ada Tunggakan">Ada Tunggakan</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-slate-400 uppercase mb-1 block" htmlFor="pengajuan-catatan">
                      Catatan
                    </label>
                    <textarea
                      id="pengajuan-catatan"
                      rows={3}
                      value={pengajuanForm.catatan}
                      onChange={(event) => setPengajuanForm({ ...pengajuanForm, catatan: event.target.value })}
                      className="w-full resize-none border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </section>

              <section className="mb-6">
                <div className="mb-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-teal-600">Data Pinjaman</p>
                  <div className="mt-3 h-px bg-slate-200" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 uppercase mb-1 block" htmlFor="pengajuan-jumlahpinjaman">
                      Jumlah Pinjaman
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-slate-500">Rp</span>
                      <input
                        id="pengajuan-jumlahpinjaman"
                        type="number"
                        value={pengajuanForm.jumlahPinjaman}
                        onChange={(event) => setPengajuanForm({ ...pengajuanForm, jumlahPinjaman: event.target.value })}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase mb-1 block" htmlFor="pengajuan-tenor">
                      Tenor
                    </label>
                    <select
                      id="pengajuan-tenor"
                      value={pengajuanForm.tenor}
                      onChange={(event) => setPengajuanForm({ ...pengajuanForm, tenor: event.target.value })}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="6">6 bulan</option>
                      <option value="12">12 bulan</option>
                      <option value="18">18 bulan</option>
                      <option value="24">24 bulan</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase mb-1 block" htmlFor="pengajuan-bunga">
                      Bunga per Tahun %
                    </label>
                    <input
                      id="pengajuan-bunga"
                      type="number"
                      value={pengajuanForm.bunga}
                      onChange={(event) => setPengajuanForm({ ...pengajuanForm, bunga: event.target.value })}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-slate-400 uppercase mb-1 block" htmlFor="pengajuan-tujuan">
                      Tujuan Pinjaman
                    </label>
                    <textarea
                      id="pengajuan-tujuan"
                      rows={3}
                      value={pengajuanForm.tujuan}
                      onChange={(event) => setPengajuanForm({ ...pengajuanForm, tujuan: event.target.value })}
                      className="w-full resize-none border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </section>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 p-6">
              <button
                type="button"
                onClick={() => setIsPengajuanOpen(false)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleCreatePengajuan}
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
              >
                Ajukan Pinjaman
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isEditOpen && editForm ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4 py-10 animate-fade-in">
          <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-xl animate-zoom-in">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white p-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Edit Data Nasabah</h2>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[75vh] overflow-y-auto p-6">
              <section className="mb-6">
                <div className="mb-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-teal-600">Data Pribadi</p>
                  <div className="mt-3 h-px bg-slate-200" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 uppercase mb-1 block" htmlFor="edit-nama">
                      Nama Lengkap
                    </label>
                    <input
                      id="edit-nama"
                      type="text"
                      value={editForm.nama}
                      onChange={(event) => setEditForm((current) => current ? { ...current, nama: event.target.value } : current)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase mb-1 block" htmlFor="edit-nik">
                      NIK (16 digit)
                    </label>
                    <input
                      id="edit-nik"
                      type="text"
                      maxLength={16}
                      value={editForm.nik}
                      onChange={(event) => setEditForm((current) => current ? { ...current, nik: event.target.value } : current)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase mb-1 block" htmlFor="edit-rekening">
                      No. Rekening
                    </label>
                    <input
                      id="edit-rekening"
                      type="text"
                      value={editForm.rekening}
                      onChange={(event) => setEditForm((current) => current ? { ...current, rekening: event.target.value } : current)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase mb-1 block" htmlFor="edit-hp">
                      No. HP
                    </label>
                    <input
                      id="edit-hp"
                      type="text"
                      value={editForm.hp}
                      onChange={(event) => setEditForm((current) => current ? { ...current, hp: event.target.value } : current)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase mb-1 block" htmlFor="edit-email">
                      Email
                    </label>
                    <input
                      id="edit-email"
                      type="email"
                      value={editForm.email}
                      onChange={(event) => setEditForm((current) => current ? { ...current, email: event.target.value } : current)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase mb-1 block" htmlFor="edit-lahir">
                      Tanggal Lahir
                    </label>
                    <input
                      id="edit-lahir"
                      type="text"
                      value={editForm.lahir}
                      onChange={(event) => setEditForm((current) => current ? { ...current, lahir: event.target.value } : current)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-slate-400 uppercase mb-1 block" htmlFor="edit-alamat">
                      Alamat
                    </label>
                    <textarea
                      id="edit-alamat"
                      rows={3}
                      value={editForm.alamat}
                      onChange={(event) => setEditForm((current) => current ? { ...current, alamat: event.target.value } : current)}
                      className="w-full resize-none border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </section>
              <section className="mb-6">
                <div className="mb-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-teal-600">Data Ibu Kandung</p>
                  <div className="mt-3 h-px bg-slate-200" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 uppercase mb-1 block" htmlFor="edit-namaibu">
                      Nama Ibu Kandung
                    </label>
                    <input
                      id="edit-namaibu"
                      type="text"
                      value={editForm.ibu.nama}
                      onChange={(event) => setEditForm((current) => current ? { ...current, ibu: { ...current.ibu, nama: event.target.value } } : current)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase mb-1 block" htmlFor="edit-lahiribu">
                      Tanggal Lahir Ibu Kandung
                    </label>
                    <input
                      id="edit-lahiribu"
                      type="text"
                      value={editForm.ibu.lahir}
                      onChange={(event) => setEditForm((current) => current ? { ...current, ibu: { ...current.ibu, lahir: event.target.value } } : current)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-slate-400 uppercase mb-1 block" htmlFor="edit-alamatibu">
                      Alamat Ibu Kandung
                    </label>
                    <textarea
                      id="edit-alamatibu"
                      rows={3}
                      value={editForm.ibu.alamat}
                      onChange={(event) => setEditForm((current) => current ? { ...current, ibu: { ...current.ibu, alamat: event.target.value } } : current)}
                      className="w-full resize-none border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </section>
              <section className="mb-6">
                <div className="mb-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-teal-600">Data Pekerjaan & Keuangan</p>
                  <div className="mt-3 h-px bg-slate-200" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 uppercase mb-1 block" htmlFor="edit-pekerjaan">
                      Pekerjaan
                    </label>
                    <select
                      id="edit-pekerjaan"
                      value={editForm.pekerjaan}
                      onChange={(event) => setEditForm((current) => current ? { ...current, pekerjaan: event.target.value } : current)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="PNS">PNS</option>
                      <option value="Wiraswasta">Wiraswasta</option>
                      <option value="Freelance">Freelance</option>
                      <option value="Petani">Petani</option>
                      <option value="Buruh">Buruh</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase mb-1 block" htmlFor="edit-penghasilan">
                      Penghasilan per Bulan
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-slate-500">Rp</span>
                      <input
                        id="edit-penghasilan"
                        type="number"
                        value={editForm.penghasilan}
                        onChange={(event) => setEditForm((current) => current ? { ...current, penghasilan: Number(event.target.value) } : current)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase mb-1 block" htmlFor="edit-cicilan">
                      Cicilan per Bulan
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-slate-500">Rp</span>
                      <input
                        id="edit-cicilan"
                        type="number"
                        value={editForm.cicilan}
                        onChange={(event) => setEditForm((current) => current ? { ...current, cicilan: Number(event.target.value) } : current)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase mb-1 block" htmlFor="edit-riwayat">
                      Riwayat Pembayaran
                    </label>
                    <select
                      id="edit-riwayat"
                      value={editForm.riwayatPembayaran}
                      onChange={(event) => setEditForm((current) => current ? { ...current, riwayatPembayaran: event.target.value } : current)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="Lancar">Lancar</option>
                      <option value="Telat">Telat</option>
                    </select>
                  </div>
                </div>
              </section>
              <section className="mb-6 rounded-lg bg-slate-50 p-4">
                <div className="mb-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-teal-600">BI Checking</p>
                  <div className="mt-3 h-px bg-slate-200" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 uppercase mb-1 block" htmlFor="edit-slik">
                      Status SLIK
                    </label>
                    <select
                      id="edit-slik"
                      value={editForm.slik}
                      onChange={(event) => setEditForm((current) =>
                        current ? {
                          ...current,
                          slik: event.target.value,
                          bi: { ...current.bi, status: event.target.value },
                        } : current
                      )}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="K1">K1 Lancar</option>
                      <option value="K2">K2 Perlu Diperhatikan</option>
                      <option value="K3">K3 Mulai Bermasalah</option>
                      <option value="K4">K4 Bermasalah</option>
                      <option value="K5">K5 Macet Total</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase mb-1 block" htmlFor="edit-jumlahlembaga">
                      Hutang di Berapa Tempat
                    </label>
                    <input
                      id="edit-jumlahlembaga"
                      type="number"
                      value={editForm.jumlahLembaga}
                      onChange={(event) => setEditForm((current) =>
                        current ? {
                          ...current,
                          jumlahLembaga: event.target.value,
                          bi: { ...current.bi, tempat: Number(event.target.value) },
                        } : current
                      )}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase mb-1 block" htmlFor="edit-totalhutang">
                      Total Hutang di Tempat Lain
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-slate-500">Rp</span>
                      <input
                        id="edit-totalhutang"
                        type="number"
                        value={editForm.totalHutangLain}
                        onChange={(event) => setEditForm((current) =>
                          current ? {
                            ...current,
                            totalHutangLain: event.target.value,
                            bi: { ...current.bi, totalHutang: Number(event.target.value) },
                          } : current
                        )}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase mb-1 block" htmlFor="edit-adatunggakan">
                      Ada Tunggakan di Tempat Lain
                    </label>
                    <select
                      id="edit-adatunggakan"
                      value={editForm.adaTunggakan}
                      onChange={(event) => setEditForm((current) =>
                        current ? {
                          ...current,
                          adaTunggakan: event.target.value,
                          bi: { ...current.bi, adaTunggakan: event.target.value === 'Ada Tunggakan' },
                        } : current
                      )}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="Tidak Ada">Tidak Ada</option>
                      <option value="Ada Tunggakan">Ada Tunggakan</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-slate-400 uppercase mb-1 block" htmlFor="edit-catatan">
                      Catatan
                    </label>
                    <textarea
                      id="edit-catatan"
                      rows={3}
                      value={editForm.catatan}
                      onChange={(event) => setEditForm((current) =>
                        current ? {
                          ...current,
                          catatan: event.target.value,
                          bi: { ...current.bi, catatan: event.target.value },
                        } : current
                      )}
                      className="w-full resize-none border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </section>
              <section className="mb-6">
                <div className="mb-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-teal-600">Data Pinjaman</p>
                  <div className="mt-3 h-px bg-slate-200" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 uppercase mb-1 block" htmlFor="edit-jumlah">
                      Jumlah Pinjaman
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-slate-500">Rp</span>
                      <input
                        id="edit-jumlah"
                        type="number"
                        value={editForm.jumlah}
                        onChange={(event) => setEditForm((current) => current ? { ...current, jumlah: Number(event.target.value) } : current)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase mb-1 block" htmlFor="edit-tenor">
                      Tenor
                    </label>
                    <select
                      id="edit-tenor"
                      value={String(editForm.tenor)}
                      onChange={(event) => setEditForm((current) => current ? { ...current, tenor: Number(event.target.value) } : current)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="6">6 bulan</option>
                      <option value="12">12 bulan</option>
                      <option value="18">18 bulan</option>
                      <option value="24">24 bulan</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase mb-1 block" htmlFor="edit-bunga">
                      Bunga per Tahun %
                    </label>
                    <input
                      id="edit-bunga"
                      type="number"
                      value={editForm.bunga}
                      onChange={(event) => setEditForm((current) => current ? { ...current, bunga: event.target.value } : current)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-slate-400 uppercase mb-1 block" htmlFor="edit-tujuan">
                      Tujuan Pinjaman
                    </label>
                    <textarea
                      id="edit-tujuan"
                      rows={3}
                      value={editForm.tujuan}
                      onChange={(event) => setEditForm((current) => current ? { ...current, tujuan: event.target.value } : current)}
                      className="w-full resize-none border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </section>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 p-6">
              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleUpdatePengajuan}
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isAllPengajuanOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4 py-10 animate-fade-in">
          <div className="w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-xl bg-white shadow-xl animate-zoom-in">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white p-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Semua Pengajuan Pinjaman</h2>
              </div>
              <button
                type="button"
                onClick={closeAllPengajuanModal}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[80vh] overflow-y-auto p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm text-slate-700">
                  <thead>
                    <tr>
                      <th className="border-b border-slate-100 px-3 py-3 text-xs uppercase tracking-wide text-slate-400">Nama Nasabah</th>
                      <th className="border-b border-slate-100 px-3 py-3 text-xs uppercase tracking-wide text-slate-400">Jumlah Pinjaman</th>
                      <th className="border-b border-slate-100 px-3 py-3 text-xs uppercase tracking-wide text-slate-400">Tenor</th>
                      <th className="border-b border-slate-100 px-3 py-3 text-xs uppercase tracking-wide text-slate-400">Status Risk</th>
                      <th className="border-b border-slate-100 px-3 py-3 text-xs uppercase tracking-wide text-slate-400">Rekomendasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pengajuanList.map((row, index) => {
                      const rekomendasiColor = row.rekomendasi === 'Approve'
                        ? 'text-blue-600'
                        : row.rekomendasi === 'Review'
                          ? 'text-slate-500'
                          : 'text-red-600'
                      return (
                        <tr key={`${row.id}-${row.nik}-${index}`} className="hover:bg-slate-50">
                          <td className="px-3 py-4 font-medium text-slate-900">{row.nama}</td>
                          <td className="px-3 py-4">{formatCurrency(row.jumlah)}</td>
                          <td className="px-3 py-4">{row.tenor}</td>
                          <td className="px-3 py-4">
                            <span className={renderRiskBadge(row.risiko)}>{row.risiko}</span>
                          </td>
                          <td className={`px-3 py-4 font-semibold ${rekomendasiColor}`}>{row.rekomendasi}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex justify-end border-t border-slate-100 bg-slate-50 p-6">
              <button
                type="button"
                onClick={closeAllPengajuanModal}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
