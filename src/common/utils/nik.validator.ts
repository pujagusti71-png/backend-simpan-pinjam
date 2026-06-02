/**
 * NIK (Nomor Induk Kependudukan) Validation Utility
 * Indonesian National ID number validation
 */

/**
 * Validate NIK format and checksum
 * NIK format: PPKKTTHHGGBBPPPPC
 * PP = Province code (01-34)
 * KK = District code (01-99)
 * TT = Date of birth (01-31)
 * HH = Month of birth (01-12, or 41-52 for female)
 * GG = Year of birth (00-99)
 * BBP = Birth sequence number
 * PPC = Police code
 * C = Control digit
 */
export class NIKValidator {
    /**
     * Check if NIK format is valid (16 digits)
     */
    static isValidFormat(nik: string): boolean {
        return /^\d{16}$/.test(nik.trim());
    }

    /**
     * Validate NIK checksum using Luhn algorithm
     */
    static validateChecksum(nik: string): boolean {
        if (!this.isValidFormat(nik)) {
            return false;
        }

        const nikArray = nik.trim().split('').map(Number);
        const weights = [2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4, 5, 6, 7, 8];

        let sum = 0;
        for (let i = 0; i < 15; i++) {
            let result = nikArray[i] * weights[i];
            sum += Math.floor(result / 10) + (result % 10);
        }

        const checkDigit = (10 - (sum % 10)) % 10;
        return checkDigit === nikArray[15];
    }

    /**
     * Extract birth date from NIK
     */
    static extractBirthDate(nik: string): { date: Date | null; error?: string } {
        if (!this.isValidFormat(nik)) {
            return { date: null, error: 'Format NIK tidak valid' };
        }

        const day = parseInt(nik.substring(6, 8), 10);
        let month = parseInt(nik.substring(8, 10), 10);
        const year = parseInt(nik.substring(10, 12), 10);

        // Handle female month codes (41-52 = 01-12)
        if (month > 40) {
            month -= 40;
        }

        // Validate date values
        if (day < 1 || day > 31) {
            return { date: null, error: 'Tanggal lahir tidak valid' };
        }
        if (month < 1 || month > 12) {
            return { date: null, error: 'Bulan lahir tidak valid' };
        }

        // Determine full year (assume 1900-1999 for year 00-99)
        const fullYear = year < 50 ? 2000 + year : 1900 + year;

        try {
            const birthDate = new Date(fullYear, month - 1, day);
            if (birthDate.getMonth() !== month - 1) {
                return { date: null, error: 'Tanggal lahir tidak valid' };
            }
            return { date: birthDate };
        } catch {
            return { date: null, error: 'Error parsing tanggal' };
        }
    }

    /**
     * Get gender from NIK (based on month code)
     */
    static getGender(nik: string): 'LAKI-LAKI' | 'PEREMPUAN' | null {
        if (!this.isValidFormat(nik)) {
            return null;
        }

        const month = parseInt(nik.substring(8, 10), 10);
        return month > 40 ? 'PEREMPUAN' : 'LAKI-LAKI';
    }

    /**
     * Full NIK validation (format + checksum)
     */
    static validate(nik: string): { valid: boolean; error?: string } {
        if (!this.isValidFormat(nik)) {
            return { valid: false, error: 'Format NIK harus 16 digit angka' };
        }

        if (!this.validateChecksum(nik)) {
            return { valid: false, error: 'Checksum NIK tidak valid' };
        }

        const birthDateResult = this.extractBirthDate(nik);
        if (!birthDateResult.date) {
            return { valid: false, error: birthDateResult.error };
        }

        return { valid: true };
    }

    /**
     * Get detailed NIK information
     */
    static getDetailedInfo(nik: string): {
        valid: boolean;
        nikFormatted?: string;
        gender?: string;
        birthDate?: string;
        age?: number;
        error?: string;
    } {
        const validation = this.validate(nik);

        if (!validation.valid) {
            return { valid: false, error: validation.error };
        }

        const gender = this.getGender(nik);
        const birthDateResult = this.extractBirthDate(nik);
        const birthDate = birthDateResult.date;

        const age = birthDate
            ? Math.floor((new Date().getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
            : undefined;

        return {
            valid: true,
            nikFormatted: `${nik.substring(0, 6)}-${nik.substring(6, 12)}-${nik.substring(12, 16)}`,
            gender: gender || undefined,
            birthDate: birthDate?.toISOString().split('T')[0],
            age,
        };
    }
}
