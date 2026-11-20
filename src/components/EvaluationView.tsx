import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Award, CalendarCheck, Save } from 'lucide-react';
import {
  ALL_JENJANG,
  type AuthUser,
  type DailyLog,
  type InstitutionSettings,
  type Jenjang,
  type MateriItem,
  type MonthlyEvaluation,
  type Semester,
  type StatusCapaian,
  type Student,
  type WeeklyEvaluation,
} from '../types';
import { api } from '../lib/api';
import { Avatar } from './Avatar';
import { StatusText } from './StatusText';

interface EvaluationViewProps {
  user: AuthUser;
  settings: InstitutionSettings;
  semesterFilter: Semester;
  students: Omit<Student, 'pin'>[];
  materials: MateriItem[];
  dailyLogs: DailyLog[];
  weeklyEvals: WeeklyEvaluation[];
  monthlyEvals: MonthlyEvaluation[];
  onWeeklyChange: (next: WeeklyEvaluation[]) => void;
  onMonthlyChange: (next: MonthlyEvaluation[]) => void;
}

const BULAN_SEM_1 = ['Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const BULAN_SEM_2 = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'];

export function EvaluationView({
  user,
  settings,
  semesterFilter,
  students,
  materials,
  dailyLogs,
  weeklyEvals,
  monthlyEvals,
  onWeeklyChange,
  onMonthlyChange,
}: EvaluationViewProps) {
  const canEdit = user.role !== 'orang_tua';
  const allowedJenjang: Jenjang[] =
    user.role === 'wali_kelas' && user.jenjangAmpuan?.length
      ? user.jenjangAmpuan
      : ALL_JENJANG;

  const visibleStudents = useMemo(() => {
    if (user.role === 'orang_tua') return students.filter((s) => s.id === user.studentId);
    return students.filter((s) => allowedJenjang.includes(s.jenjang));
  }, [students, user, allowedJenjang]);

  const [tab, setTab] = useState<'mingguan' | 'bulanan'>('mingguan');
  const [jenjangFilter, setJenjangFilter] = useState<'Semua' | Jenjang>('Semua');

  const filteredStudents = useMemo(() => {
    return visibleStudents.filter((s) =>
      jenjangFilter === 'Semua' ? true : s.jenjang === jenjangFilter,
    );
  }, [visibleStudents, jenjangFilter]);

  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    filteredStudents[0]?.id || '',
  );
  const selectedStudent =
    filteredStudents.find((s) => s.id === selectedStudentId) || filteredStudents[0];

  useEffect(() => {
    if (selectedStudent && selectedStudent.id !== selectedStudentId) {
      setSelectedStudentId(selectedStudent.id);
    }
  }, [selectedStudent, selectedStudentId]);

  // Weekly Friday Eval state
  const [mingguKe, setMingguKe] = useState<number>(1);
  const [tanggalJumat, setTanggalJumat] = useState<string>(
    semesterFilter === 1 ? '2026-11-20' : '2027-02-05',
  );
  const [nilaiKelancaran, setNilaiKelancaran] = useState<number>(86);
  const [nilaiTajwid, setNilaiTajwid] = useState<number>(84);
  const [nilaiAdab, setNilaiAdab] = useState<number>(90);
  const [statusUmum, setStatusUmum] = useState<StatusCapaian>('Tuntas / Lancar');
  const [targetMurajaah, setTargetMurajaah] = useState<string>('Muraja’ah Juz 30 & Doa Harian');
  const [catatanJumat, setCatatanJumat] = useState<string>(
    'Perkembangan setoran Senin–Kamis baik dan tertib.',
  );

  // Monthly Eval state
  const bulanOptions = semesterFilter === 1 ? BULAN_SEM_1 : BULAN_SEM_2;
  const [bulan, setBulan] = useState<string>(bulanOptions[0]);
  const [juzPersen, setJuzPersen] = useState<number>(85);
  const [doaPersen, setDoaPersen] = useState<number>(90);
  const [nilaiRata, setNilaiRata] = useState<number>(88);
  const [statusBulanan, setStatusBulanan] = useState<StatusCapaian>('Tuntas / Lancar');
  const [rekomendasi, setRekomendasi] = useState<string>(
    'Pertahankan rutinitas muraja’ah bersama orang tua setelah sholat Maghrib.',
  );

  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  const studentMonThuLogs = useMemo(() => {
    if (!selectedStudent) return [];
    return dailyLogs.filter(
      (l) =>
        l.studentId === selectedStudent.id &&
        l.semester === semesterFilter &&
        l.mingguKe === mingguKe,
    );
  }, [dailyLogs, selectedStudent, semesterFilter, mingguKe]);

  const studentWeeklyHistory = useMemo(() => {
    if (!selectedStudent) return [];
    return weeklyEvals
      .filter((w) => w.studentId === selectedStudent.id && w.semester === semesterFilter)
      .sort((a, b) => b.mingguKe - a.mingguKe);
  }, [weeklyEvals, selectedStudent, semesterFilter]);

  const studentMonthlyTrend = useMemo(() => {
    if (!selectedStudent) return [];
    return monthlyEvals
      .filter((m) => m.studentId === selectedStudent.id && m.semester === semesterFilter)
      .sort((a, b) => a.bulanIndex - b.bulanIndex);
  }, [monthlyEvals, selectedStudent, semesterFilter]);

  // Sync existing weekly evaluation or reset defaults when student/week changes
  useEffect(() => {
    if (!selectedStudent) return;
    const existingWk = weeklyEvals.find(
      (w) =>
        w.studentId === selectedStudent.id &&
        w.semester === semesterFilter &&
        w.mingguKe === mingguKe,
    );
    if (existingWk) {
      setTanggalJumat(existingWk.tanggalJumat);
      setNilaiKelancaran(existingWk.nilaiKelancaran);
      setNilaiTajwid(existingWk.nilaiTajwid);
      setNilaiAdab(existingWk.nilaiAdab);
      setStatusUmum(existingWk.statusUmum);
      setTargetMurajaah(existingWk.targetMurajaah);
      setCatatanJumat(existingWk.catatanJumat);
    } else {
      const avg = studentMonThuLogs.length
        ? Math.round(
            studentMonThuLogs.reduce((a, b) => a + b.nilai, 0) / studentMonThuLogs.length,
          )
        : 85;
      setTanggalJumat(semesterFilter === 1 ? '2026-11-20' : '2027-02-05');
      setNilaiKelancaran(avg);
      setNilaiTajwid(Math.max(70, avg - 2));
      setNilaiAdab(Math.min(100, avg + 3));
      setStatusUmum(avg >= 85 ? 'Tuntas / Lancar' : "Perlu Muraja'ah");
      setTargetMurajaah(`Muraja’ah materi ${selectedStudent.jenjang} (Pekan ${mingguKe})`);
      setCatatanJumat('Perkembangan setoran Senin–Kamis berjalan baik dan tertib.');
    }
  }, [selectedStudent, semesterFilter, mingguKe, weeklyEvals, studentMonThuLogs]);

  useEffect(() => {
    setBulan(bulanOptions[0]);
  }, [semesterFilter]);

  useEffect(() => {
    if (!selectedStudent) return;
    const existingMo = monthlyEvals.find(
      (m) =>
        m.studentId === selectedStudent.id &&
        m.semester === semesterFilter &&
        m.bulan === bulan,
    );
    if (existingMo) {
      setJuzPersen(existingMo.capaianJuz30Persen);
      setDoaPersen(existingMo.capaianDoaPersen);
      setNilaiRata(existingMo.nilaiRataRata);
      setStatusBulanan(existingMo.statusBulanan);
      setRekomendasi(existingMo.rekomendasi);
    } else {
      setJuzPersen(80);
      setDoaPersen(85);
      setNilaiRata(85);
      setStatusBulanan('Tuntas / Lancar');
      setRekomendasi('Pertahankan rutinitas muraja’ah bersama orang tua setelah sholat Maghrib.');
    }
  }, [selectedStudent, semesterFilter, bulan, monthlyEvals]);

  const handleSaveWeekly = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setSaving(true);
    setSavedMsg('');
    try {
      const saved = await api.saveWeeklyEval({
        studentId: selectedStudent.id,
        semester: semesterFilter,
        tahunAjaran: settings.tahunAjaranAktif,
        tanggalJumat,
        mingguKe,
        statusUmum,
        nilaiKelancaran: Number(nilaiKelancaran),
        nilaiTajwid: Number(nilaiTajwid),
        nilaiAdab: Number(nilaiAdab),
        targetMurajaah,
        catatanJumat,
        evaluatorId: user.id,
        evaluatorName: user.nama,
      });
      const exists = weeklyEvals.some((w) => w.id === saved.id);
      onWeeklyChange(
        exists
          ? weeklyEvals.map((w) => (w.id === saved.id ? saved : w))
          : [saved, ...weeklyEvals],
      );
      setSavedMsg(`Evaluasi Jum’at Minggu ke-${mingguKe} untuk ${selectedStudent.nama} tersimpan.`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMonthly = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setSaving(true);
    setSavedMsg('');
    try {
      const idx = bulanOptions.indexOf(bulan) + 1;
      const saved = await api.saveMonthlyEval({
        studentId: selectedStudent.id,
        semester: semesterFilter,
        tahunAjaran: settings.tahunAjaranAktif,
        bulan,
        bulanIndex: idx > 0 ? idx : 1,
        capaianJuz30Persen: Number(juzPersen),
        capaianDoaPersen: Number(doaPersen),
        nilaiRataRata: Number(nilaiRata),
        statusBulanan,
        rekomendasi,
        evaluatorId: user.id,
        evaluatorName: user.nama,
      });
      const exists = monthlyEvals.some((m) => m.id === saved.id);
      onMonthlyChange(
        exists
          ? monthlyEvals.map((m) => (m.id === saved.id ? saved : m))
          : [...monthlyEvals, saved],
      );
      setSavedMsg(`Evaluasi Bulanan (${bulan}) untuk ${selectedStudent.nama} tersimpan.`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <section className="bg-white rounded-2xl border border-[#E5E7EB] p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-[#FAF8F5] rounded-xl border border-[#E5E7EB] w-full md:w-fit">
          <button
            type="button"
            onClick={() => {
              setTab('mingguan');
              setSavedMsg('');
            }}
            className={`flex-1 md:flex-none px-4 py-2 text-xs font-semibold rounded-lg cursor-pointer whitespace-nowrap ${
              tab === 'mingguan'
                ? 'bg-white text-[#14532D] border border-[#E5E7EB]'
                : 'text-[#52605A]'
            }`}
          >
            Evaluasi Mingguan (Jum’at)
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('bulanan');
              setSavedMsg('');
            }}
            className={`flex-1 md:flex-none px-4 py-2 text-xs font-semibold rounded-lg cursor-pointer whitespace-nowrap ${
              tab === 'bulanan'
                ? 'bg-white text-[#14532D] border border-[#E5E7EB]'
                : 'text-[#52605A]'
            }`}
          >
            Evaluasi Bulanan
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {user.role !== 'orang_tua' && (
            <select
              aria-label="Filter Jenjang"
              value={jenjangFilter}
              onChange={(e) => setJenjangFilter(e.target.value as 'Semua' | Jenjang)}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-[#E5E7EB] bg-[#FAF8F5]"
            >
              <option value="Semua">Semua Jenjang Binaan</option>
              {allowedJenjang.map((j) => (
                <option key={j} value={j}>
                  {j}
                </option>
              ))}
            </select>
          )}
          <select
            aria-label="Pilih Murid"
            value={selectedStudent?.id || ''}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-[#E5E7EB] bg-[#FAF8F5]"
          >
            {filteredStudents.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nama} ({s.jenjang})
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Selected Student Summary Strip */}
      {selectedStudent && (
        <section className="bg-white rounded-2xl border border-[#E5E7EB] p-4 sm:p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <Avatar name={selectedStudent.nama} src={selectedStudent.fotoUrl} size="lg" />
            <div>
              <h3 className="text-base font-bold text-[#1A2420]">{selectedStudent.nama}</h3>
              <p className="text-xs text-[#52605A]">
                {selectedStudent.jenjang} · NIS{' '}
                <span className="font-mono tabular-nums">{selectedStudent.nis}</span> · Semester{' '}
                {semesterFilter}
              </p>
            </div>
          </div>
        </section>
      )}

      {tab === 'mingguan' ? (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Mon-Thu Recap & Weekly History Column */}
          <div className="lg:col-span-6 space-y-5">
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-[#14532D]" />
                  <h3 className="text-sm font-bold text-[#1A2420]">
                    Ringkasan Setoran Senin–Kamis (Minggu ke-{mingguKe})
                  </h3>
                </div>
                <select
                  value={mingguKe}
                  onChange={(e) => setMingguKe(Number(e.target.value))}
                  className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-[#E5E7EB] bg-[#FAF8F5]"
                >
                  {Array.from({ length: 16 }, (_, i) => i + 1).map((w) => (
                    <option key={w} value={w}>
                      Minggu {w}
                    </option>
                  ))}
                </select>
              </div>

              {studentMonThuLogs.length === 0 ? (
                <p className="text-xs text-[#52605A] py-6 text-center">
                  Belum ada setoran Senin–Kamis tercatat pada Minggu ke-{mingguKe}.
                </p>
              ) : (
                <div className="divide-y divide-[#E5E7EB]">
                  {studentMonThuLogs.map((log) => {
                    const mat = materials.find((m) => m.id === log.materiId);
                    return (
                      <div key={log.id} className="py-3 flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold text-[#1A2420]">
                            {log.hari}, {log.tanggal} · {mat?.judul}
                          </p>
                          <p className="text-[11px] text-[#52605A] mt-0.5">
                            {log.bagianAyat} · {log.catatan}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-bold tabular-nums text-[#1A2420]">{log.nilai}</p>
                          <StatusText status={log.status} compact />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* History of Friday Evaluations */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 space-y-3">
              <h3 className="text-sm font-bold text-[#1A2420]">
                Riwayat Evaluasi Jum’at (Semester {semesterFilter})
              </h3>
              {studentWeeklyHistory.length === 0 ? (
                <p className="text-xs text-[#52605A] py-4 text-center">
                  Belum ada riwayat evaluasi Jum’at pada semester ini.
                </p>
              ) : (
                <div className="divide-y divide-[#E5E7EB]">
                  {studentWeeklyHistory.map((wk) => (
                    <button
                      key={wk.id}
                      type="button"
                      onClick={() => setMingguKe(wk.mingguKe)}
                      className={`w-full text-left py-3 px-2 rounded-lg transition-colors flex items-start justify-between gap-3 cursor-pointer ${
                        wk.mingguKe === mingguKe ? 'bg-[#FAF8F5]' : 'hover:bg-[#FAF8F5]'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#1A2420]">
                          Pekan {wk.mingguKe} · {wk.tanggalJumat}
                        </p>
                        <p className="text-[11px] text-[#52605A] truncate mt-0.5">
                          {wk.targetMurajaah}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold tabular-nums text-[#14532D]">
                          {wk.nilaiAkhir}
                        </p>
                        <StatusText status={wk.statusUmum} compact />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Friday Evaluation Form */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-[#E5E7EB] p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] mb-4">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-[#C59B27]" />
                <h3 className="text-sm font-bold text-[#1A2420]">
                  Penilaian Evaluasi Hari Jum’at
                </h3>
              </div>
              <span className="text-xs font-mono tabular-nums font-bold text-[#14532D]">
                Rata-rata: {Math.round((nilaiKelancaran + nilaiTajwid + nilaiAdab) / 3)}
              </span>
            </div>

            <form onSubmit={handleSaveWeekly} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1A2420] mb-1">
                    Tanggal Jum’at
                  </label>
                  <input
                    type="date"
                    disabled={!canEdit}
                    value={tanggalJumat}
                    onChange={(e) => setTanggalJumat(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E7EB] bg-[#FAF8F5]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1A2420] mb-1">
                    Status Evaluasi
                  </label>
                  <select
                    disabled={!canEdit}
                    value={statusUmum}
                    onChange={(e) => setStatusUmum(e.target.value as StatusCapaian)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E7EB] bg-[#FAF8F5]"
                  >
                    <option value="Tuntas / Lancar">Tuntas / Lancar</option>
                    <option value="Perlu Muraja'ah">Perlu Muraja’ah</option>
                    <option value="Sedang Proses">Sedang Proses</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1A2420] mb-1">
                    Kelancaran
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    disabled={!canEdit}
                    value={nilaiKelancaran}
                    onChange={(e) => setNilaiKelancaran(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono tabular-nums rounded-xl border border-[#E5E7EB]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1A2420] mb-1">
                    Tajwid &amp; Makhraj
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    disabled={!canEdit}
                    value={nilaiTajwid}
                    onChange={(e) => setNilaiTajwid(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono tabular-nums rounded-xl border border-[#E5E7EB]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1A2420] mb-1">
                    Adab &amp; Sikap
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    disabled={!canEdit}
                    value={nilaiAdab}
                    onChange={(e) => setNilaiAdab(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono tabular-nums rounded-xl border border-[#E5E7EB]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A2420] mb-1">
                  Target Muraja’ah Pekan Berikutnya
                </label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={targetMurajaah}
                  onChange={(e) => setTargetMurajaah(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E7EB]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A2420] mb-1">
                  Catatan Evaluasi Jum’at
                </label>
                <textarea
                  rows={3}
                  disabled={!canEdit}
                  value={catatanJumat}
                  onChange={(e) => setCatatanJumat(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E7EB]"
                />
              </div>

              {savedMsg && (
                <p className="text-xs font-medium text-[#15803D] bg-[#ECFDF5] px-3 py-2 rounded-lg">
                  {savedMsg}
                </p>
              )}

              {canEdit && (
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#14532D] text-white text-xs font-semibold hover:bg-[#15803D] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Menyimpan...' : 'Simpan Evaluasi Jum’at'}
                </button>
              )}
            </form>
          </div>
        </section>
      ) : (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Monthly Trend */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E5E7EB] p-5 space-y-4">
            <h3 className="text-sm font-bold text-[#1A2420]">
              Tren Perkembangan Bulanan (Semester {semesterFilter})
            </h3>
            {studentMonthlyTrend.length === 0 ? (
              <p className="text-xs text-[#52605A] py-6 text-center">
                Belum ada data evaluasi bulanan pada semester ini.
              </p>
            ) : (
              <div className="space-y-4">
                {studentMonthlyTrend.map((mo) => (
                  <div
                    key={mo.id}
                    className="p-4 rounded-xl border border-[#E5E7EB] bg-[#FAF8F5] space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#1A2420]">{mo.bulan}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono tabular-nums font-semibold text-[#14532D]">
                          Nilai {mo.nilaiRataRata}
                        </span>
                        <StatusText status={mo.statusBulanan} compact />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                      <div>
                        <div className="flex justify-between mb-1 text-[#52605A]">
                          <span>Juz 30</span>
                          <span className="font-mono tabular-nums font-semibold text-[#1A2420]">
                            {mo.capaianJuz30Persen}%
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[#E5E7EB] overflow-hidden">
                          <div
                            className="h-full bg-[#15803D]"
                            style={{ width: `${mo.capaianJuz30Persen}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1 text-[#52605A]">
                          <span>Doa Harian &amp; Ibadah</span>
                          <span className="font-mono tabular-nums font-semibold text-[#1A2420]">
                            {mo.capaianDoaPersen}%
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[#E5E7EB] overflow-hidden">
                          <div
                            className="h-full bg-[#C59B27]"
                            style={{ width: `${mo.capaianDoaPersen}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-[#52605A]">{mo.rekomendasi}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Monthly Form */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E5E7EB] p-5">
            <h3 className="text-sm font-bold text-[#1A2420] pb-3 border-b border-[#E5E7EB] mb-4">
              {canEdit ? 'Input / Perbarui Evaluasi Bulanan' : 'Detail Evaluasi Bulanan'}
            </h3>
            <form onSubmit={handleSaveMonthly} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1A2420] mb-1">
                    Bulan
                  </label>
                  <select
                    value={bulan}
                    onChange={(e) => setBulan(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E7EB] bg-[#FAF8F5]"
                  >
                    {bulanOptions.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1A2420] mb-1">
                    Status Bulanan
                  </label>
                  <select
                    disabled={!canEdit}
                    value={statusBulanan}
                    onChange={(e) => setStatusBulanan(e.target.value as StatusCapaian)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E7EB] bg-[#FAF8F5]"
                  >
                    <option value="Tuntas / Lancar">Tuntas / Lancar</option>
                    <option value="Perlu Muraja'ah">Perlu Muraja’ah</option>
                    <option value="Sedang Proses">Sedang Proses</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1A2420] mb-1">
                    Juz 30 (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    disabled={!canEdit}
                    value={juzPersen}
                    onChange={(e) => setJuzPersen(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono tabular-nums rounded-xl border border-[#E5E7EB]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1A2420] mb-1">
                    Doa (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    disabled={!canEdit}
                    value={doaPersen}
                    onChange={(e) => setDoaPersen(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono tabular-nums rounded-xl border border-[#E5E7EB]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1A2420] mb-1">
                    Nilai Rata
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    disabled={!canEdit}
                    value={nilaiRata}
                    onChange={(e) => setNilaiRata(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono tabular-nums rounded-xl border border-[#E5E7EB]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A2420] mb-1">
                  Rekomendasi Pembimbing
                </label>
                <textarea
                  rows={3}
                  disabled={!canEdit}
                  value={rekomendasi}
                  onChange={(e) => setRekomendasi(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E7EB]"
                />
              </div>

              {savedMsg && (
                <p className="text-xs font-medium text-[#15803D] bg-[#ECFDF5] px-3 py-2 rounded-lg">
                  {savedMsg}
                </p>
              )}

              {canEdit && (
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#14532D] text-white text-xs font-semibold hover:bg-[#15803D] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Menyimpan...' : 'Simpan Evaluasi Bulanan'}
                </button>
              )}
            </form>
          </div>
        </section>
      )}
    </div>
  );
}
