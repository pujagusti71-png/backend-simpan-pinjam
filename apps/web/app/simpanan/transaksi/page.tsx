'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useMemo, useState } from 'react'
import {
    ArrowDownRight,
    ArrowLeftRight,
    ArrowUpRight,
    Banknote,
    Calendar,
    CheckCircle2,
    Clock,
    CreditCard,
    DollarSign,
    Filter,
    PiggyBank,
    PlusCircle,
    Search,
    ShieldAlert,
    Sparkles,
    User,
    Wallet,
} from 'lucide-react'
import { api, apiFetch } from '@/lib/api'

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value || 0)

const formatDate = (value: string) => {
    if (!value) return '-'
    try {
        return new Date(value).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        })
    } catch {
        return value
    }
}

type NasabahOption = {
    id: number
    nama: string
    nik: string
    saldoRataRata?: number
}

type PinjamanOption = {
    id: number
    nasabahId: number
    namaNasabah: string
    jumlahPinjaman: number
    tenor: number
    cicilanBulanan: number
    status: string
    pembayaran?: any[]
    paidCount: number
    isLunas: boolean
}

type SimpananRow = {
    id: number
    nasabah: string
    tanggal: string
    jenis: 'Setoran' | 'Penarikan'
    nominal: number
    bungaRate: number
    saldoAkhir: number
    status: string
    keterangan: string
}

type PinjamanRow = {
    id: number
    namaNasabah: string
    pinjamanId: number
    jumlahBayar: number
    tanggalBayar: string
    statusBayar: string
    nomorCicilan?: number
}

function TransaksiContent() {
    const searchParams = useSearchParams()
    const initialTab = searchParams.get('tab') === 'pinjaman' ? 'pinjaman' : 'simpanan'

    const [activeTab, setActiveTab] = useState<'simpanan' | 'pinjaman'>(initialTab)

    // Common State
    const [nasabahList, setNasabahList] = useState<NasabahOption[]>([])
    const [pinjamanList, setPinjamanList] = useState<PinjamanOption[]>([])
    const [loading, setLoading] = useState(true)

    // Simpanan State
    const [simpananRows, setSimpananRows] = useState<SimpananRow[]>([])
    const [simpananSubmitting, setSimpananSubmitting] = useState(false)
    const [simpananError, setSimpananError] = useState('')
    const [selectedBalance, setSelectedBalance] = useState(0)
    const [searchSimpanan, setSearchSimpanan] = useState('')
    const [filterJenisSimpanan, setFilterJenisSimpanan] = useState<'semua' | 'Setoran' | 'Penarikan'>('semua')

    const [simpananForm, setSimpananForm] = useState({
        nasabahId: '',
        jenis: 'setoran',
        nominal: '500000',
        tanggal: new Date().toISOString().slice(0, 10),
        keterangan: '',
    })

    // Pinjaman State
    const [pinjamanRows, setPinjamanRows] = useState<PinjamanRow[]>([])
    const [pinjamanSubmitting, setPinjamanSubmitting] = useState(false)
    const [pinjamanError, setPinjamanError] = useState('')
    const [searchPinjaman, setSearchPinjaman] = useState('')
    const [filterStatusPinjaman, setFilterStatusPinjaman] = useState<'semua' | 'lancar' | 'telat'>('semua')

    const [pinjamanForm, setPinjamanForm] = useState({
        pinjamanId: '',
        jumlahBayar: '1000000',
        tanggalBayar: new Date().toISOString().slice(0, 10),
        statusBayar: 'lancar',
        nomorCicilan: '',
    })

    // Bunga Otomatis Simpanan
    const totalSaldoSimpanan = selectedBalance + Number(simpananForm.nominal || 0)
    const autoRate =
        Number(simpananForm.nominal) > 0
            ? totalSaldoSimpanan < 5_000_000
                ? 0
                : totalSaldoSimpanan < 10_000_000
                ? 0.5
                : totalSaldoSimpanan < 15_000_000
                ? 1
                : totalSaldoSimpanan < 20_000_000
                ? 1.5
                : totalSaldoSimpanan <= 100_000_000
                ? 2
                : totalSaldoSimpanan <= 250_000_000
                ? 2.5
                : totalSaldoSimpanan <= 500_000_000
                ? 3
                : totalSaldoSimpanan <= 1_000_000_000
                ? 3.5
                : 4
            : 0

    // Load All Data
    const loadAllData = async () => {
        try {
            setLoading(true)

            const [nasabahData, pinjamanData, pembayaranData, simpananData] = await Promise.all([
                api.getNasabah().catch(() => []),
                api.getPinjaman().catch(() => []),
                api.getPembayaran().catch(() => []),
                api.getSimpanan().catch(() => []),
            ])

            const nList = Array.isArray(nasabahData) ? nasabahData : []
            setNasabahList(nList)

            // Pinjaman list for selection
            const pList: PinjamanOption[] = Array.isArray(pinjamanData)
                ? pinjamanData.map((p: any) => {
                      const payments = Array.isArray(p.pembayaran) ? p.pembayaran : []
                      const tenor = Number(p.tenor ?? 0)
                      const paidCount = payments.length
                      const isLunas = p.status === 'lunas' || p.status === 'completed' || (tenor > 0 && paidCount >= tenor)
                      return {
                          id: Number(p.id),
                          nasabahId: Number(p.nasabahId ?? p.nasabah?.id),
                          namaNasabah: p.nasabah?.nama ?? 'Nasabah',
                          jumlahPinjaman: Number(p.jumlahPinjaman ?? 0),
                          tenor,
                          cicilanBulanan: Number(p.cicilanBulanan ?? 0),
                          status: isLunas ? 'lunas' : (p.status ?? 'active'),
                          pembayaran: payments,
                          paidCount,
                          isLunas,
                      }
                  })
                : []
            setPinjamanList(pList)

            const firstNasabah = nList[0]
            if (firstNasabah && !simpananForm.nasabahId) {
                setSimpananForm((prev) => ({ ...prev, nasabahId: String(firstNasabah.id) }))
            }

            const firstPinjaman = pList.find((p) => !p.isLunas) || pList[0]
            if (firstPinjaman && !pinjamanForm.pinjamanId) {
                const nextCicilan = firstPinjaman.paidCount + 1
                setPinjamanForm((prev) => ({
                    ...prev,
                    pinjamanId: String(firstPinjaman.id),
                    jumlahBayar: firstPinjaman.cicilanBulanan ? String(firstPinjaman.cicilanBulanan) : prev.jumlahBayar,
                    nomorCicilan: String(nextCicilan),
                }))
            }

            // Simpanan Rows
            const sRecords = Array.isArray(simpananData) ? simpananData : []
            const sRows: SimpananRow[] = sRecords.map((r: any) => {
                const nasabahItem = nList.find((n: any) => Number(n.id) === Number(r.nasabahId ?? r.nasabah?.id))
                const isBunga = String(r?.keterangan ?? '').toLowerCase().includes('bunga')
                const bungaRate = Number(r?.bungaSimpanan ?? 0)
                const nominalVal = Math.abs(Number(r.jumlahSetoran || 0))
                return {
                    id: Number(r.id),
                    nasabah: nasabahItem?.nama ?? r.nasabah?.nama ?? 'Nasabah',
                    tanggal: r.tanggalSetoran || r.createdAt || '',
                    jenis: isBunga ? 'Setoran' : Number(r.jumlahSetoran || 0) >= 0 ? 'Setoran' : 'Penarikan',
                    nominal: nominalVal,
                    bungaRate: bungaRate > 0 ? bungaRate : isBunga ? 0.5 : 0,
                    saldoAkhir: Number(r.saldoAkhir || 0),
                    status: r.status || 'aktif',
                    keterangan: r.keterangan || (isBunga ? 'Bunga tabungan' : 'Transaksi simpanan'),
                }
            })
            setSimpananRows(sRows.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()))

            // Pinjaman Pembayaran Rows
            const pRecords = Array.isArray(pembayaranData) ? pembayaranData : []
            const pRows: PinjamanRow[] = pRecords.map((item: any) => ({
                id: Number(item.id ?? 0),
                namaNasabah: item.pinjaman?.nasabah?.nama ?? 'Nasabah',
                jumlahBayar: Number(item.jumlahBayar ?? 0),
                tanggalBayar: item.tanggalBayar ?? item.tanggalPembayaran ?? item.createdAt ?? '',
                statusBayar: item.statusBayar ?? 'lancar',
                pinjamanId: Number(item.pinjamanId ?? item.pinjaman?.id ?? 0),
                nomorCicilan: item.nomorCicilan ? Number(item.nomorCicilan) : undefined,
            }))
            setPinjamanRows(pRows.sort((a, b) => new Date(b.tanggalBayar).getTime() - new Date(a.tanggalBayar).getTime()))
        } catch (err) {
            console.error('Gagal memuat data transaksi', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void loadAllData()
    }, [])

    // Balance check for selected nasabah in Simpanan
    useEffect(() => {
        const fetchBalance = async () => {
            if (!simpananForm.nasabahId) {
                setSelectedBalance(0)
                return
            }
            try {
                const summary = await apiFetch(`/simpanan/summary/${simpananForm.nasabahId}`)
                setSelectedBalance(Number(summary?.saldoSaatIni || 0))
            } catch {
                setSelectedBalance(0)
            }
        }
        void fetchBalance()
    }, [simpananForm.nasabahId])

    // Update default nominal if pinjaman selected changes
    const handlePinjamanSelectChange = (id: string) => {
        const selected = pinjamanList.find((p) => String(p.id) === id)
        const paidCount = selected?.paidCount ?? selected?.pembayaran?.length ?? 0
        const nextCicilan = paidCount + 1
        setPinjamanForm((prev) => ({
            ...prev,
            pinjamanId: id,
            jumlahBayar: selected?.cicilanBulanan ? String(selected.cicilanBulanan) : prev.jumlahBayar,
            nomorCicilan: String(nextCicilan),
        }))
    }

    // Submit Transaksi Simpanan
    const handleSimpananSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSimpananError('')

        if (!simpananForm.nasabahId || !simpananForm.nominal) {
            setSimpananError('Pilih nasabah dan masukkan nominal transaksi.')
            return
        }

        const nominal = Number(simpananForm.nominal)
        if (!nominal || nominal <= 0) {
            setSimpananError('Nominal harus angka positif.')
            return
        }

        if (simpananForm.jenis === 'penarikan' && nominal > selectedBalance) {
            setSimpananError(`Saldo tidak mencukupi. Saldo saat ini: ${formatCurrency(selectedBalance)}`)
            return
        }

        try {
            setSimpananSubmitting(true)
            if (simpananForm.jenis === 'setoran') {
                await api.createSimpanan({
                    nasabahId: Number(simpananForm.nasabahId),
                    jumlahSetoran: nominal,
                    bungaSimpanan: autoRate,
                    jenisInterest: 'flat',
                    tanggalSetoran: new Date(`${simpananForm.tanggal}T00:00:00`).toISOString(),
                    keterangan: simpananForm.keterangan || 'Setoran simpanan',
                })
            } else {
                await api.withdrawSimpanan({
                    nasabahId: Number(simpananForm.nasabahId),
                    jumlahPenarikan: nominal,
                    keterangan: simpananForm.keterangan || 'Penarikan simpanan',
                })
            }

            setSimpananForm((prev) => ({
                ...prev,
                nominal: '',
                keterangan: '',
            }))
            await loadAllData()
        } catch (err: any) {
            setSimpananError(err.message || 'Gagal menyimpan transaksi simpanan.')
        } finally {
            setSimpananSubmitting(false)
        }
    }

    // Submit Transaksi Pembayaran Pinjaman
    const handlePinjamanSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setPinjamanError('')

        if (!pinjamanForm.pinjamanId || !pinjamanForm.jumlahBayar) {
            setPinjamanError('Pilih pinjaman dan masukkan jumlah bayar.')
            return
        }

        const nominal = Number(pinjamanForm.jumlahBayar)
        if (!nominal || nominal <= 0) {
            setPinjamanError('Jumlah bayar harus lebih besar dari 0.')
            return
        }

        const selected = pinjamanList.find((p) => String(p.id) === pinjamanForm.pinjamanId)
        if (selected?.isLunas || (selected && selected.tenor > 0 && selected.paidCount >= selected.tenor)) {
            setPinjamanError('Pinjaman ini sudah LUNAS (DONE). Seluruh cicilan telah dibayar.')
            return
        }

        try {
            setPinjamanSubmitting(true)
            const targetNomor = pinjamanForm.nomorCicilan ? Number(pinjamanForm.nomorCicilan) : ((selected?.paidCount || 0) + 1)
            await api.createPembayaran({
                pinjamanId: Number(pinjamanForm.pinjamanId),
                jumlahBayar: nominal,
                tanggalBayar: new Date(`${pinjamanForm.tanggalBayar}T00:00:00`).toISOString(),
                statusBayar: pinjamanForm.statusBayar,
                nomorCicilan: targetNomor,
            })

            const isDone = selected && selected.tenor > 0 && targetNomor >= selected.tenor
            alert(
                `Pembayaran cicilan ke-${targetNomor} berhasil dicatat!` +
                (isDone ? '\n\nSELAMAT! Pinjaman nasabah ini kini telah LUNAS (DONE)!' : '')
            )

            setPinjamanForm((prev) => ({
                ...prev,
                nomorCicilan: '',
            }))
            await loadAllData()
        } catch (err: any) {
            setPinjamanError(err.message || 'Gagal mencatat pembayaran pinjaman.')
        } finally {
            setPinjamanSubmitting(false)
        }
    }

    // Filtered Lists
    const filteredSimpanan = useMemo(() => {
        return simpananRows.filter((r) => {
            const matchName = r.nasabah.toLowerCase().includes(searchSimpanan.toLowerCase())
            const matchJenis = filterJenisSimpanan === 'semua' || r.jenis === filterJenisSimpanan
            return matchName && matchJenis
        })
    }, [simpananRows, searchSimpanan, filterJenisSimpanan])

    const filteredPinjaman = useMemo(() => {
        return pinjamanRows.filter((r) => {
            const matchName = r.namaNasabah.toLowerCase().includes(searchPinjaman.toLowerCase())
            const matchStatus = filterStatusPinjaman === 'semua' || r.statusBayar.toLowerCase() === filterStatusPinjaman
            return matchName && matchStatus
        })
    }, [pinjamanRows, searchPinjaman, filterStatusPinjaman])

    // Stats Simpanan
    const totalSetoran = useMemo(() => {
        return simpananRows.filter((r) => r.jenis === 'Setoran').reduce((sum, r) => sum + r.nominal, 0)
    }, [simpananRows])

    const totalPenarikan = useMemo(() => {
        return simpananRows.filter((r) => r.jenis === 'Penarikan').reduce((sum, r) => sum + r.nominal, 0)
    }, [simpananRows])

    // Stats Pinjaman
    const totalBayarPinjaman = useMemo(() => {
        return pinjamanRows.reduce((sum, r) => sum + r.jumlahBayar, 0)
    }, [pinjamanRows])

    const lancarCount = useMemo(() => {
        return pinjamanRows.filter((r) => r.statusBayar?.toLowerCase() === 'lancar').length
    }, [pinjamanRows])

    const telatCount = useMemo(() => {
        return pinjamanRows.filter((r) => r.statusBayar?.toLowerCase() === 'telat').length
    }, [pinjamanRows])

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Link href="/dashboard" className="hover:text-emerald-700">Beranda</Link>
                            <span>/</span>
                            <span className="font-medium text-slate-800">Transaksi</span>
                        </div>
                        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                            Pusat Transaksi Koperasi
                        </h1>
                        <p className="text-sm text-slate-600">
                            Pencatatan dan riwayat lengkap transaksi simpanan serta pembayaran angsuran pinjaman.
                        </p>
                    </div>

                    {/* Action shortcuts */}
                    <div className="flex flex-wrap items-center gap-2">
                        <Link
                            href="/pengajuan/simpanan"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-sm font-semibold text-emerald-800 shadow-sm transition hover:bg-emerald-100"
                        >
                            <PlusCircle className="h-4 w-4 text-emerald-600" />
                            Pengajuan Simpanan
                        </Link>
                        <Link
                            href="/pengajuan/pinjaman"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-sky-300 bg-sky-50 px-3.5 py-2 text-sm font-semibold text-sky-800 shadow-sm transition hover:bg-sky-100"
                        >
                            <PlusCircle className="h-4 w-4 text-sky-600" />
                            Pengajuan Pinjaman
                        </Link>
                    </div>
                </div>

                {/* Tab Switcher */}
                <div className="flex rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
                    <button
                        onClick={() => setActiveTab('simpanan')}
                        className={`flex flex-1 items-center justify-center gap-2.5 rounded-lg py-3 text-sm font-bold transition ${
                            activeTab === 'simpanan'
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                    >
                        <PiggyBank className="h-5 w-5" />
                        <span>Transaksi Simpanan</span>
                        <span
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                activeTab === 'simpanan' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'
                            }`}
                        >
                            {simpananRows.length}
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveTab('pinjaman')}
                        className={`flex flex-1 items-center justify-center gap-2.5 rounded-lg py-3 text-sm font-bold transition ${
                            activeTab === 'pinjaman'
                                ? 'bg-sky-600 text-white shadow-sm'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                    >
                        <CreditCard className="h-5 w-5" />
                        <span>Transaksi Pinjaman</span>
                        <span
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                activeTab === 'pinjaman' ? 'bg-sky-700 text-white' : 'bg-slate-200 text-slate-700'
                            }`}
                        >
                            {pinjamanRows.length}
                        </span>
                    </button>
                </div>

                {/* TAB 1: TRANSAKSI SIMPANAN */}
                {activeTab === 'simpanan' && (
                    <div className="space-y-6">
                        {/* Summary Cards Simpanan */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                <div className="flex items-center justify-between text-slate-500">
                                    <span className="text-xs font-semibold uppercase">Total Setoran</span>
                                    <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                                        <ArrowDownRight className="h-4 w-4" />
                                    </div>
                                </div>
                                <div className="mt-2 text-xl font-bold text-slate-900">
                                    {formatCurrency(totalSetoran)}
                                </div>
                                <span className="text-xs text-slate-500">Dana simpanan masuk</span>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                <div className="flex items-center justify-between text-slate-500">
                                    <span className="text-xs font-semibold uppercase">Total Penarikan</span>
                                    <div className="rounded-lg bg-rose-50 p-2 text-rose-600">
                                        <ArrowUpRight className="h-4 w-4" />
                                    </div>
                                </div>
                                <div className="mt-2 text-xl font-bold text-slate-900">
                                    {formatCurrency(totalPenarikan)}
                                </div>
                                <span className="text-xs text-slate-500">Dana ditarik nasabah</span>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                <div className="flex items-center justify-between text-slate-500">
                                    <span className="text-xs font-semibold uppercase">Saldo Kas Bersih</span>
                                    <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                                        <Wallet className="h-4 w-4" />
                                    </div>
                                </div>
                                <div className="mt-2 text-xl font-bold text-emerald-700">
                                    {formatCurrency(Math.max(totalSetoran - totalPenarikan, 0))}
                                </div>
                                <span className="text-xs text-slate-500">Setoran dikurangi penarikan</span>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                <div className="flex items-center justify-between text-slate-500">
                                    <span className="text-xs font-semibold uppercase">Jumlah Transaksi</span>
                                    <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
                                        <ArrowLeftRight className="h-4 w-4" />
                                    </div>
                                </div>
                                <div className="mt-2 text-xl font-bold text-slate-900">
                                    {simpananRows.length} Transaksi
                                </div>
                                <span className="text-xs text-slate-500">Tercatat di sistem</span>
                            </div>
                        </div>

                        {/* Form Catat Transaksi Simpanan */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="border-b border-slate-100 pb-3">
                                <h3 className="text-base font-bold text-slate-900">
                                    Catat Transaksi Simpanan Baru
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Pilih nasabah yang terdaftar untuk mencatat setoran tabungan atau penarikan saldo.
                                </p>
                            </div>

                            <form onSubmit={handleSimpananSubmit} className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">
                                        Nasabah Terdaftar <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={simpananForm.nasabahId}
                                        onChange={(e) =>
                                            setSimpananForm((prev) => ({ ...prev, nasabahId: e.target.value }))
                                        }
                                        className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500"
                                    >
                                        <option value="">-- Pilih nasabah --</option>
                                        {nasabahList.map((item) => (
                                            <option key={item.id} value={item.id}>
                                                {item.nama} ({item.nik})
                                            </option>
                                        ))}
                                    </select>
                                    {simpananForm.nasabahId && (
                                        <p className="mt-1 text-xs text-emerald-700 font-medium">
                                            Saldo saat ini: {formatCurrency(selectedBalance)}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700">
                                        Jenis Transaksi <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={simpananForm.jenis}
                                        onChange={(e) =>
                                            setSimpananForm((prev) => ({ ...prev, jenis: e.target.value }))
                                        }
                                        className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500"
                                    >
                                        <option value="setoran">Setoran (Menambah Saldo)</option>
                                        <option value="penarikan">Penarikan (Mengambil Saldo)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700">
                                        Nominal Transaksi (Rp) <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        value={simpananForm.nominal}
                                        onChange={(e) =>
                                            setSimpananForm((prev) => ({ ...prev, nominal: e.target.value }))
                                        }
                                        placeholder="500000"
                                        className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500"
                                    />
                                    <p className="mt-1 text-xs text-slate-500">
                                        Terbilang: {formatCurrency(Number(simpananForm.nominal) || 0)}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700">
                                        Tanggal Transaksi
                                    </label>
                                    <input
                                        type="date"
                                        value={simpananForm.tanggal}
                                        onChange={(e) =>
                                            setSimpananForm((prev) => ({ ...prev, tanggal: e.target.value }))
                                        }
                                        className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-800">
                                        <Sparkles className="h-4 w-4 shrink-0 text-emerald-600" />
                                        <span>
                                            <strong>Bunga Otomatis:</strong> Ketentuan saldo sampai Rp 5.000.000 = 0%, di atas Rp 5.000.000 sampai Rp 20.000.000 = 0,5%.
                                        </span>
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700">
                                        Keterangan
                                    </label>
                                    <input
                                        type="text"
                                        value={simpananForm.keterangan}
                                        onChange={(e) =>
                                            setSimpananForm((prev) => ({ ...prev, keterangan: e.target.value }))
                                        }
                                        placeholder="Contoh: Setoran bulanan, penarikan kebutuhan sekolah"
                                        className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500"
                                    />
                                </div>

                                {simpananError && (
                                    <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 md:col-span-2">
                                        {simpananError}
                                    </div>
                                )}

                                <div className="flex justify-end md:col-span-2">
                                    <button
                                        type="submit"
                                        disabled={simpananSubmitting || loading}
                                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                                    >
                                        <PlusCircle className="h-4 w-4" />
                                        {simpananSubmitting ? 'Menyimpan...' : 'Catat transaksi'}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Tabel Riwayat Transaksi Simpanan */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">
                                        Riwayat Transaksi Simpanan
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Daftar seluruh setoran dan penarikan simpanan anggota.
                                    </p>
                                </div>

                                {/* Filters */}
                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                        <input
                                            type="text"
                                            value={searchSimpanan}
                                            onChange={(e) => setSearchSimpanan(e.target.value)}
                                            placeholder="Cari nama nasabah..."
                                            className="w-48 rounded-lg border border-slate-300 py-1.5 pl-9 pr-3 text-xs outline-none focus:border-emerald-500 md:w-56"
                                        />
                                    </div>

                                    <select
                                        value={filterJenisSimpanan}
                                        onChange={(e) => setFilterJenisSimpanan(e.target.value as any)}
                                        className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:border-emerald-500"
                                    >
                                        <option value="semua">Semua Jenis</option>
                                        <option value="Setoran">Setoran</option>
                                        <option value="Penarikan">Penarikan</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mt-4 overflow-x-auto">
                                <table className="min-w-full text-left text-sm text-slate-700">
                                    <thead>
                                        <tr className="border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
                                            <th className="px-3 py-3">Nasabah</th>
                                            <th className="px-3 py-3">Jenis</th>
                                            <th className="px-3 py-3">Nominal</th>
                                            <th className="px-3 py-3">Bunga</th>
                                            <th className="px-3 py-3">Tanggal</th>
                                            <th className="px-3 py-3">Saldo Akhir</th>
                                            <th className="px-3 py-3">Keterangan</th>
                                            <th className="px-3 py-3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={8} className="py-8 text-center text-slate-400">
                                                    Memuat transaksi simpanan...
                                                </td>
                                            </tr>
                                        ) : filteredSimpanan.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="py-8 text-center text-slate-500">
                                                    Belum ada transaksi simpanan yang tercatat.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredSimpanan.map((row) => (
                                                <tr key={row.id} className="hover:bg-slate-50/80 transition">
                                                    <td className="px-3 py-3 font-semibold text-slate-900">
                                                        {row.nasabah}
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        <span
                                                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                                                row.jenis === 'Setoran'
                                                                    ? 'bg-emerald-100 text-emerald-800'
                                                                    : 'bg-rose-100 text-rose-800'
                                                            }`}
                                                        >
                                                            {row.jenis}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-3 font-bold text-slate-900">
                                                        {formatCurrency(row.nominal)}
                                                    </td>
                                                    <td className="px-3 py-3 text-slate-600">
                                                        {row.bungaRate ? `${row.bungaRate}%` : '-'}
                                                    </td>
                                                    <td className="px-3 py-3 text-slate-600">
                                                        {formatDate(row.tanggal)}
                                                    </td>
                                                    <td className="px-3 py-3 font-semibold text-emerald-700">
                                                        {formatCurrency(row.saldoAkhir)}
                                                    </td>
                                                    <td className="px-3 py-3 text-xs text-slate-500">
                                                        {row.keterangan}
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                                                            {row.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: TRANSAKSI PINJAMAN */}
                {activeTab === 'pinjaman' && (
                    <div className="space-y-6">
                        {/* Summary Cards Pinjaman */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                <div className="flex items-center justify-between text-slate-500">
                                    <span className="text-xs font-semibold uppercase">Total Pembayaran</span>
                                    <div className="rounded-lg bg-sky-50 p-2 text-sky-600">
                                        <Banknote className="h-4 w-4" />
                                    </div>
                                </div>
                                <div className="mt-2 text-xl font-bold text-slate-900">
                                    {formatCurrency(totalBayarPinjaman)}
                                </div>
                                <span className="text-xs text-slate-500">Dana angsuran masuk</span>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                <div className="flex items-center justify-between text-slate-500">
                                    <span className="text-xs font-semibold uppercase">Pembayaran Lancar</span>
                                    <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                                        <CheckCircle2 className="h-4 w-4" />
                                    </div>
                                </div>
                                <div className="mt-2 text-xl font-bold text-emerald-700">
                                    {lancarCount} Transaksi
                                </div>
                                <span className="text-xs text-slate-500">Tepat waktu</span>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                <div className="flex items-center justify-between text-slate-500">
                                    <span className="text-xs font-semibold uppercase">Pembayaran Telat</span>
                                    <div className="rounded-lg bg-rose-50 p-2 text-rose-600">
                                        <Clock className="h-4 w-4" />
                                    </div>
                                </div>
                                <div className="mt-2 text-xl font-bold text-rose-700">
                                    {telatCount} Transaksi
                                </div>
                                <span className="text-xs text-slate-500">Terlambat bayar</span>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                <div className="flex items-center justify-between text-slate-500">
                                    <span className="text-xs font-semibold uppercase">Total Pinjaman Terdaftar</span>
                                    <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                                        <CreditCard className="h-4 w-4" />
                                    </div>
                                </div>
                                <div className="mt-2 text-xl font-bold text-slate-900">
                                    {pinjamanList.length} Berkas
                                </div>
                                <span className="text-xs text-slate-500">Data pinjaman nasabah</span>
                            </div>
                        </div>

                        {/* Form Catat Pembayaran Pinjaman */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="border-b border-slate-100 pb-3">
                                <h3 className="text-base font-bold text-slate-900">
                                    Catat Pembayaran Angsuran Pinjaman
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Pilih pinjaman nasabah untuk mencatat pembayaran cicilan masuk ke sistem.
                                </p>
                            </div>

                            <form onSubmit={handlePinjamanSubmit} className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                                {(() => {
                                    const selectedPinjaman = pinjamanList.find((p) => String(p.id) === pinjamanForm.pinjamanId)
                                    const selectedPaidCount = selectedPinjaman?.paidCount ?? selectedPinjaman?.pembayaran?.length ?? 0
                                    const selectedTenor = selectedPinjaman?.tenor || 12
                                    const selectedIsDone = Boolean(selectedPinjaman?.isLunas || (selectedTenor > 0 && selectedPaidCount >= selectedTenor))
                                    const nextCicilan = selectedPaidCount + 1

                                    if (!selectedPinjaman) return null

                                    if (selectedIsDone) {
                                        return (
                                            <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-950 md:col-span-2 flex items-center gap-3">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-lg shadow-sm">
                                                    ✓
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-extrabold text-sm text-emerald-900">PINJAMAN SUDAH LUNAS (DONE)</h4>
                                                        <span className="rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                                                            Selesai
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-emerald-800 mt-0.5">
                                                        Nasabah telah membayar sebanyak {selectedPaidCount} dari {selectedTenor} kali cicilan pinjaman ini. Tidak ada tagihan cicilan yang tersisa.
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                    }

                                    return (
                                        <div className="rounded-xl border border-sky-300 bg-sky-50 p-4 text-sky-950 md:col-span-2 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold uppercase tracking-wider text-sky-800">
                                                    Identifikasi Angsuran Otomatis
                                                </span>
                                                <span className="rounded-full bg-sky-600 px-3 py-0.5 text-xs font-extrabold text-white shadow-xs">
                                                    Cicilan ke-{nextCicilan} dari {selectedTenor}
                                                </span>
                                            </div>
                                            <p className="text-sm font-semibold text-sky-950">
                                                Ini adalah pembayaran untuk <span className="underline underline-offset-2 font-bold text-sky-900">cicilan yang ke-{nextCicilan}</span>.
                                            </p>
                                            <p className="text-xs text-sky-800">
                                                Nasabah telah membayar sebanyak {selectedPaidCount} kali sebelumnya. Tersisa {Math.max(0, selectedTenor - nextCicilan)} cicilan setelah pembayaran ini.
                                            </p>
                                            {nextCicilan === selectedTenor && (
                                                <p className="text-xs font-bold text-emerald-700 mt-1">
                                                    ★ Ini adalah cicilan terakhir (ke-{selectedTenor}). Setelah pembayaran ini tersimpan, pinjaman otomatis LUNAS (DONE)!
                                                </p>
                                            )}
                                        </div>
                                    )
                                })()}

                                <div>
                                    <label className="block text-sm font-medium text-slate-700">
                                        Pilih Pinjaman Nasabah <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={pinjamanForm.pinjamanId}
                                        onChange={(e) => handlePinjamanSelectChange(e.target.value)}
                                        className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-500"
                                    >
                                        <option value="">-- Pilih Pinjaman --</option>
                                        {pinjamanList.map((p) => {
                                            const isDone = p.isLunas || (p.tenor > 0 && p.paidCount >= p.tenor)
                                            return (
                                                <option key={p.id} value={p.id}>
                                                    ID #{p.id} - {p.namaNasabah} (Pinjaman: {formatCurrency(p.jumlahPinjaman)} | Tenor: {p.tenor} bln) — {isDone ? '✓ DONE (Lunas)' : `Sudah bayar ${p.paidCount}x (Ke-${p.paidCount + 1})`}
                                                </option>
                                            )
                                        })}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700">
                                        Jumlah Pembayaran (Rp) <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        value={pinjamanForm.jumlahBayar}
                                        onChange={(e) =>
                                            setPinjamanForm((prev) => ({ ...prev, jumlahBayar: e.target.value }))
                                        }
                                        placeholder="1000000"
                                        className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-500"
                                    />
                                    <p className="mt-1 text-xs text-slate-500">
                                        Terbilang: {formatCurrency(Number(pinjamanForm.jumlahBayar) || 0)}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700">
                                        Tanggal Pembayaran
                                    </label>
                                    <input
                                        type="date"
                                        value={pinjamanForm.tanggalBayar}
                                        onChange={(e) =>
                                            setPinjamanForm((prev) => ({ ...prev, tanggalBayar: e.target.value }))
                                        }
                                        className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700">
                                        Status Pembayaran
                                    </label>
                                    <select
                                        value={pinjamanForm.statusBayar}
                                        onChange={(e) =>
                                            setPinjamanForm((prev) => ({ ...prev, statusBayar: e.target.value }))
                                        }
                                        className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-500"
                                    >
                                        <option value="lancar">Lancar (Tepat Waktu)</option>
                                        <option value="telat">Telat (Terlambat)</option>
                                    </select>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700">
                                        Cicilan Ke-
                                    </label>
                                    <div className="relative mt-1.5">
                                        <input
                                            type="number"
                                            min="1"
                                            value={pinjamanForm.nomorCicilan}
                                            onChange={(e) =>
                                                setPinjamanForm((prev) => ({ ...prev, nomorCicilan: e.target.value }))
                                            }
                                            placeholder="Contoh: 1, 2, 3..."
                                            className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-semibold text-slate-900 shadow-sm outline-none transition focus:border-sky-500"
                                        />
                                        {pinjamanForm.nomorCicilan && (
                                            <span className="absolute right-3 top-2 rounded bg-sky-100 px-2 py-0.5 text-xs font-bold text-sky-800">
                                                Otomatis: Cicilan ke-{pinjamanForm.nomorCicilan}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {pinjamanError && (
                                    <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 md:col-span-2">
                                        {pinjamanError}
                                    </div>
                                )}

                                {(() => {
                                    const selectedPinjaman = pinjamanList.find((p) => String(p.id) === pinjamanForm.pinjamanId)
                                    const selectedPaidCount = selectedPinjaman?.paidCount ?? selectedPinjaman?.pembayaran?.length ?? 0
                                    const selectedTenor = selectedPinjaman?.tenor || 12
                                    const selectedIsDone = Boolean(selectedPinjaman?.isLunas || (selectedTenor > 0 && selectedPaidCount >= selectedTenor))

                                    return (
                                        <div className="flex justify-end md:col-span-2">
                                            <button
                                                type="submit"
                                                disabled={pinjamanSubmitting || loading || selectedIsDone}
                                                className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                                            >
                                                <Banknote className="h-4 w-4" />
                                                {selectedIsDone
                                                    ? 'Sudah Lunas (Done)'
                                                    : pinjamanSubmitting
                                                    ? 'Menyimpan...'
                                                    : `Catat Pembayaran Cicilan ke-${pinjamanForm.nomorCicilan || 1}`}
                                            </button>
                                        </div>
                                    )
                                })()}
                            </form>
                        </div>

                        {/* Tabel Riwayat Transaksi Pembayaran Pinjaman */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">
                                        Riwayat Pembayaran Angsuran Pinjaman
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Daftar seluruh transaksi setoran cicilan pinjaman nasabah.
                                    </p>
                                </div>

                                {/* Filters */}
                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                        <input
                                            type="text"
                                            value={searchPinjaman}
                                            onChange={(e) => setSearchPinjaman(e.target.value)}
                                            placeholder="Cari nama nasabah..."
                                            className="w-48 rounded-lg border border-slate-300 py-1.5 pl-9 pr-3 text-xs outline-none focus:border-sky-500 md:w-56"
                                        />
                                    </div>

                                    <select
                                        value={filterStatusPinjaman}
                                        onChange={(e) => setFilterStatusPinjaman(e.target.value as any)}
                                        className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:border-sky-500"
                                    >
                                        <option value="semua">Semua Status</option>
                                        <option value="lancar">Lancar</option>
                                        <option value="telat">Telat</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mt-4 overflow-x-auto">
                                <table className="min-w-full text-left text-sm text-slate-700">
                                    <thead>
                                        <tr className="border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
                                            <th className="px-3 py-3">ID Bayar</th>
                                            <th className="px-3 py-3">Nama Nasabah</th>
                                            <th className="px-3 py-3">ID Pinjaman</th>
                                            <th className="px-3 py-3">Cicilan Ke-</th>
                                            <th className="px-3 py-3">Jumlah Bayar</th>
                                            <th className="px-3 py-3">Tanggal Pembayaran</th>
                                            <th className="px-3 py-3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={7} className="py-8 text-center text-slate-400">
                                                    Memuat pembayaran pinjaman...
                                                </td>
                                            </tr>
                                        ) : filteredPinjaman.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="py-8 text-center text-slate-500">
                                                    Belum ada transaksi pembayaran pinjaman yang tercatat.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredPinjaman.map((row) => (
                                                <tr key={row.id} className="hover:bg-slate-50/80 transition">
                                                    <td className="px-3 py-3 font-mono text-xs text-slate-500">
                                                        #{row.id}
                                                    </td>
                                                    <td className="px-3 py-3 font-semibold text-slate-900">
                                                        {row.namaNasabah}
                                                    </td>
                                                    <td className="px-3 py-3 font-mono text-xs text-slate-600">
                                                        Pinjaman #{row.pinjamanId}
                                                    </td>
                                                    <td className="px-3 py-3 font-bold text-sky-700 text-xs">
                                                        {row.nomorCicilan ? `Cicilan ke-${row.nomorCicilan}` : '-'}
                                                    </td>
                                                    <td className="px-3 py-3 font-bold text-slate-900">
                                                        {formatCurrency(row.jumlahBayar)}
                                                    </td>
                                                    <td className="px-3 py-3 text-slate-600">
                                                        {formatDate(row.tanggalBayar)}
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        <span
                                                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                                                row.statusBayar?.toLowerCase() === 'lancar'
                                                                    ? 'bg-emerald-100 text-emerald-800'
                                                                    : 'bg-rose-100 text-rose-800'
                                                            }`}
                                                        >
                                                            {row.statusBayar}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default function TransaksiPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-slate-500">Memuat transaksi...</div>}>
            <TransaksiContent />
        </Suspense>
    )
}
