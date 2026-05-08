export class UpdateRiwayatKreditDto {
    totalPinjamanAktif?: number;
    statusBI?: 'aman' | 'bermasalah';
    kolektibilitas?: string;
    pernahMacet?: boolean;
}
