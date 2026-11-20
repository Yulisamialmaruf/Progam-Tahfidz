export type Jenjang =
  | 'RA A'
  | 'RA B'
  | 'MI Kelas 1'
  | 'MI Kelas 2'
  | 'MI Kelas 3'
  | 'MI Kelas 4'
  | 'MI Kelas 5'
  | 'MI Kelas 6';

export const ALL_JENJANG: Jenjang[] = [
  'RA A',
  'RA B',
  'MI Kelas 1',
  'MI Kelas 2',
  'MI Kelas 3',
  'MI Kelas 4',
  'MI Kelas 5',
  'MI Kelas 6',
];

export type Semester = 1 | 2;

export type UserRole = 'admin' | 'kepala_program' | 'wali_kelas' | 'orang_tua';

export type KategoriMateri = 'Juz 30' | 'Doa Harian';

export type StatusCapaian = 'Tuntas / Lancar' | "Perlu Muraja'ah" | 'Sedang Proses';

export type HariSetoran = 'Senin' | 'Selasa' | 'Rabu' | 'Kamis';

export type PredikatNilai = 'Mumtaz (A)' | 'Jayyid Jiddan (B)' | 'Jayyid (C)' | 'Perlu Bimbingan (D)';

export interface InstitutionSettings {
  namaYayasan: string;
  aktaNotaris: string;
  namaMadrasah: string;
  alamat: string;
  kontak: string;
  logoUrl: string;
  tahunAjaranAktif: string;
  semesterAktif: Semester;
  namaKepalaMadrasah: string;
  kotaRapor: string;
}

export interface AudioTrack {
  title: string;
  subtitle?: string;
  audioUrl: string;
  audioLabel?: string;
  teksArab?: string;
  arti?: string;
}

export interface MateriItem {
  id: string;
  kategori: KategoriMateri;
  judul: string;
  subJudul: string;
  jenjang: Jenjang;
  semester: Semester;
  urutan: number;
  teksArab: string;
  arti: string;
  catatanTajwid: string;
  audioUrl?: string;
  audioLabel?: string;
  audioPlaylist?: AudioTrack[];
}

export interface Teacher {
  id: string;
  nama: string;
  role: 'kepala_program' | 'wali_kelas';
  loginId: string;
  pin: string;
  jenjangAmpuan: Jenjang[];
  semesterAktif: Semester;
  noHp: string;
  fotoUrl?: string;
  aktif: boolean;
}

export interface Student {
  id: string;
  nis: string;
  nama: string;
  jenjang: Jenjang;
  semester: Semester;
  tahunAjaran: string;
  namaOrangTua: string;
  noHpOrangTua: string;
  loginId: string;
  pin: string;
  fotoUrl?: string;
  waliKelasId: string;
}

export interface DailyLog {
  id: string;
  studentId: string;
  semester: Semester;
  tahunAjaran: string;
  tanggal: string;
  hari: HariSetoran;
  mingguKe: number;
  materiId: string;
  bagianAyat: string;
  status: StatusCapaian;
  nilai: number;
  predikat: PredikatNilai;
  catatan: string;
  evaluatorId: string;
  evaluatorName: string;
  createdAt: string;
}

export interface WeeklyEvaluation {
  id: string;
  studentId: string;
  semester: Semester;
  tahunAjaran: string;
  tanggalJumat: string;
  mingguKe: number;
  statusUmum: StatusCapaian;
  nilaiKelancaran: number;
  nilaiTajwid: number;
  nilaiAdab: number;
  nilaiAkhir: number;
  targetMurajaah: string;
  catatanJumat: string;
  evaluatorId: string;
  evaluatorName: string;
  createdAt: string;
}

export interface MonthlyEvaluation {
  id: string;
  studentId: string;
  semester: Semester;
  tahunAjaran: string;
  bulan: string;
  bulanIndex: number;
  capaianJuz30Persen: number;
  capaianDoaPersen: number;
  nilaiRataRata: number;
  statusBulanan: StatusCapaian;
  rekomendasi: string;
  evaluatorId: string;
  evaluatorName: string;
  createdAt: string;
}

export interface AppDatabase {
  adminConfig: {
    adminId: string;
    adminPassword: string;
    adminName: string;
  };
  settings: InstitutionSettings;
  materials: MateriItem[];
  teachers: Teacher[];
  students: Student[];
  dailyLogs: DailyLog[];
  weeklyEvals: WeeklyEvaluation[];
  monthlyEvals: MonthlyEvaluation[];
}

export interface AuthUser {
  id: string;
  loginId: string;
  nama: string;
  role: UserRole;
  fotoUrl?: string;
  jenjangAmpuan?: Jenjang[];
  studentId?: string;
}

export interface BootstrapPayload {
  settings: InstitutionSettings;
  materials: MateriItem[];
  teachers: Omit<Teacher, 'pin'>[];
  students: Omit<Student, 'pin'>[];
  dailyLogs: DailyLog[];
  weeklyEvals: WeeklyEvaluation[];
  monthlyEvals: MonthlyEvaluation[];
  adminInfo?: {
    adminId: string;
    adminName: string;
  };
  rawTeachers?: Teacher[];
  rawStudents?: Student[];
}
