export const pekerjaanScoreMap: Record<string, number> = {
    'pns': 100,
    'pegawai bumn': 95,
    'tni/polri': 95,
    'tni': 95,
    'polri': 95,
    'dokter': 95,
    'dosen': 90,
    'guru': 90,
    'perawat': 85,
    'karyawan swasta tetap': 85,
    'pegawai kontrak': 75,
    'wiraswasta': 70,
    'pedagang': 70,
    'petani': 65,
    'nelayan': 65,
    'freelancer': 60,
    'driver ojol': 55,
    'buruh pabrik': 55,
    'buruh harian': 50,
    'buruh lepas': 45,
    'pekerjaan musiman': 40,
    'tidak bekerja': 20,
};

export function calculatePekerjaanScore(pekerjaan?: string): number {
    if (!pekerjaan) return 20;
    const normalized = pekerjaan.trim().toLowerCase();
    return pekerjaanScoreMap[normalized] ?? 20;
}

export function calculatePenghasilanScore(penghasilan: number): number {
    if (penghasilan > 10000000) return 100;
    if (penghasilan >= 8000000) return 90;
    if (penghasilan >= 6000000) return 80;
    if (penghasilan >= 4000000) return 70;
    if (penghasilan >= 3000000) return 60;
    if (penghasilan >= 2000000) return 50;
    if (penghasilan >= 1000000) return 40;
    return 20;
}

export function calculateLamaBekerjaScore(lamaBekerja: number): number {
    if (lamaBekerja > 10) return 100;
    if (lamaBekerja >= 5) return 90;
    if (lamaBekerja >= 3) return 80;
    if (lamaBekerja >= 2) return 70;
    if (lamaBekerja >= 1) return 60;
    if (lamaBekerja >= 0.5) return 50;
    return 30;
}

export function calculateRiwayatPembayaranScore(riwayatPembayaran?: string): number {
    if (!riwayatPembayaran) return 70;
    const normalized = riwayatPembayaran.trim().toLowerCase();
    if (normalized.includes('selalu tepat waktu')) return 100;
    if (normalized.includes('pernah telat 1')) return 80;
    if (normalized.includes('pernah telat 2-3') || normalized.includes('2-3 kali')) return 60;
    if (normalized.includes('sering telat')) return 40;
    if (normalized.includes('pernah gagal bayar')) return 20;
    if (normalized.includes('nasabah baru')) return 70;
    return 70;
}

export function calculateJumlahTanggunganScore(jumlahTanggungan: number): number {
    if (jumlahTanggungan === 0) return 100;
    if (jumlahTanggungan === 1) return 90;
    if (jumlahTanggungan === 2) return 80;
    if (jumlahTanggungan === 3) return 70;
    if (jumlahTanggungan === 4) return 60;
    return 50;
}

export function calculateTotalScore(scores: {
    skorPekerjaan: number;
    skorPenghasilan: number;
    skorLamaBekerja: number;
    skorRiwayat: number;
    skorTanggungan: number;
}): number {
    const total =
        scores.skorPekerjaan * 0.3 +
        scores.skorPenghasilan * 0.25 +
        scores.skorLamaBekerja * 0.15 +
        scores.skorRiwayat * 0.2 +
        scores.skorTanggungan * 0.1;
    return Math.round(total * 100) / 100;
}

export function determineKelayakanStatus(totalSkor: number): string {
    if (totalSkor >= 85) return 'Sangat Layak';
    if (totalSkor >= 70) return 'Layak';
    if (totalSkor >= 55) return 'Dipertimbangkan';
    if (totalSkor >= 40) return 'Risiko Tinggi';
    return 'Ditolak';
}
