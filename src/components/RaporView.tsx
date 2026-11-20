import { useEffect, useMemo, useState } from 'react';
import { Download, FileSpreadsheet, Printer, UserRound } from 'lucide-react';
import {
  ALL_JENJANG,
  type AuthUser,
  type DailyLog,
  type InstitutionSettings,
  type Jenjang,
  type MateriItem,
  type MonthlyEvaluation,
  type PredikatNilai,
  type Semester,
  type StatusCapaian,
  type Student,
  type Teacher,
  type WeeklyEvaluation,
} from '../types';
import { Avatar } from './Avatar';
import { StatusText } from './StatusText';

interface RaporViewProps {
  user: AuthUser;
  settings: InstitutionSettings;
  semesterFilter: Semester;
  students: Omit<Student, 'pin'>[];
  teachers: Omit<Teacher, 'pin'>[];
  materials: MateriItem[];
  dailyLogs: DailyLog[];
  weeklyEvals: WeeklyEvaluation[];
  monthlyEvals: MonthlyEvaluation[];
}

function getPredikat(nilai: number): PredikatNilai {
  if (nilai >= 90) return 'Mumtaz (A)';
  if (nilai >= 80) return 'Jayyid Jiddan (B)';
  if (nilai >= 70) return 'Jayyid (C)';
  return 'Perlu Bimbingan (D)';
}

export function RaporView({
  user,
  settings,
  semesterFilter,
  students,
  teachers,
  materials,
  dailyLogs,
  weeklyEvals,
  monthlyEvals,
}: RaporViewProps) {
  const isParent = user.role === 'orang_tua';
  const allowedJenjang: Jenjang[] =
    user.role === 'wali_kelas' && user.jenjangAmpuan?.length
      ? user.jenjangAmpuan
      : ALL_JENJANG;

  const visibleStudents = useMemo(() => {
    if (isParent) return students.filter((s) => s.id === user.studentId);
    return students.filter((s) => allowedJenjang.includes(s.jenjang));
  }, [students, isParent, user, allowedJenjang]);

  const [mode, setMode] = useState<'rekap' | 'rapor'>('rapor');
  const [jenjangFilter, setJenjangFilter] = useState<'Semua' | Jenjang>('Semua');
  const [raporScope, setRaporScope] = useState<'semester' | 'tahunan'>('semester');

  const filteredStudents = useMemo(() => {
    return visibleStudents.filter((s) =>
      jenjangFilter === 'Semua' ? true : s.jenjang === jenjangFilter,
    );
  }, [visibleStudents, jenjangFilter]);

  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    filteredStudents[0]?.id || '',
  );
  const activeStudent =
    filteredStudents.find((s) => s.id === selectedStudentId) || filteredStudents[0];

  useEffect(() => {
    if (activeStudent && activeStudent.id !== selectedStudentId) {
      setSelectedStudentId(activeStudent.id);
    }
  }, [activeStudent, selectedStudentId]);

  const computeStudentSummary = (student: Omit<Student, 'pin'>) => {
    const sLogs = dailyLogs.filter(
      (l) =>
        l.studentId === student.id &&
        (raporScope === 'tahunan' ? true : l.semester === semesterFilter),
    );
    const sWeekly = weeklyEvals.filter(
      (w) =>
        w.studentId === student.id &&
        (raporScope === 'tahunan' ? true : w.semester === semesterFilter),
    );
    const sMonthly = monthlyEvals
      .filter(
        (m) =>
          m.studentId === student.id &&
          (raporScope === 'tahunan' ? true : m.semester === semesterFilter),
      )
      .sort((a, b) => a.semester - b.semester || a.bulanIndex - b.bulanIndex);

    const lastMo = sMonthly[sMonthly.length - 1];
    const avgNilai = sLogs.length
      ? Math.round(sLogs.reduce((a, b) => a + b.nilai, 0) / sLogs.length)
      : sWeekly[0]?.nilaiAkhir || lastMo?.nilaiRataRata || 0;

    return {
      logsCount: sLogs.length,
      weeklyCount: sWeekly.length,
      juzPersen: lastMo?.capaianJuz30Persen ?? (sLogs.length ? 80 : 0),
      doaPersen: lastMo?.capaianDoaPersen ?? (sLogs.length ? 85 : 0),
      avgNilai,
      predikat: avgNilai > 0 ? getPredikat(avgNilai) : ('Perlu Bimbingan (D)' as PredikatNilai),
      status: (avgNilai >= 85
        ? 'Tuntas / Lancar'
        : avgNilai >= 75
        ? "Perlu Muraja'ah"
        : 'Sedang Proses') as StatusCapaian,
      latestWeekly: sWeekly[0],
      latestMonthly: lastMo,
      logs: sLogs,
    };
  };

  const activeSummary = activeStudent ? computeStudentSummary(activeStudent) : null;
  const activeWali = teachers.find((t) => t.id === activeStudent?.waliKelasId);

  const studentCurriculum = useMemo(() => {
    if (!activeStudent) return { juz30: [], doa: [] };
    const mats = materials.filter(
      (m) =>
        m.jenjang === activeStudent.jenjang &&
        (raporScope === 'tahunan' ? true : m.semester === semesterFilter),
    );
    const allDoa = mats.filter((m) => m.kategori === 'Doa Harian');
    const allJuz = mats.filter((m) => m.kategori === 'Juz 30');
    return { juz30: allJuz, doa: allDoa };
  }, [materials, activeStudent, raporScope, semesterFilter]);

  const getMateriGrade = (materiId: string) => {
    if (!activeStudent) return { nilai: null as number | null, status: 'Sedang Proses' as StatusCapaian };
    const matchedLogs = activeSummary?.logs.filter((l) => l.materiId === materiId) || [];
    if (matchedLogs.length > 0) {
      const avg = Math.round(matchedLogs.reduce((a, b) => a + b.nilai, 0) / matchedLogs.length);
      return { nilai: avg, status: matchedLogs[0].status };
    }
    return {
      nilai: null as number | null,
      status: 'Sedang Proses' as StatusCapaian,
    };
  };

  const exportRecapCsv = () => {
    const header = [
      'NIS',
      'Nama Murid',
      'Jenjang',
      'Periode',
      'Tahun Ajaran',
      'Capaian Juz 30 (%)',
      'Capaian Doa Harian (%)',
      'Rata-rata Nilai',
      'Predikat',
      'Status',
    ];
    const periodeLabel =
      raporScope === 'tahunan' ? 'Semester 1 & 2' : `Semester ${semesterFilter}`;
    const rows = filteredStudents.map((st) => {
      const sum = computeStudentSummary(st);
      return [
        st.nis,
        `"${st.nama.replace(/"/g, '""')}"`,
        st.jenjang,
        periodeLabel,
        settings.tahunAjaranAktif,
        `${sum.juzPersen}`,
        `${sum.doaPersen}`,
        `${sum.avgNilai || '-'}`,
        sum.avgNilai ? sum.predikat : 'Belum Dinilai',
        sum.status,
      ].join(',');
    });
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rekap-tahfidz-${jenjangFilter === 'Semua' ? 'semua-jenjang' : jenjangFilter.toLowerCase().replace(/\s+/g, '-')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const todayFormatted = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="space-y-6">
      {/* Control Toolbar (Hidden on Print) */}
      <section className="no-print bg-white rounded-2xl border border-[#E5E7EB] p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {!isParent && (
            <div className="flex items-center gap-1 p-1 bg-[#FAF8F5] rounded-xl border border-[#E5E7EB]">
              <button
                type="button"
                onClick={() => setMode('rapor')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg cursor-pointer whitespace-nowrap ${
                  mode === 'rapor'
                    ? 'bg-white text-[#14532D] border border-[#E5E7EB]'
                    : 'text-[#52605A]'
                }`}
              >
                <UserRound className="w-3.5 h-3.5" />
                Rapor Murid Resmi
              </button>
              <button
                type="button"
                onClick={() => setMode('rekap')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg cursor-pointer whitespace-nowrap ${
                  mode === 'rekap'
                    ? 'bg-white text-[#14532D] border border-[#E5E7EB]'
                    : 'text-[#52605A]'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Rekapitulasi Kelas
              </button>
            </div>
          )}

          <div className="flex items-center gap-1 p-1 bg-[#FAF8F5] rounded-xl border border-[#E5E7EB]">
            <button
              type="button"
              onClick={() => setRaporScope('semester')}
              className={`px-3 py-2 text-xs font-semibold rounded-lg cursor-pointer whitespace-nowrap ${
                raporScope === 'semester'
                  ? 'bg-white text-[#14532D] border border-[#E5E7EB]'
                  : 'text-[#52605A]'
              }`}
            >
              Semester {semesterFilter}
            </button>
            <button
              type="button"
              onClick={() => setRaporScope('tahunan')}
              className={`px-3 py-2 text-xs font-semibold rounded-lg cursor-pointer whitespace-nowrap ${
                raporScope === 'tahunan'
                  ? 'bg-white text-[#14532D] border border-[#E5E7EB]'
                  : 'text-[#52605A]'
              }`}
            >
              1 Tahun Ajaran (Sem 1 &amp; 2)
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {!isParent && (
            <select
              aria-label="Filter Jenjang"
              value={jenjangFilter}
              onChange={(e) => setJenjangFilter(e.target.value as 'Semua' | Jenjang)}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-[#E5E7EB] bg-[#FAF8F5]"
            >
              <option value="Semua">Semua Jenjang</option>
              {allowedJenjang.map((j) => (
                <option key={j} value={j}>
                  {j}
                </option>
              ))}
            </select>
          )}

          {mode === 'rapor' && !isParent && (
            <select
              aria-label="Pilih Murid"
              value={activeStudent?.id || ''}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-[#E5E7EB] bg-[#FAF8F5]"
            >
              {filteredStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nama} ({s.jenjang})
                </option>
              ))}
            </select>
          )}

          {mode === 'rekap' && !isParent && (
            <button
              type="button"
              onClick={exportRecapCsv}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAF8F5] text-[#1A2420] text-xs font-semibold hover:bg-[#F3F6F4] cursor-pointer whitespace-nowrap"
            >
              <Download className="w-4 h-4 text-[#14532D]" />
              Unduh CSV
            </button>
          )}

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#14532D] text-white text-xs font-semibold hover:bg-[#15803D] cursor-pointer whitespace-nowrap"
          >
            <Printer className="w-4 h-4" />
            Cetak / Simpan PDF
          </button>
        </div>
      </section>

      {/* Class Recap Table Mode */}
      {mode === 'rekap' && !isParent && (
        <section className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden print-sheet">
          <div className="p-6 border-b border-[#E5E7EB]">
            <h3 className="text-base font-bold text-[#1A2420]">
              Rekapitulasi Capaian Tahfidz — {jenjangFilter === 'Semua' ? 'Semua Jenjang' : jenjangFilter}
            </h3>
            <p className="text-xs text-[#52605A] mt-0.5">
              {raporScope === 'tahunan' ? 'Akumulasi Semester 1 & 2' : `Semester ${semesterFilter}`} · Tahun Ajaran {settings.tahunAjaranAktif}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#FAF8F5] text-[11px] font-semibold text-[#52605A]">
                  <th className="py-3 px-4">Murid &amp; NIS</th>
                  <th className="py-3 px-3">Jenjang</th>
                  <th className="py-3 px-3 text-right">Juz 30</th>
                  <th className="py-3 px-3 text-right">Doa Harian</th>
                  <th className="py-3 px-3 text-right">Rata Nilai</th>
                  <th className="py-3 px-3">Predikat</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right no-print">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] text-xs">
                {filteredStudents.map((st) => {
                  const sum = computeStudentSummary(st);
                  return (
                    <tr key={st.id} className="hover:bg-[#FAF8F5]">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={st.nama} src={st.fotoUrl} size="sm" />
                          <div>
                            <p className="font-semibold text-[#1A2420]">{st.nama}</p>
                            <p className="text-[11px] font-mono tabular-nums text-[#52605A]">
                              NIS {st.nis}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-medium text-[#1A2420] whitespace-nowrap">
                        {st.jenjang}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-[#14532D]">
                        {sum.juzPersen}%
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-[#C59B27]">
                        {sum.doaPersen}%
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-[#1A2420]">
                        {sum.avgNilai || '-'}
                      </td>
                      <td className="py-3 px-3 text-[#52605A] whitespace-nowrap">
                        {sum.avgNilai ? sum.predikat : 'Belum Dinilai'}
                      </td>
                      <td className="py-3 px-3">
                        <StatusText status={sum.status} compact />
                      </td>
                      <td className="py-3 px-4 text-right no-print">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStudentId(st.id);
                            setMode('rapor');
                          }}
                          className="text-xs font-semibold text-[#14532D] hover:underline cursor-pointer whitespace-nowrap"
                        >
                          Buka Rapor
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Official Printable Student Rapor Mode */}
      {mode === 'rapor' && activeStudent && activeSummary && (
        <article className="bg-white rounded-2xl border border-[#E5E7EB] p-6 sm:p-10 max-w-4xl mx-auto print-sheet space-y-6">
          {/* Official Kop Laporan Yayasan Miftahul Huda Al Ma'ruf */}
          <header className="border-b-[3px] border-double border-[#1A2420] pb-4 flex items-center gap-4 sm:gap-6">
            <img
              src={settings.logoUrl || '/assets/aistudio/1000435209_80ac9f58.png'}
              alt="Logo Yayasan Miftahul Huda Al Ma'ruf"
              referrerPolicy="no-referrer"
              className="w-16 h-16 sm:w-22 sm:h-22 object-contain shrink-0"
            />
            <div className="flex-1 text-center space-y-0.5">
              <p className="text-sm sm:text-base font-bold tracking-wide text-[#14532D]">
                {settings.namaYayasan}
              </p>
              <p className="text-[10px] sm:text-[11px] font-semibold text-[#1A2420]">
                {settings.aktaNotaris}
              </p>
              <h1 className="text-base sm:text-xl font-extrabold tracking-tight text-[#1A2420]">
                {settings.namaMadrasah}
              </h1>
              <p className="text-[10px] sm:text-[11px] text-[#374151] leading-snug">
                {settings.alamat}, {settings.kontak}
              </p>
            </div>
          </header>

          {/* Rapor Title */}
          <div className="text-center space-y-1">
            <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider text-[#1A2420]">
              Laporan Capaian Program Tahfidz Al-Qur’an &amp; Doa Harian
            </h2>
            <p className="text-xs text-[#52605A]">
              {raporScope === 'tahunan'
                ? 'Rekapitulasi 2 Semester (Semester 1 & Semester 2)'
                : `Semester ${semesterFilter === 1 ? '1 (Ganjil)' : '2 (Genap)'}`}{' '}
              · Tahun Ajaran {settings.tahunAjaranAktif}
            </p>
          </div>

          {/* Student Identity & Photo */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-[#E5E7EB] bg-[#FAF8F5]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5 text-xs flex-1">
              <div className="flex gap-2">
                <span className="text-[#52605A] w-28 shrink-0">Nama Murid</span>
                <span className="font-bold text-[#1A2420]">: {activeStudent.nama}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-[#52605A] w-28 shrink-0">Jenjang / Kelas</span>
                <span className="font-bold text-[#1A2420]">: {activeStudent.jenjang}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-[#52605A] w-28 shrink-0">Nomor Induk</span>
                <span className="font-mono tabular-nums text-[#1A2420]">: {activeStudent.nis}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-[#52605A] w-28 shrink-0">Wali Kelas</span>
                <span className="text-[#1A2420]">: {activeWali?.nama || '-'}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-[#52605A] w-28 shrink-0">Orang Tua / Wali</span>
                <span className="text-[#1A2420]">: {activeStudent.namaOrangTua}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-[#52605A] w-28 shrink-0">Predikat Akhir</span>
                <span className="font-bold text-[#14532D]">
                  : {activeSummary.avgNilai ? `${activeSummary.avgNilai} (${activeSummary.predikat})` : 'Belum Dinilai'}
                </span>
              </div>
            </div>
            <Avatar
              name={activeStudent.nama}
              src={activeStudent.fotoUrl}
              size="xl"
              shape="rounded"
            />
          </div>

          {/* Section A: Juz 30 */}
          <section className="space-y-2 print-break-inside-avoid">
            <h3 className="text-xs font-bold uppercase tracking-wide text-[#14532D]">
              A. Capaian Hafalan Al-Qur’an Juz 30
            </h3>
            <table className="w-full text-left border-collapse border border-[#D1D5DB] text-xs">
              <thead>
                <tr className="bg-[#FAF8F5] text-[#1A2420]">
                  <th className="border border-[#D1D5DB] py-2 px-3 w-10 text-center">No</th>
                  <th className="border border-[#D1D5DB] py-2 px-3">Materi Surah</th>
                  <th className="border border-[#D1D5DB] py-2 px-3">Semester</th>
                  <th className="border border-[#D1D5DB] py-2 px-3 text-right">Nilai</th>
                  <th className="border border-[#D1D5DB] py-2 px-3">Predikat</th>
                  <th className="border border-[#D1D5DB] py-2 px-3">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {studentCurriculum.juz30.length > 0 ? (
                  studentCurriculum.juz30.map((mat, i) => {
                    const g = getMateriGrade(mat.id);
                    return (
                      <tr key={mat.id}>
                        <td className="border border-[#D1D5DB] py-2 px-3 text-center tabular-nums">
                          {i + 1}
                        </td>
                        <td className="border border-[#D1D5DB] py-2 px-3 font-medium">
                          {mat.judul}{' '}
                          <span className="text-[#52605A] font-normal">({mat.subJudul})</span>
                        </td>
                        <td className="border border-[#D1D5DB] py-2 px-3 tabular-nums">
                          Sem {mat.semester}
                        </td>
                        <td className="border border-[#D1D5DB] py-2 px-3 text-right font-mono tabular-nums font-bold">
                          {g.nilai ?? '-'}
                        </td>
                        <td className="border border-[#D1D5DB] py-2 px-3">
                          {g.nilai !== null ? getPredikat(g.nilai) : 'Belum Dinilai'}
                        </td>
                        <td className="border border-[#D1D5DB] py-2 px-3">
                          <StatusText status={g.status} compact />
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="border border-[#D1D5DB] py-3 px-3 text-center text-[#52605A]">
                      Belum ada pemetaan surah untuk semester ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          {/* Section B: Doa Harian & Ibadah */}
          <section className="space-y-2 print-break-inside-avoid">
            <h3 className="text-xs font-bold uppercase tracking-wide text-[#14532D]">
              B. Capaian Doa Harian &amp; Bacaan Ibadah
            </h3>
            <table className="w-full text-left border-collapse border border-[#D1D5DB] text-xs">
              <thead>
                <tr className="bg-[#FAF8F5] text-[#1A2420]">
                  <th className="border border-[#D1D5DB] py-2 px-3 w-10 text-center">No</th>
                  <th className="border border-[#D1D5DB] py-2 px-3">Materi Doa / Bacaan Ibadah</th>
                  <th className="border border-[#D1D5DB] py-2 px-3">Semester</th>
                  <th className="border border-[#D1D5DB] py-2 px-3 text-right">Nilai</th>
                  <th className="border border-[#D1D5DB] py-2 px-3">Predikat</th>
                  <th className="border border-[#D1D5DB] py-2 px-3">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {studentCurriculum.doa.length > 0 ? (
                  studentCurriculum.doa.map((mat, i) => {
                    const g = getMateriGrade(mat.id);
                    return (
                      <tr key={mat.id}>
                        <td className="border border-[#D1D5DB] py-2 px-3 text-center tabular-nums">
                          {i + 1}
                        </td>
                        <td className="border border-[#D1D5DB] py-2 px-3 font-medium">
                          {mat.judul}
                        </td>
                        <td className="border border-[#D1D5DB] py-2 px-3 tabular-nums">
                          Sem {mat.semester}
                        </td>
                        <td className="border border-[#D1D5DB] py-2 px-3 text-right font-mono tabular-nums font-bold">
                          {g.nilai ?? '-'}
                        </td>
                        <td className="border border-[#D1D5DB] py-2 px-3">
                          {g.nilai !== null ? getPredikat(g.nilai) : 'Belum Dinilai'}
                        </td>
                        <td className="border border-[#D1D5DB] py-2 px-3">
                          <StatusText status={g.status} compact />
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="border border-[#D1D5DB] py-3 px-3 text-center text-[#52605A]">
                      Belum ada pemetaan doa harian untuk semester ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          {/* Section C: Summary & Advisor Notes */}
          <section className="rounded-xl border border-[#D1D5DB] p-4 space-y-2 text-xs print-break-inside-avoid">
            <h3 className="font-bold text-[#14532D] uppercase tracking-wide">
              C. Ringkasan Evaluasi &amp; Catatan Pembimbing
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2 border-y border-[#E5E7EB]">
              <div>
                <p className="text-[#52605A]">Setoran Senin–Kamis</p>
                <p className="font-bold tabular-nums">{activeSummary.logsCount} kali</p>
              </div>
              <div>
                <p className="text-[#52605A]">Evaluasi Jum’at</p>
                <p className="font-bold tabular-nums">{activeSummary.weeklyCount} pekan</p>
              </div>
              <div>
                <p className="text-[#52605A]">Ketuntasan Juz 30</p>
                <p className="font-bold tabular-nums text-[#14532D]">{activeSummary.juzPersen}%</p>
              </div>
              <div>
                <p className="text-[#52605A]">Ketuntasan Doa</p>
                <p className="font-bold tabular-nums text-[#C59B27]">{activeSummary.doaPersen}%</p>
              </div>
            </div>
            <p className="text-[#1A2420] leading-relaxed">
              {activeSummary.latestMonthly?.rekomendasi ||
                activeSummary.latestWeekly?.catatanJumat ||
                'Ananda mengikuti program tahfidz dengan baik. Terus istiqomah muraja’ah di rumah bersama orang tua.'}
            </p>
          </section>

          {/* Official Signature Section */}
          <footer className="pt-4 grid grid-cols-3 gap-4 text-center text-xs print-break-inside-avoid">
            <div className="space-y-16">
              <div>
                <p className="text-[#52605A]">Mengetahui,</p>
                <p className="font-semibold text-[#1A2420]">Orang Tua / Wali Murid</p>
              </div>
              <p className="font-semibold underline underline-offset-4 text-[#1A2420]">
                {activeStudent.namaOrangTua}
              </p>
            </div>

            <div className="space-y-16">
              <div>
                <p className="text-[#52605A]">&nbsp;</p>
                <p className="font-semibold text-[#1A2420]">Guru Pendamping / Wali Kelas</p>
              </div>
              <p className="font-semibold underline underline-offset-4 text-[#1A2420]">
                {activeWali?.nama || 'Pembimbing Tahfidz'}
              </p>
            </div>

            <div className="space-y-16">
              <div>
                <p className="text-[#52605A]">
                  {settings.kotaRapor}, {todayFormatted}
                </p>
                <p className="font-semibold text-[#1A2420]">Kepala Madrasah / Ketua Program</p>
              </div>
              <p className="font-semibold underline underline-offset-4 text-[#1A2420]">
                {settings.namaKepalaMadrasah}
              </p>
            </div>
          </footer>
        </article>
      )}
    </div>
  );
}
