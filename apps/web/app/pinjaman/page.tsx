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

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('baru') === '1' || params.get('action') === 'new') {
        setIsPengajuanOpen(true)
      }
    }
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
}
