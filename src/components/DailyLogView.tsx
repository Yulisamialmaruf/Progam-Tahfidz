import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { CalendarDays, Plus, Search, Trash2 } from 'lucide-react';
import {
  ALL_JENJANG,
  type AuthUser,
  type DailyLog,
  type HariSetoran,
  type InstitutionSettings,
  type Jenjang,
  type MateriItem,
  type Semester,
  type StatusCapaian,
  type Student,
} from '../types';
import { api } from '../lib/api';
import { Avatar } from './Avatar';
import { StatusText } from './StatusText';

interface DailyLogViewProps {
  user: AuthUser;
  settings: InstitutionSettings;
  semesterFilter: Semester;
  students: Omit<Student, 'pin'>[];
  materials: MateriItem[];
  dailyLogs: DailyLog[];
  onLogsChange: (next: DailyLog[]) => void;
}

const HARI_LIST: HariSetoran[] = ['Senin', 'Selasa', 'Rabu', 'Kamis'];

export function DailyLogView({
  user,
  settings,
  semesterFilter,
  students,
  materials,
  dailyLogs,
  onLogsChange,
}: DailyLogViewProps) {
  const canEdit = user.role !== 'orang_tua';
  const allowedJenjang: Jenjang[] =
    user.role === 'wali_kelas' && user.jenjangAmpuan?.length
      ? user.jenjangAmpuan
      : ALL_JENJANG;

  const visibleStudents = useMemo(() => {
    if (user.role === 'orang_tua') {
      return students.filter((s) => s.id === user.studentId);
    }
    return students.filter((s) => allowedJenjang.includes(s.jenjang));
  }, [students, user, allowedJenjang]);

  const [jenjangFilter, setJenjangFilter] = useState<'Semua' | Jenjang>(
    user.role === 'wali_kelas' && allowedJenjang.length === 1 ? allowedJenjang[0] : 'Semua',
  );
  const [hariFilter, setHariFilter] = useState<'Semua' | HariSetoran>('Semua');
  const [statusFilter, setStatusFilter] = useState<'Semua' | StatusCapaian>('Semua');
  const [searchText, setSearchText] = useState('');
  const [mingguFilter, setMingguFilter] = useState<number>(1);

  // Quick Entry Form State
  const [studentId, setStudentId] = useState<string>(visibleStudents[0]?.id || '');
  const [hari, setHari] = useState<HariSetoran>('Senin');
  const [tanggal, setTanggal] = useState<string>(
    semesterFilter === 1 ? '2026-11-16' : '2027-02-01',
  );
  const [materiId, setMateriId] = useState<string>('');
  const [bagianAyat, setBagianAyat] = useState<string>('Ayat 1–5');
  const [status, setStatus] = useState<StatusCapaian>('Tuntas / Lancar');
  const [nilai, setNilai] = useState<number>(88);
  const [catatan, setCatatan] = useState<string>('Bacaan tartil dan makhraj jelas.');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    setTanggal(semesterFilter === 1 ? '2026-11-16' : '2027-02-01');
  }, [semesterFilter]);

  const selectedStudent = visibleStudents.find((s) => s.id === studentId) || visibleStudents[0];

  const groupedMaterials = useMemo(() => {
    if (!selectedStudent) return { current: materials, others: [] as MateriItem[] };
    const current = materials.filter(
      (m) => m.jenjang === selectedStudent.jenjang && m.semester === semesterFilter,
    );
    const currentIds = new Set(current.map((m) => m.id));
    const others = materials.filter((m) => !currentIds.has(m.id));
    return { current, others };
  }, [materials, selectedStudent, semesterFilter]);

  const effectiveMateriId =
    materiId && materials.some((m) => m.id === materiId)
      ? materiId
      : groupedMaterials.current[0]?.id || materials[0]?.id || '';

  useEffect(() => {
    if (!selectedStudent) return;
    const firstMat = materials.find(
      (m) => m.jenjang === selectedStudent.jenjang && m.semester === semesterFilter,
    );
    if (firstMat) {
      setMateriId(firstMat.id);
    }
  }, [selectedStudent?.id, semesterFilter, materials]);

  const filteredLogs = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return dailyLogs.filter((log) => {
      if (log.semester !== semesterFilter) return false;
      if (log.mingguKe !== mingguFilter) return false;
      const st = visibleStudents.find((s) => s.id === log.studentId);
      if (!st) return false;
      if (jenjangFilter !== 'Semua' && st.jenjang !== jenjangFilter) return false;
      if (hariFilter !== 'Semua' && log.hari !== hariFilter) return false;
      if (statusFilter !== 'Semua' && log.status !== statusFilter) return false;
      if (q) {
        const mat = materials.find((m) => m.id === log.materiId);
        const match =
          st.nama.toLowerCase().includes(q) ||
          (mat?.judul.toLowerCase().includes(q) ?? false);
        if (!match) return false;
      }
      return true;
    });
  }, [
    dailyLogs,
    semesterFilter,
    mingguFilter,
    visibleStudents,
    jenjangFilter,
    hariFilter,
    statusFilter,
    searchText,
    materials,
  ]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !effectiveMateriId) return;
    setSaving(true);
    setFeedback('');
    try {
      const created = await api.createDailyLog({
        studentId: selectedStudent.id,
        semester: semesterFilter,
        tahunAjaran: settings.tahunAjaranAktif,
        tanggal,
        hari,
        mingguKe: mingguFilter,
        materiId: effectiveMateriId,
        bagianAyat,
        status,
        nilai: Number(nilai),
        catatan,
        evaluatorId: user.id,
        evaluatorName: user.nama,
      });
      onLogsChange([created, ...dailyLogs]);
      setFeedback(`Setoran ${selectedStudent.nama} (${hari}) berhasil dicatat.`);
    } catch {
      setFeedback('Gagal menyimpan catatan harian.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await api.deleteDailyLog(id);
    onLogsChange(dailyLogs.filter((l) => l.id !== id));
    setConfirmDeleteId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <section className="bg-white rounded-2xl border border-[#E5E7EB] p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#1A2420]">
              Catatan Harian Setoran (Senin – Kamis)
            </h2>
            <p className="text-xs text-[#52605A]">
              Pencatatan rutin harian hafalan Juz 30 dan doa harian sebelum evaluasi Jum’at
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Pilih Minggu"
              value={mingguFilter}
              onChange={(e) => setMingguFilter(Number(e.target.value))}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-[#E5E7EB] bg-[#FAF8F5]"
            >
              {Array.from({ length: 16 }, (_, idx) => idx + 1).map((wk) => (
                <option key={wk} value={wk}>
                  Minggu ke-{wk}
                </option>
              ))}
            </select>

            {user.role !== 'orang_tua' && (
              <select
                aria-label="Filter Jenjang"
                value={jenjangFilter}
                onChange={(e) => setJenjangFilter(e.target.value as 'Semua' | Jenjang)}
                className="px-3 py-2 text-xs font-semibold rounded-xl border border-[#E5E7EB] bg-[#FAF8F5]"
              >
                <option value="Semua">Semua Kelas Binaan</option>
                {allowedJenjang.map((j) => (
                  <option key={j} value={j}>
                    {j}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Day Segmented Control */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-[#FAF8F5] rounded-xl border border-[#E5E7EB] w-full md:w-fit">
            {(['Semua', ...HARI_LIST] as const).map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setHariFilter(h)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  hariFilter === h
                    ? 'bg-white text-[#14532D] border border-[#E5E7EB]'
                    : 'text-[#52605A] hover:text-[#1A2420]'
                }`}
              >
                {h}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Filter Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'Semua' | StatusCapaian)}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-[#E5E7EB] bg-[#FAF8F5]"
            >
              <option value="Semua">Semua Status</option>
              <option value="Tuntas / Lancar">Tuntas / Lancar</option>
              <option value="Perlu Muraja'ah">Perlu Muraja’ah</option>
              <option value="Sedang Proses">Sedang Proses</option>
            </select>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#52605A] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Cari murid / surah..."
                className="pl-8 pr-3 py-2 text-xs rounded-xl border border-[#E5E7EB] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:border-[#14532D]"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Fast Entry Form for Teachers / Admin / Kepala Program */}
        {canEdit && (
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-4 bg-white rounded-2xl border border-[#E5E7EB] p-5 space-y-4"
          >
            <div className="flex items-center gap-2 pb-3 border-b border-[#E5E7EB]">
              <CalendarDays className="w-4 h-4 text-[#14532D]" />
              <h3 className="text-sm font-bold text-[#1A2420]">
                Input Cepat Setoran Harian
              </h3>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1A2420] mb-1">
                Pilih Murid
              </label>
              <select
                value={selectedStudent?.id || ''}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-[#E5E7EB] bg-[#FAF8F5]"
              >
                {visibleStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nama} ({s.jenjang})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-[#1A2420] mb-1">
                  Hari Setoran
                </label>
                <select
                  value={hari}
                  onChange={(e) => setHari(e.target.value as HariSetoran)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-[#E5E7EB] bg-[#FAF8F5]"
                >
                  {HARI_LIST.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1A2420] mb-1">
                  Tanggal
                </label>
                <input
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-[#E5E7EB] bg-[#FAF8F5]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1A2420] mb-1">
                Materi yang Disetorkan
              </label>
              <select
                value={effectiveMateriId}
                onChange={(e) => setMateriId(e.target.value)}
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-[#E5E7EB] bg-[#FAF8F5]"
              >
                {groupedMaterials.current.length > 0 && (
                  <optgroup label={`Kurikulum ${selectedStudent?.jenjang} (Semester ${semesterFilter})`}>
                    {groupedMaterials.current.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.judul} ({m.kategori})
                      </option>
                    ))}
                  </optgroup>
                )}
                {groupedMaterials.others.length > 0 && (
                  <optgroup label="Materi Jenjang / Semester Lainnya">
                    {groupedMaterials.others.map((m) => (
                      <option key={m.id} value={m.id}>
                        [{m.jenjang} · S{m.semester}] {m.judul}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-[#1A2420] mb-1">
                  Ayat / Bagian
                </label>
                <input
                  type="text"
                  value={bagianAyat}
                  onChange={(e) => setBagianAyat(e.target.value)}
                  placeholder="Ayat 1–5 / Lengkap"
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-[#E5E7EB]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1A2420] mb-1">
                  Nilai (0–100)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={nilai}
                  onChange={(e) => setNilai(Number(e.target.value))}
                  className="w-full px-3 py-2.5 text-xs font-mono tabular-nums rounded-xl border border-[#E5E7EB]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1A2420] mb-1">
                Status Capaian
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusCapaian)}
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-[#E5E7EB] bg-[#FAF8F5]"
              >
                <option value="Tuntas / Lancar">Tuntas / Lancar</option>
                <option value="Perlu Muraja'ah">Perlu Muraja’ah</option>
                <option value="Sedang Proses">Sedang Proses</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1A2420] mb-1">
                Catatan Pembimbing
              </label>
              <textarea
                rows={2}
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E7EB]"
              />
            </div>

            {feedback && (
              <p className="text-xs font-medium text-[#15803D] bg-[#ECFDF5] px-3 py-2 rounded-lg">
                {feedback}
              </p>
            )}

            <button
              type="submit"
              disabled={saving || !selectedStudent}
              className="w-full py-2.5 px-4 rounded-xl bg-[#14532D] text-white text-xs font-semibold hover:bg-[#15803D] flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {saving ? 'Menyimpan...' : 'Simpan Catatan Harian'}
            </button>
          </form>
        )}

        {/* Daily Log Table / Mobile Cards */}
        <div className={canEdit ? 'lg:col-span-8' : 'lg:col-span-12'}>
          <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#E5E7EB] bg-[#FAF8F5] flex items-center justify-between">
              <span className="text-xs font-semibold text-[#52605A]">
                Rekap Setoran Minggu ke-{mingguFilter} · Semester {semesterFilter} ({filteredLogs.length} catatan)
              </span>
            </div>

            {filteredLogs.length === 0 ? (
              <div className="p-10 text-center text-sm text-[#52605A]">
                Belum ada catatan setoran untuk filter hari/minggu ini.
              </div>
            ) : (
              <>
                {/* Mobile Card List */}
                <div className="md:hidden divide-y divide-[#E5E7EB]">
                  {filteredLogs.map((log) => {
                    const st = students.find((s) => s.id === log.studentId);
                    const mat = materials.find((m) => m.id === log.materiId);
                    return (
                      <div key={log.id} className="p-4 space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar name={st?.nama || 'Murid'} src={st?.fotoUrl} size="sm" />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-[#1A2420] truncate">
                                {st?.nama}
                              </p>
                              <p className="text-[11px] text-[#52605A]">
                                {st?.jenjang} · {log.hari}, {log.tanggal}
                              </p>
                            </div>
                          </div>
                          <span className="text-sm font-bold tabular-nums text-[#14532D]">
                            {log.nilai}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-[#1A2420]">
                          {mat?.judul} ({log.bagianAyat})
                        </p>
                        <p className="text-xs text-[#52605A]">{log.catatan}</p>
                        <div className="flex items-center justify-between pt-1">
                          <StatusText status={log.status} />
                          {canEdit && (
                            confirmDeleteId === log.id ? (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleDelete(log.id)}
                                  className="text-xs font-semibold text-[#DC2626] cursor-pointer"
                                >
                                  Hapus
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="text-xs text-[#52605A] cursor-pointer"
                                >
                                  Batal
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(log.id)}
                                className="text-xs text-[#DC2626] p-1 cursor-pointer"
                                aria-label="Hapus catatan"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop Data Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#E5E7EB] text-[11px] font-semibold text-[#52605A]">
                        <th className="py-3 px-4">Murid &amp; Jenjang</th>
                        <th className="py-3 px-3">Hari</th>
                        <th className="py-3 px-3">Materi &amp; Bagian</th>
                        <th className="py-3 px-3 text-right">Nilai</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3">Catatan Guru</th>
                        {canEdit && <th className="py-3 px-4 text-right">Aksi</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB] text-xs">
                      {filteredLogs.map((log) => {
                        const st = students.find((s) => s.id === log.studentId);
                        const mat = materials.find((m) => m.id === log.materiId);
                        return (
                          <tr key={log.id} className="hover:bg-[#FAF8F5]">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <Avatar name={st?.nama || 'Murid'} src={st?.fotoUrl} size="sm" />
                                <div>
                                  <p className="font-semibold text-[#1A2420]">{st?.nama}</p>
                                  <p className="text-[11px] text-[#52605A]">{st?.jenjang}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap text-[#52605A]">
                              <p className="font-semibold text-[#1A2420]">{log.hari}</p>
                              <p className="text-[11px] tabular-nums">{log.tanggal}</p>
                            </td>
                            <td className="py-3 px-3">
                              <p className="font-semibold text-[#1A2420]">{mat?.judul}</p>
                              <p className="text-[11px] text-[#52605A]">{log.bagianAyat}</p>
                            </td>
                            <td className="py-3 px-3 text-right font-bold tabular-nums text-[#1A2420]">
                              {log.nilai}
                            </td>
                            <td className="py-3 px-3">
                              <StatusText status={log.status} compact />
                            </td>
                            <td className="py-3 px-3 max-w-[220px] text-[#52605A]">
                              <p className="line-clamp-2">{log.catatan}</p>
                            </td>
                            {canEdit && (
                              <td className="py-3 px-4 text-right whitespace-nowrap">
                                {confirmDeleteId === log.id ? (
                                  <div className="inline-flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleDelete(log.id)}
                                      className="text-xs font-semibold text-[#DC2626] hover:underline cursor-pointer"
                                    >
                                      Yakin
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteId(null)}
                                      className="text-xs text-[#52605A] hover:underline cursor-pointer"
                                    >
                                      Batal
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteId(log.id)}
                                    className="p-1.5 rounded-lg text-[#52605A] hover:text-[#DC2626] hover:bg-[#FEF2F2] cursor-pointer"
                                    title="Hapus catatan"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
