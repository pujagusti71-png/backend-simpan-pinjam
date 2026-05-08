export class CreateRiwayatKreditDto {
    nasabahId: number;
    totalPinjamanAktif: number;
    statusBI: 'aman' | 'bermasalah';
    kolektibilitas: string;
    pernahMacet: boolean;
}
