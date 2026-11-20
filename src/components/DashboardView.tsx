import { BookOpen, CalendarCheck2, FileSpreadsheet, GraduationCap, Users } from 'lucide-react';
import {
  ALL_JENJANG,
  type AuthUser,
  type DailyLog,
  type InstitutionSettings,
  type Jenjang,
  type MateriItem,
  type MonthlyEvaluation,
  type Semester,
  type Student,
  type Teacher,
  type WeeklyEvaluation,
} from '../types';
import { Avatar } from './Avatar';
import { StatusText } from './StatusText';

export type NavSection =
  | 'dashboard'
  | 'materi'
  | 'harian'
  | 'evaluasi'
  | 'rapor'
  | 'manajemen';

interface DashboardViewProps {
  user: AuthUser;
  settings: InstitutionSettings;
  semesterFilter: Semester;
  students: Omit<Student, 'pin'>[];
  teachers: Omit<Teacher, 'pin'>[];
  materials: MateriItem[];
  dailyLogs: DailyLog[];
  weeklyEvals: WeeklyEvaluation[];
  monthlyEvals: MonthlyEvaluation[];
  onNavigate: (section: NavSection) => void;
}

export function DashboardView({
  user,
  settings,
  semesterFilter,
  students,
  teachers,
  materials,
  dailyLogs,
  weeklyEvals,
  monthlyEvals,
  onNavigate,
}: DashboardViewProps) {
  // Parent / Student Dedicated Dashboard
  if (user.role === 'orang_tua') {
    const child = students.find((s) => s.id === user.studentId) || students[0];
    const wali = teachers.find((t) => t.id === child?.waliKelasId);
    const childLogs = dailyLogs.filter(
      (l) => l.studentId === child?.id && l.semester === semesterFilter,
    );
    const childWeekly = weeklyEvals.filter(
      (w) => w.studentId === child?.id && w.semester === semesterFilter,
    );
    const childMonthly = monthlyEvals.filter(
      (m) => m.studentId === child?.id && m.semester === semesterFilter,
    );
    const latestMonth = childMonthly[childMonthly.length - 1];
    const latestWeek = childWeekly[0];
    const childMaterials = materials.filter(
      (m) => m.jenjang === child?.jenjang && m.semester === semesterFilter,
    );

    const avgScore = childLogs.length
      ? Math.round(childLogs.reduce((acc, c) => acc + c.nilai, 0) / childLogs.length)
      : latestWeek?.nilaiAkhir || 0;

    return (
      <div className="space-y-6">
        {/* Student Identity Banner */}
        <section className="bg-white rounded-2xl border border-[#E5E7EB] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <Avatar name={child?.nama || 'Murid'} src={child?.fotoUrl} size="xl" shape="rounded" />
            <div>
              <p className="text-xs font-medium text-[#52605A]">
                {child?.jenjang} · Semester {semesterFilter} · TA {settings.tahunAjaranAktif}
              </p>
              <h2 className="text-xl sm:text-2xl font-bold text-[#1A2420] mt-0.5">
                {child?.nama || 'Data Murid'}
              </h2>
              <p className="text-xs text-[#52605A] mt-1">
                NIS <span className="font-mono tabular-nums">{child?.nis}</span> · Pembimbing: {wali?.nama || '-'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => onNavigate('materi')}
              className="px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAF8F5] text-xs font-semibold text-[#1A2420] hover:bg-[#F3F6F4] cursor-pointer whitespace-nowrap"
            >
              Putar Materi &amp; Audio
            </button>
            <button
              type="button"
              onClick={() => onNavigate('rapor')}
              className="px-4 py-2.5 rounded-xl bg-[#14532D] text-xs font-semibold text-white hover:bg-[#14532D] cursor-pointer whitespace-nowrap"
            >
              Lihat &amp; Cetak Rapor
            </button>
          </div>
        </section>

        {/* 4 Summary Metrics */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
            <p className="text-xs font-medium text-[#52605A]">Progres Juz 30</p>
            <p className="text-2xl font-bold text-[#14532D] tabular-nums mt-2">
              {latestMonth?.capaianJuz30Persen ?? 0}%
            </p>
            <div className="w-full h-1.5 rounded-full bg-[#E5E7EB] mt-3 overflow-hidden">
              <div
                className="h-full bg-[#14532D] rounded-full"
                style={{ width: `${latestMonth?.capaianJuz30Persen ?? 0}%` }}
              />
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
            <p className="text-xs font-medium text-[#52605A]">Progres Doa Harian</p>
            <p className="text-2xl font-bold text-[#C59B27] tabular-nums mt-2">
              {latestMonth?.capaianDoaPersen ?? 0}%
            </p>
            <div className="w-full h-1.5 rounded-full bg-[#E5E7EB] mt-3 overflow-hidden">
              <div
                className="h-full bg-[#C59B27] rounded-full"
                style={{ width: `${latestMonth?.capaianDoaPersen ?? 0}%` }}
              />
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
            <p className="text-xs font-medium text-[#52605A]">Rata-Rata Nilai</p>
            <p className="text-2xl font-bold text-[#1A2420] tabular-nums mt-2">
              {avgScore}
            </p>
            <p className="text-xs text-[#52605A] mt-2">
              {childLogs.length} setoran tercatat
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
            <p className="text-xs font-medium text-[#52605A]">Target Materi Semester {semesterFilter}</p>
            <p className="text-2xl font-bold text-[#1A2420] tabular-nums mt-2">
              {childMaterials.length}
            </p>
            <p className="text-xs text-[#52605A] mt-2">Surah &amp; Doa terstruktur</p>
          </div>
        </section>

        {/* Latest Weekly Evaluation & Recent Daily Logs */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#1A2420]">
                Evaluasi Jum’at Terbaru
              </h3>
              {latestWeek && <StatusText status={latestWeek.statusUmum} />}
            </div>
            {latestWeek ? (
              <div className="space-y-3 text-sm">
                <p className="text-xs text-[#52605A]">
                  Minggu ke-{latestWeek.mingguKe} · {latestWeek.tanggalJumat}
                </p>
                <div className="grid grid-cols-3 gap-2 py-3 border-y border-[#E5E7EB] text-center">
                  <div>
                    <p className="text-[11px] text-[#52605A]">Kelancaran</p>
                    <p className="text-lg font-bold tabular-nums text-[#1A2420]">
                      {latestWeek.nilaiKelancaran}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-[#52605A]">Tajwid</p>
                    <p className="text-lg font-bold tabular-nums text-[#1A2420]">
                      {latestWeek.nilaiTajwid}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-[#52605A]">Adab</p>
                    <p className="text-lg font-bold tabular-nums text-[#1A2420]">
                      {latestWeek.nilaiAdab}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#1A2420]">Target Muraja’ah</p>
                  <p className="text-xs text-[#52605A] mt-0.5">{latestWeek.targetMurajaah}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#1A2420]">Catatan Pembimbing</p>
                  <p className="text-xs text-[#52605A] mt-0.5 leading-relaxed">
                    {latestWeek.catatanJumat}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[#52605A]">
                Belum ada evaluasi mingguan pada semester ini.
              </p>
            )}
          </div>

          <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E5E7EB] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#1A2420]">
                Riwayat Setoran Harian (Senin–Kamis)
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('harian')}
                className="text-xs font-semibold text-[#14532D] hover:underline cursor-pointer"
              >
                Lihat Semua
              </button>
            </div>
            {childLogs.length > 0 ? (
              <div className="divide-y divide-[#E5E7EB]">
                {childLogs.slice(0, 5).map((log) => {
                  const mat = materials.find((m) => m.id === log.materiId);
                  return (
                    <div key={log.id} className="py-3 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#1A2420] truncate">
                          {mat?.judul || 'Materi Tahfidz'} · {log.bagianAyat}
                        </p>
                        <p className="text-xs text-[#52605A] mt-0.5">
                          {log.hari}, {log.tanggal} · {log.catatan}
                        </p>
                      </div>
                      <div className="text-right shrink-0 space-y-1">
                        <p className="text-sm font-bold tabular-nums text-[#1A2420]">{log.nilai}</p>
                        <StatusText status={log.status} compact />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-[#52605A]">Belum ada catatan setoran harian.</p>
            )}
          </div>
        </section>
      </div>
    );
  }

  // Staff / Teacher / Kepala Program / Admin Dashboard
  const allowedJenjang: Jenjang[] =
    user.role === 'wali_kelas' && user.jenjangAmpuan?.length
      ? user.jenjangAmpuan
      : ALL_JENJANG;

  const visibleStudents = students.filter((s) => allowedJenjang.includes(s.jenjang));
  const visibleLogs = dailyLogs.filter((l) => {
    const st = visibleStudents.find((s) => s.id === l.studentId);
    return Boolean(st) && l.semester === semesterFilter;
  });
  const visibleWeekly = weeklyEvals.filter((w) => {
    const st = visibleStudents.find((s) => s.id === w.studentId);
    return Boolean(st) && w.semester === semesterFilter;
  });

  const tuntasCount = visibleLogs.filter((l) => l.status === 'Tuntas / Lancar').length;
  const avgSchoolScore = visibleLogs.length
    ? Math.round(visibleLogs.reduce((acc, l) => acc + l.nilai, 0) / visibleLogs.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Top Action Strip */}
      <section className="bg-white rounded-2xl border border-[#E5E7EB] p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[#52605A]">
            {settings.namaMadrasah} · Semester {semesterFilter} · TA {settings.tahunAjaranAktif}
          </p>
          <h2 className="text-xl sm:text-2xl font-bold text-[#1A2420] mt-0.5">
            Assalamu’alaikum, {user.nama}
          </h2>
          <p className="text-xs text-[#52605A] mt-1">
            {user.role === 'kepala_program'
              ? 'Hak akses penuh untuk memantau dan menilai seluruh jenjang (RA A, RA B, MI Kelas 1–6).'
              : user.role === 'wali_kelas'
              ? `Fokus bimbingan kelas: ${allowedJenjang.join(', ')}.`
              : 'Administrator Madrasah · Pengelolaan penuh data guru, murid, akun ID, materi, dan rapor.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => onNavigate('harian')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#14532D] text-white text-xs font-semibold hover:bg-[#14532D] cursor-pointer whitespace-nowrap"
          >
            <CalendarCheck2 className="w-4 h-4" />
            Input Setoran Senin–Kamis
          </button>
          <button
            type="button"
            onClick={() => onNavigate('evaluasi')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAF8F5] text-[#1A2420] text-xs font-semibold hover:bg-[#F3F6F4] cursor-pointer whitespace-nowrap"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#C59B27]" />
            Evaluasi Jum’at
          </button>
        </div>
      </section>

      {/* 4 KPI Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
          <div className="flex items-center justify-between text-xs font-medium text-[#52605A]">
            <span>Total Murid Binaan</span>
            <GraduationCap className="w-4 h-4 text-[#14532D]" />
          </div>
          <p className="text-2xl font-bold text-[#1A2420] tabular-nums mt-2">
            {visibleStudents.length}
          </p>
          <p className="text-xs text-[#52605A] mt-1">
            {allowedJenjang.length} jenjang aktif
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
          <div className="flex items-center justify-between text-xs font-medium text-[#52605A]">
            <span>Setoran Tercatat</span>
            <CalendarCheck2 className="w-4 h-4 text-[#14532D]" />
          </div>
          <p className="text-2xl font-bold text-[#1A2420] tabular-nums mt-2">
            {visibleLogs.length}
          </p>
          <p className="text-xs text-[#15803D] font-medium mt-1 tabular-nums">
            {tuntasCount} tuntas / lancar
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
          <div className="flex items-center justify-between text-xs font-medium text-[#52605A]">
            <span>Rata-Rata Nilai</span>
            <FileSpreadsheet className="w-4 h-4 text-[#C59B27]" />
          </div>
          <p className="text-2xl font-bold text-[#14532D] tabular-nums mt-2">
            {avgSchoolScore}
          </p>
          <p className="text-xs text-[#52605A] mt-1 tabular-nums">
            {visibleWeekly.length} evaluasi Jum’at
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
          <div className="flex items-center justify-between text-xs font-medium text-[#52605A]">
            <span>Bank Materi &amp; Guru</span>
            <BookOpen className="w-4 h-4 text-[#C59B27]" />
          </div>
          <p className="text-2xl font-bold text-[#1A2420] tabular-nums mt-2">
            {materials.length}
          </p>
          <p className="text-xs text-[#52605A] mt-1 tabular-nums">
            {teachers.length} pembimbing aktif
          </p>
        </div>
      </section>

      {/* Progress Per Jenjang + Recent Activity */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E5E7EB] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-[#1A2420]">
              Rekap Capaian Per Jenjang (Semester {semesterFilter})
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('rapor')}
              className="text-xs font-semibold text-[#14532D] hover:underline cursor-pointer"
            >
              Buka Rapor
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5E7EB] text-[11px] font-semibold text-[#52605A]">
                  <th className="py-2.5 pr-3">Jenjang</th>
                  <th className="py-2.5 px-3 text-right">Murid</th>
                  <th className="py-2.5 px-3 text-right">Materi</th>
                  <th className="py-2.5 px-3 text-right">Rata Nilai</th>
                  <th className="py-2.5 pl-3">Status Dominan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] text-xs">
                {allowedJenjang.map((jenjang) => {
                  const jStudents = visibleStudents.filter((s) => s.jenjang === jenjang);
                  const jMaterials = materials.filter(
                    (m) => m.jenjang === jenjang && m.semester === semesterFilter,
                  );
                  const jLogs = visibleLogs.filter((l) =>
                    jStudents.some((s) => s.id === l.studentId),
                  );
                  const jAvg = jLogs.length
                    ? Math.round(jLogs.reduce((a, b) => a + b.nilai, 0) / jLogs.length)
                    : 0;
                  const statusDom =
                    jAvg >= 85
                      ? 'Tuntas / Lancar'
                      : jAvg >= 70
                      ? "Perlu Muraja'ah"
                      : 'Sedang Proses';
                  return (
                    <tr key={jenjang} className="hover:bg-[#FAF8F5]">
                      <td className="py-3 pr-3 font-semibold text-[#1A2420] whitespace-nowrap">
                        {jenjang}
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums text-[#52605A]">
                        {jStudents.length}
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums text-[#52605A]">
                        {jMaterials.length}
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums font-semibold text-[#1A2420]">
                        {jAvg || '-'}
                      </td>
                      <td className="py-3 pl-3">
                        <StatusText status={statusDom} compact />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E5E7EB] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-[#1A2420]">
              Setoran Harian Terbaru
            </h3>
            <Users className="w-4 h-4 text-[#52605A]" />
          </div>
          {visibleLogs.length > 0 ? (
            <div className="divide-y divide-[#E5E7EB]">
              {visibleLogs.slice(0, 6).map((log) => {
                const st = visibleStudents.find((s) => s.id === log.studentId);
                const mat = materials.find((m) => m.id === log.materiId);
                return (
                  <div key={log.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={st?.nama || 'Murid'} src={st?.fotoUrl} size="sm" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#1A2420] truncate">
                          {st?.nama}
                        </p>
                        <p className="text-[11px] text-[#52605A] truncate">
                          {st?.jenjang} · {mat?.judul} ({log.hari})
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold tabular-nums text-[#1A2420]">{log.nilai}</p>
                      <StatusText status={log.status} compact />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-[#52605A]">Belum ada setoran tercatat.</p>
          )}
        </div>
      </section>
    </div>
  );
}
