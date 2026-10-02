'use client'

import { useEffect, useState } from 'react'
import {
  PlusCircle,
  ShieldCheck,
  Search,
  CreditCard,
  FileText,
  Clock,
  Calendar,
  CheckCircle,
} from 'lucide-react'

import { api } from '@/lib/api'
import OriginalPinjaman, { hitungBunga } from '@/components/original-pinjaman'
import type { LoanForm } from '@/components/original-pinjaman'

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
  cicilanBulanan?: number
  totalPembayaran?: number
  estimasiPengeluaran: number
  riwayatPembayaran: string
  rasio: number
  jumlah: number
  tenor: number
  bunga: string
  tujuan: string
  tanggalPinjaman: string
  slik: string
  jumlahLembaga: string
  totalHutangLain: string
  adaTunggakan: string
  risiko: string
  risk: string
  rekomendasi: string
  status?: string
  pembayaran?: Array<{
    id: number
    nomorCicilan?: number
    jumlahBayar: number
    tanggalBayar?: string
    tanggalPembayaran?: string
    statusBayar?: string
  }>
  paidCount?: number
  totalPaid?: number
  isLunas?: boolean
}

const defaultForm: LoanForm = {
  nama: '',
  nik: '',
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
  estimasiPengeluaran: '',
  riwayat: 'Lancar',
  jumlahLembaga: '0',
  totalHutangLain: '0',
  adaTunggakan: 'Tidak Ada',
  jumlahPinjaman: '',
  tanggalPinjaman: '',
  tenor: '12',
  bunga: '0',
  tujuan: '',
}

export default function PinjamanPage() {
  const [isPengajuanOpen, setIsPengajuanOpen] = useState(false)
  const [pengajuanForm, setPengajuanForm] = useState<LoanForm>(defaultForm)
  const [pengajuanList, setPengajuanList] = useState<NasabahDetail[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const loadPinjaman = async () => {
    setIsLoading(true)
    setFetchError(null)

    try {
      const data = await api.getPinjaman()
      if (Array.isArray(data)) {
        const mapped = data.map((item: any, index: number) => {
          const tenor = Number(item.tenor ?? item.tenorBulan ?? 12)
          const pembayaran = Array.isArray(item.pembayaran) ? item.pembayaran : []
          const paidCount = pembayaran.length
          const totalPaid = pembayaran.reduce((sum: number, p: any) => sum + Number(p.jumlahBayar || 0), 0)
          const isLunas = item.status === 'lunas' || item.status === 'completed' || (tenor > 0 && paidCount >= tenor)
          return {
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
            pekerjaan: item.pekerjaan ?? item.nasabah?.pekerjaan ?? 'PNS',
            penghasilan: Number(item.penghasilan ?? item.nasabah?.penghasilan ?? 0),
            cicilan: Number(item.cicilan ?? item.cicilanBulanan ?? 0),
            cicilanBulanan: Number(item.cicilanBulanan ?? item.cicilan ?? 0),
            totalPembayaran: Number(item.totalPembayaran ?? 0),
            estimasiPengeluaran: Number(item.estimasiPengeluaran ?? item.nasabah?.estimasiPengeluaran ?? 0),
            riwayatPembayaran: item.riwayatPembayaran ?? item.riwayat ?? 'Lancar',
            rasio: Number(item.rasio ?? 0),
            jumlah: Number(item.jumlah ?? item.jumlahPinjaman ?? 0),
            tenor,
            bunga: String(item.bunga ?? item.sukuBunga ?? 0),
            tujuan: item.tujuan ?? '',
            tanggalPinjaman: item.tanggalPinjaman ?? item.tanggalPengajuan ?? '',
            slik: item.slik ?? item.bi?.status ?? 'K1',
            jumlahLembaga: String(item.jumlahLembaga ?? 0),
            totalHutangLain: String(item.totalHutangLain ?? 0),
            adaTunggakan: item.adaTunggakan ? 'Ada Tunggakan' : 'Tidak Ada',
            risiko: item.risiko ?? 'Rendah',
            risk: item.risk ?? item.risiko ?? 'Rendah',
            rekomendasi: item.rekomendasi ?? 'Approve',
            status: isLunas ? 'lunas' : (item.status ?? 'active'),
            pembayaran,
            paidCount,
            totalPaid,
            isLunas,
          }
        })
        setPengajuanList(mapped)
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

  useEffect(() => {
    loadPinjaman()
  }, [])

  const handleCreatePengajuan = async () => {
    const penghasilan = Number(pengajuanForm.penghasilan)
    const cicilan = Number(pengajuanForm.cicilan)
    const estimasiPengeluaran = Number(pengajuanForm.estimasiPengeluaran)
    const jumlahPinjaman = Number(pengajuanForm.jumlahPinjaman)
    const tenor = Number(pengajuanForm.tenor || 0)
    const rasio = penghasilan > 0 ? (cicilan / penghasilan) * 100 : 0

    // Hitung bunga otomatis berdasarkan jumlah pinjaman
    const bungaOtomatis = hitungBunga(jumlahPinjaman)

    let calculatedRisk = 'Rendah'
    if (rasio > 50) calculatedRisk = 'Tinggi'
    else if (rasio > 30) calculatedRisk = 'Sedang'

    const recommendation =
      calculatedRisk === 'Rendah' ? 'Approve' : calculatedRisk === 'Sedang' ? 'Review' : 'Reject'

    // Hitung cicilan bulanan
    const monthlyRate = bungaOtomatis / 100 / 12
    const cicilanBulanan =
      tenor > 0
        ? bungaOtomatis === 0
          ? jumlahPinjaman / tenor
          : (jumlahPinjaman * monthlyRate * Math.pow(1 + monthlyRate, tenor)) /
            (Math.pow(1 + monthlyRate, tenor) - 1)
        : 0

    const totalBunga = Math.round((cicilanBulanan * tenor - jumlahPinjaman) * 100) / 100
    const totalPembayaran = Math.round((jumlahPinjaman + totalBunga) * 100) / 100

    const payload = {
      nama: pengajuanForm.nama,
      nik: pengajuanForm.nik,
      email: pengajuanForm.email,
      penghasilan,
      cicilan,
      estimasiPengeluaran,
      jumlah: jumlahPinjaman,
      tenor,
      bunga: bungaOtomatis,
      tujuan: pengajuanForm.tujuan,
      tanggalPinjaman: pengajuanForm.tanggalPinjaman,
      risiko: calculatedRisk,
      rekomendasi: recommendation,
      jumlahPinjaman,
      tenorBulan: tenor,
      sukuBunga: bungaOtomatis,
      jenisBunga: 'efektif',
      cicilanBulanan: Math.round(cicilanBulanan * 100) / 100,
      totalBunga,
      totalPembayaran,
    }

    try {
      const created = await api.createPinjaman(payload)
      const saved = created && typeof created === 'object' ? created : null
      const newSubmission: NasabahDetail = {
        id: Number(saved?.id ?? Date.now()),
        nama: pengajuanForm.nama,
        nik: pengajuanForm.nik,
        rekening: '',
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
        estimasiPengeluaran,
        riwayatPembayaran: pengajuanForm.riwayat,
        rasio: Number(rasio.toFixed(1)),
        jumlah: jumlahPinjaman,
        tenor,
        bunga: String(bungaOtomatis),
        tujuan: pengajuanForm.tujuan,
        tanggalPinjaman: pengajuanForm.tanggalPinjaman,
        slik: 'K1',
        jumlahLembaga: pengajuanForm.jumlahLembaga,
        totalHutangLain: pengajuanForm.totalHutangLain,
        adaTunggakan: pengajuanForm.adaTunggakan,
        risiko: calculatedRisk,
        risk: calculatedRisk,
        rekomendasi: recommendation,
      }

      setPengajuanList((current) => [newSubmission, ...current])
      setPengajuanForm(defaultForm)
      setIsPengajuanOpen(false)
      alert('Pengajuan berhasil ditambahkan!')
    } catch (error) {
      console.error('Gagal menambahkan pengajuan', error)
      alert(error instanceof Error ? error.message : 'Gagal menambahkan pengajuan.')
    }
  }

  return (
    <>
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70">
          <div className="text-slate-500 text-sm">Memuat data pinjaman...</div>
        </div>
      )}
      {fetchError && (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-600 shadow">
          {fetchError}
        </div>
      )}
      <OriginalPinjaman
        rows={pengajuanList.map((row) => ({
          id: row.id,
          nama: row.nama,
          pekerjaan: row.pekerjaan,
          jumlah: row.jumlah,
          tenor: row.tenor,
          risiko: row.risiko,
          rekomendasi: row.rekomendasi,
          status: row.status,
          paidCount: row.paidCount,
          isLunas: row.isLunas,
          cicilanBulanan: row.cicilanBulanan,
          totalPembayaran: row.totalPembayaran,
          pembayaran: row.pembayaran,
        }))}
        detailRows={pengajuanList.map((row) => ({
          id: row.id,
          nama: row.nama,
          nik: row.nik,
          hp: row.hp,
          email: row.email,
          alamat: row.alamat,
          pekerjaan: row.pekerjaan,
          jumlah: row.jumlah,
          tenor: row.tenor,
          bunga: hitungBunga(row.jumlah),
          tujuan: row.tujuan,
          tanggalPinjaman: row.tanggalPinjaman,
          penghasilan: row.penghasilan,
          estimasiPengeluaran: row.estimasiPengeluaran,
          cicilan: row.cicilan,
          cicilanBulanan: row.cicilanBulanan,
          totalPembayaran: row.totalPembayaran,
          totalPaid: row.totalPaid,
          paidCount: row.paidCount,
          isLunas: row.isLunas,
          status: row.status,
          risiko: row.risiko,
          rekomendasi: row.rekomendasi,
          pembayaran: row.pembayaran,
        }))}
        onNew={() => setIsPengajuanOpen(true)}
        onSelect={(id) => {
          // handled inside component via View button
        }}
        isNewOpen={isPengajuanOpen}
        form={pengajuanForm}
        onFormChange={(key, value) => {
          setPengajuanForm((current) => {
            const updated = { ...current, [key]: value }
            // Auto-update bunga saat jumlah pinjaman berubah
            if (key === 'jumlahPinjaman') {
              updated.bunga = String(hitungBunga(Number(value)))
            }
            return updated
          })
        }}
        onSubmit={handleCreatePengajuan}
        onCancel={() => setIsPengajuanOpen(false)}
        onPaymentSuccess={loadPinjaman}
      />
    </>
  )
}
