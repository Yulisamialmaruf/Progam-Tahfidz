import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import {
  Camera,
  Edit3,
  KeyRound,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  UserPlus,
  X,
} from 'lucide-react';
import {
  ALL_JENJANG,
  type InstitutionSettings,
  type Jenjang,
  type Semester,
  type Student,
  type Teacher,
} from '../types';
import { api } from '../lib/api';
import { Avatar } from './Avatar';

interface AdminManagementViewProps {
  settings: InstitutionSettings;
  teachers: Teacher[];
  students: Student[];
  onSettingsChange: (next: InstitutionSettings) => void;
  onTeachersChange: (next: Teacher[]) => void;
  onStudentsChange: (next: Student[]) => void;
}

const DEFAULT_LOGO = '/assets/aistudio/1000435209_80ac9f58.png';

export function AdminManagementView({
  settings,
  teachers,
  students,
  onSettingsChange,
  onTeachersChange,
  onStudentsChange,
}: AdminManagementViewProps) {
  const [subTab, setSubTab] = useState<'guru' | 'murid' | 'keamanan'>('guru');
  const [muridSearch, setMuridSearch] = useState('');
  const [muridJenjang, setMuridJenjang] = useState<'Semua' | Jenjang>('Semua');
  const [confirmDeleteTeacherId, setConfirmDeleteTeacherId] = useState<string | null>(null);
  const [confirmDeleteStudentId, setConfirmDeleteStudentId] = useState<string | null>(null);

  // Teacher Modal
  const [teacherModal, setTeacherModal] = useState(false);
  const [editTeacherId, setEditTeacherId] = useState<string | null>(null);
  const [tForm, setTForm] = useState<Omit<Teacher, 'id'>>({
    nama: '',
    role: 'wali_kelas',
    loginId: '',
    pin: '123456',
    jenjangAmpuan: ['RA A'],
    semesterAktif: 1,
    noHp: '',
    fotoUrl: '',
    aktif: true,
  });

  // Student Modal
  const [studentModal, setStudentModal] = useState(false);
  const [editStudentId, setEditStudentId] = useState<string | null>(null);
  const [sForm, setSForm] = useState<Omit<Student, 'id'>>({
    nis: '',
    nama: '',
    jenjang: 'RA A',
    semester: 1,
    tahunAjaran: settings.tahunAjaranAktif,
    namaOrangTua: '',
    noHpOrangTua: '',
    loginId: '',
    pin: '123456',
    fotoUrl: '',
    waliKelasId: teachers[0]?.id || '',
  });

  // Institution & Security state
  const [instForm, setInstForm] = useState<InstitutionSettings>(settings);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const teacherPhotoRef = useRef<HTMLInputElement | null>(null);
  const studentPhotoRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setInstForm(settings);
  }, [settings]);

  const filteredStudents = useMemo(() => {
    const q = muridSearch.trim().toLowerCase();
    return students
      .filter((s) => (muridJenjang === 'Semua' ? true : s.jenjang === muridJenjang))
      .filter(
        (s) =>
          !q ||
          s.nama.toLowerCase().includes(q) ||
          s.nis.toLowerCase().includes(q) ||
          s.loginId.toLowerCase().includes(q) ||
          s.namaOrangTua.toLowerCase().includes(q),
      );
  }, [students, muridSearch, muridJenjang]);

  const handlePhotoUpload = async (
    file: File,
    onDone: (url: string) => void,
  ) => {
    try {
      const { url } = await api.uploadFile(file);
      onDone(url);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal mengunggah foto.');
    }
  };

  // Teacher Handlers
  const openCreateTeacher = () => {
    setEditTeacherId(null);
    setTForm({
      nama: '',
      role: 'wali_kelas',
      loginId: `GURU-${Date.now().toString().slice(-4)}`,
      pin: '123456',
      jenjangAmpuan: ['RA A'],
      semesterAktif: settings.semesterAktif,
      noHp: '',
      fotoUrl: '',
      aktif: true,
    });
    setErrorMsg('');
    setTeacherModal(true);
  };

  const openEditTeacher = (t: Teacher) => {
    setEditTeacherId(t.id);
    setTForm({
      nama: t.nama,
      role: t.role,
      loginId: t.loginId,
      pin: t.pin,
      jenjangAmpuan: t.jenjangAmpuan,
      semesterAktif: t.semesterAktif,
      noHp: t.noHp,
      fotoUrl: t.fotoUrl || '',
      aktif: t.aktif,
    });
    setErrorMsg('');
    setTeacherModal(true);
  };

  const saveTeacher = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    try {
      if (editTeacherId) {
        const updated = await api.updateTeacher(editTeacherId, tForm);
        onTeachersChange(teachers.map((t) => (t.id === editTeacherId ? updated : t)));
      } else {
        const created = await api.createTeacher(tForm);
        onTeachersChange([...teachers, created]);
      }
      setTeacherModal(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal menyimpan data guru.');
    } finally {
      setSaving(false);
    }
  };

  const deleteTeacher = async (t: Teacher) => {
    await api.deleteTeacher(t.id);
    onTeachersChange(teachers.filter((item) => item.id !== t.id));
    setConfirmDeleteTeacherId(null);
  };

  // Student Handlers
  const openCreateStudent = () => {
    setEditStudentId(null);
    const num = (students.length + 1).toString().padStart(2, '0');
    setSForm({
      nis: `26010${num}`,
      nama: '',
      jenjang: 'RA A',
      semester: settings.semesterAktif,
      tahunAjaran: settings.tahunAjaranAktif,
      namaOrangTua: '',
      noHpOrangTua: '',
      loginId: `ORTU-STD-${num}`,
      pin: '123456',
      fotoUrl: '',
      waliKelasId: teachers.find((t) => t.role === 'wali_kelas')?.id || teachers[0]?.id || '',
    });
    setErrorMsg('');
    setStudentModal(true);
  };

  const openEditStudent = (s: Student) => {
    setEditStudentId(s.id);
    setSForm({
      nis: s.nis,
      nama: s.nama,
      jenjang: s.jenjang,
      semester: s.semester,
      tahunAjaran: s.tahunAjaran,
      namaOrangTua: s.namaOrangTua,
      noHpOrangTua: s.noHpOrangTua,
      loginId: s.loginId,
      pin: s.pin,
      fotoUrl: s.fotoUrl || '',
      waliKelasId: s.waliKelasId,
    });
    setErrorMsg('');
    setStudentModal(true);
  };

  const saveStudent = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    try {
      if (editStudentId) {
        const updated = await api.updateStudent(editStudentId, sForm);
        onStudentsChange(students.map((s) => (s.id === editStudentId ? updated : s)));
      } else {
        const created = await api.createStudent(sForm);
        onStudentsChange([...students, created]);
      }
      setStudentModal(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal menyimpan data murid.');
    } finally {
      setSaving(false);
    }
  };

  const deleteStudent = async (s: Student) => {
    await api.deleteStudent(s.id);
    onStudentsChange(students.filter((item) => item.id !== s.id));
    setConfirmDeleteStudentId(null);
  };

  // Institution & Security Handlers
  const saveInstitution = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg('');
    setErrorMsg('');
    try {
      const res = await api.updateSettings({ settings: instForm });
      onSettingsChange(res.settings);
      setStatusMsg('Identitas lembaga, logo yayasan, dan tahun ajaran berhasil diperbarui.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal menyimpan pengaturan.');
    } finally {
      setSaving(false);
    }
  };

  const changeAdminPassword = async (e: FormEvent) => {
    e.preventDefault();
    setStatusMsg('');
    setErrorMsg('');
    if (newPassword !== confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }
    setSaving(true);
    try {
      await api.updateSettings({
        currentPassword,
        newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setStatusMsg('Kata sandi Admin Madrasah berhasil diperbarui.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal mengganti kata sandi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-navigation Tabs */}
      <section className="bg-white rounded-2xl border border-[#E5E7EB] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-[#FAF8F5] rounded-xl border border-[#E5E7EB]">
          <button
            type="button"
            onClick={() => setSubTab('guru')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg cursor-pointer whitespace-nowrap ${
              subTab === 'guru'
                ? 'bg-white text-[#14532D] border border-[#E5E7EB]'
                : 'text-[#52605A]'
            }`}
          >
            Guru &amp; ID Wali Kelas ({teachers.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('murid')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg cursor-pointer whitespace-nowrap ${
              subTab === 'murid'
                ? 'bg-white text-[#14532D] border border-[#E5E7EB]'
                : 'text-[#52605A]'
            }`}
          >
            Murid &amp; ID Orang Tua ({students.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('keamanan')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg cursor-pointer whitespace-nowrap ${
              subTab === 'keamanan'
                ? 'bg-white text-[#14532D] border border-[#E5E7EB]'
                : 'text-[#52605A]'
            }`}
          >
            Logo, Lembaga &amp; Sandi Admin
          </button>
        </div>

        {subTab === 'guru' && (
          <button
            type="button"
            onClick={openCreateTeacher}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#14532D] text-white text-xs font-semibold hover:bg-[#15803D] cursor-pointer whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" />
            Tambah Guru / Ketua
          </button>
        )}

        {subTab === 'murid' && (
          <button
            type="button"
            onClick={openCreateStudent}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#14532D] text-white text-xs font-semibold hover:bg-[#15803D] cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Tambah Murid &amp; ID Wali
          </button>
        )}
      </section>

      {/* Teachers Tab */}
      {subTab === 'guru' && (
        <section className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#FAF8F5] text-[11px] font-semibold text-[#52605A]">
                  <th className="py-3 px-4">Guru / Pembimbing</th>
                  <th className="py-3 px-3">Peran</th>
                  <th className="py-3 px-3">Jenjang &amp; Sem</th>
                  <th className="py-3 px-3">ID Login &amp; PIN</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] text-xs">
                {teachers.map((t) => (
                  <tr key={t.id} className="hover:bg-[#FAF8F5]">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={t.nama} src={t.fotoUrl} size="md" />
                        <div>
                          <p className="font-semibold text-[#1A2420]">{t.nama}</p>
                          <p className="text-[11px] text-[#52605A] font-mono tabular-nums">
                            {t.noHp || '-'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-medium text-[#1A2420] whitespace-nowrap">
                      {t.role === 'kepala_program'
                        ? 'Ketua Program (Semua Jenjang)'
                        : 'Wali Kelas / Pendamping'}
                    </td>
                    <td className="py-3 px-3 text-[#52605A]">
                      <p>
                        {t.jenjangAmpuan.length === 8
                          ? 'RA A – MI Kelas 6'
                          : t.jenjangAmpuan.join(', ')}
                      </p>
                      <p className="text-[11px]">Semester {t.semesterAktif}</p>
                    </td>
                    <td className="py-3 px-3 font-mono text-[#14532D]">
                      <p className="font-semibold">{t.loginId}</p>
                      <p className="text-[11px] text-[#52605A]">PIN: {t.pin}</p>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-1">
                      <button
                        type="button"
                        onClick={() => openEditTeacher(t)}
                        className="p-2 rounded-lg text-[#14532D] hover:bg-[#14532D]/10 cursor-pointer"
                        title="Edit Guru"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      {confirmDeleteTeacherId === t.id ? (
                        <span className="inline-flex items-center gap-1.5 ml-1">
                          <button
                            type="button"
                            onClick={() => deleteTeacher(t)}
                            className="px-2 py-1 rounded bg-[#DC2626] text-white text-[11px] font-semibold cursor-pointer"
                          >
                            Yakin
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteTeacherId(null)}
                            className="px-2 py-1 rounded border border-[#E5E7EB] text-[11px] text-[#52605A] cursor-pointer"
                          >
                            Batal
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteTeacherId(t.id)}
                          className="p-2 rounded-lg text-[#DC2626] hover:bg-[#FEF2F2] cursor-pointer"
                          title="Hapus Guru"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Students Tab */}
      {subTab === 'murid' && (
        <section className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
          <div className="p-4 border-b border-[#E5E7EB] bg-[#FAF8F5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-[#52605A] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={muridSearch}
                onChange={(e) => setMuridSearch(e.target.value)}
                placeholder="Cari nama murid, NIS, atau ID Login..."
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-[#E5E7EB] bg-white focus:outline-none focus:border-[#14532D]"
              />
            </div>
            <select
              aria-label="Filter Jenjang Murid"
              value={muridJenjang}
              onChange={(e) => setMuridJenjang(e.target.value as 'Semua' | Jenjang)}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-[#E5E7EB] bg-white"
            >
              <option value="Semua">Semua Jenjang (RA A – MI 6)</option>
              {ALL_JENJANG.map((j) => (
                <option key={j} value={j}>
                  {j}
                </option>
              ))}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#FAF8F5] text-[11px] font-semibold text-[#52605A]">
                  <th className="py-3 px-4">Murid &amp; NIS</th>
                  <th className="py-3 px-3">Jenjang / Sem</th>
                  <th className="py-3 px-3">Orang Tua / Wali</th>
                  <th className="py-3 px-3">ID Login &amp; PIN Wali</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] text-xs">
                {filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-[#FAF8F5]">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={s.nama} src={s.fotoUrl} size="md" shape="rounded" />
                        <div>
                          <p className="font-semibold text-[#1A2420]">{s.nama}</p>
                          <p className="text-[11px] font-mono tabular-nums text-[#52605A]">
                            NIS {s.nis}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <p className="font-semibold text-[#1A2420]">{s.jenjang}</p>
                      <p className="text-[11px] text-[#52605A]">Semester {s.semester}</p>
                    </td>
                    <td className="py-3 px-3">
                      <p className="text-[#1A2420]">{s.namaOrangTua}</p>
                      <p className="text-[11px] font-mono tabular-nums text-[#52605A]">
                        {s.noHpOrangTua || '-'}
                      </p>
                    </td>
                    <td className="py-3 px-3 font-mono text-[#14532D]">
                      <p className="font-semibold">{s.loginId}</p>
                      <p className="text-[11px] text-[#52605A]">PIN: {s.pin}</p>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-1">
                      <button
                        type="button"
                        onClick={() => openEditStudent(s)}
                        className="p-2 rounded-lg text-[#14532D] hover:bg-[#14532D]/10 cursor-pointer"
                        title="Edit Murid"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      {confirmDeleteStudentId === s.id ? (
                        <span className="inline-flex items-center gap-1.5 ml-1">
                          <button
                            type="button"
                            onClick={() => deleteStudent(s)}
                            className="px-2 py-1 rounded bg-[#DC2626] text-white text-[11px] font-semibold cursor-pointer"
                          >
                            Yakin
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteStudentId(null)}
                            className="px-2 py-1 rounded border border-[#E5E7EB] text-[11px] text-[#52605A] cursor-pointer"
                          >
                            Batal
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteStudentId(s.id)}
                          className="p-2 rounded-lg text-[#DC2626] hover:bg-[#FEF2F2] cursor-pointer"
                          title="Hapus Murid"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Institution, Logo & Admin Password Tab */}
      {subTab === 'keamanan' && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={saveInstitution}
            className="lg:col-span-7 bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-5"
          >
            <h3 className="text-base font-bold text-[#1A2420] pb-3 border-b border-[#E5E7EB]">
              Logo Yayasan &amp; Identitas Kop Rapor Resmi
            </h3>

            {/* Logo Uploader */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border border-[#E5E7EB] bg-[#FAF8F5]">
              <img
                src={instForm.logoUrl || DEFAULT_LOGO}
                alt="Logo Yayasan"
                referrerPolicy="no-referrer"
                className="w-20 h-20 object-contain rounded-xl bg-white p-1.5 border border-[#E5E7EB] shrink-0"
              />
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[#1A2420]">
                  Logo Yayasan Miftahul Huda Al Ma’ruf
                </p>
                <div className="flex flex-wrap gap-2">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        handlePhotoUpload(f, (url) => setInstForm({ ...instForm, logoUrl: url }));
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-white border border-[#E5E7EB] text-[#1A2420] hover:bg-[#F3F6F4] cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#14532D]" />
                    Ganti Logo Yayasan
                  </button>
                  <button
                    type="button"
                    onClick={() => setInstForm({ ...instForm, logoUrl: DEFAULT_LOGO })}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg text-[#52605A] hover:text-[#1A2420] cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Logo Asli
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#1A2420] mb-1">
                  Tahun Ajaran Aktif
                </label>
                <input
                  type="text"
                  value={instForm.tahunAjaranAktif}
                  onChange={(e) => setInstForm({ ...instForm, tahunAjaranAktif: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E7EB]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1A2420] mb-1">
                  Semester Aktif
                </label>
                <select
                  value={instForm.semesterAktif}
                  onChange={(e) =>
                    setInstForm({ ...instForm, semesterAktif: Number(e.target.value) as Semester })
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E7EB] bg-[#FAF8F5]"
                >
                  <option value={1}>Semester 1 (Ganjil)</option>
                  <option value={2}>Semester 2 (Genap)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1A2420] mb-1">
                Nama Kepala Madrasah / Ketua Program
              </label>
              <input
                type="text"
                value={instForm.namaKepalaMadrasah}
                onChange={(e) => setInstForm({ ...instForm, namaKepalaMadrasah: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E7EB]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1A2420] mb-1">
                Alamat Lengkap (Kop Rapor)
              </label>
              <textarea
                rows={2}
                value={instForm.alamat}
                onChange={(e) => setInstForm({ ...instForm, alamat: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E7EB]"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-[#14532D] text-white text-xs font-semibold hover:bg-[#15803D] cursor-pointer"
            >
              Simpan Pengaturan Madrasah
            </button>
          </form>

          {/* Admin Password Security Card */}
          <form
            onSubmit={changeAdminPassword}
            className="lg:col-span-5 bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-4"
          >
            <div className="flex items-center gap-2 pb-3 border-b border-[#E5E7EB]">
              <ShieldCheck className="w-4 h-4 text-[#14532D]" />
              <h3 className="text-base font-bold text-[#1A2420]">
                Pengaturan Keamanan Sandi Admin
              </h3>
            </div>
            <p className="text-xs text-[#52605A]">
              Admin Madrasah dapat mengganti kata sandi kapan saja. ID Login Admin tetap{' '}
              <span className="font-mono font-semibold text-[#1A2420]">ADMIN-ALMARUF</span>.
            </p>

            <div>
              <label className="block text-xs font-semibold text-[#1A2420] mb-1">
                Kata Sandi Lama
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-[#E5E7EB]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1A2420] mb-1">
                Kata Sandi Baru (min. 5 karakter)
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-[#E5E7EB]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1A2420] mb-1">
                Konfirmasi Kata Sandi Baru
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-[#E5E7EB]"
              />
            </div>

            {statusMsg && (
              <p className="text-xs font-medium text-[#15803D] bg-[#ECFDF5] px-3 py-2 rounded-lg">
                {statusMsg}
              </p>
            )}
            {errorMsg && (
              <p className="text-xs font-medium text-[#DC2626] bg-[#FEF2F2] px-3 py-2 rounded-lg">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 px-4 rounded-xl bg-[#14532D] text-white text-xs font-semibold hover:bg-[#15803D] flex items-center justify-center gap-2 cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              Perbarui Kata Sandi Admin
            </button>
          </form>
        </section>
      )}

      {/* Teacher Create/Edit Modal */}
      {teacherModal && (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] w-full max-w-lg max-h-[92vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <h3 className="text-base font-bold text-[#1A2420]">
                {editTeacherId ? 'Edit Data Guru' : 'Tambah Guru / Ketua Program'}
              </h3>
              <button
                type="button"
                onClick={() => setTeacherModal(false)}
                className="p-1.5 rounded-lg text-[#52605A] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={saveTeacher} className="space-y-4">
              {/* Avatar Upload */}
              <div className="flex items-center gap-4">
                <Avatar name={tForm.nama || 'Guru'} src={tForm.fotoUrl} size="xl" />
                <div className="flex flex-wrap gap-2">
                  <input
                    ref={teacherPhotoRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handlePhotoUpload(f, (url) => setTForm({ ...tForm, fotoUrl: url }));
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => teacherPhotoRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs font-semibold text-[#1A2420] hover:bg-[#FAF8F5] cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5 text-[#14532D]" />
                    Unggah Foto Profil Guru
                  </button>
                  {tForm.fotoUrl && (
                    <button
                      type="button"
                      onClick={() => setTForm({ ...tForm, fotoUrl: '' })}
                      className="px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs font-semibold text-[#DC2626] cursor-pointer"
                    >
                      Hapus Foto
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A2420] mb-1">
                  Nama Lengkap &amp; Gelar
                </label>
                <input
                  type="text"
                  required
                  value={tForm.nama}
                  onChange={(e) => setTForm({ ...tForm, nama: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E7EB]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1A2420] mb-1">
                    Peran Hak Akses
                  </label>
                  <select
                    value={tForm.role}
                    onChange={(e) => {
                      const role = e.target.value as 'kepala_program' | 'wali_kelas';
                      setTForm({
                        ...tForm,
                        role,
                        jenjangAmpuan: role === 'kepala_program' ? [...ALL_JENJANG] : tForm.jenjangAmpuan,
                      });
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E7EB] bg-[#FAF8F5]"
                  >
                    <option value="wali_kelas">Wali Kelas / Pendamping</option>
                    <option value="kepala_program">Ketua Program (Semua Jenjang)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1A2420] mb-1">
                    Semester Tugas
                  </label>
                  <select
                    value={tForm.semesterAktif}
                    onChange={(e) =>
                      setTForm({ ...tForm, semesterAktif: Number(e.target.value) as Semester })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E7EB] bg-[#FAF8F5]"
                  >
                    <option value={1}>Semester 1</option>
                    <option value={2}>Semester 2</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1A2420] mb-1">
                    No. HP / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={tForm.noHp}
                    onChange={(e) => setTForm({ ...tForm, noHp: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E7EB]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1A2420] mb-1">
                    ID Login Khusus
                  </label>
                  <input
                    type="text"
                    required
                    value={tForm.loginId}
                    onChange={(e) => setTForm({ ...tForm, loginId: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-[#E5E7EB]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1A2420] mb-1">
                    PIN Akses
                  </label>
                  <input
                    type="text"
                    required
                    value={tForm.pin}
                    onChange={(e) => setTForm({ ...tForm, pin: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-[#E5E7EB]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A2420] mb-2">
                  Jenjang / Kelas yang Diampu
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ALL_JENJANG.map((j) => {
                    const checked = tForm.jenjangAmpuan.includes(j);
                    return (
                      <label
                        key={j}
                        className="flex items-center gap-2 text-xs p-2 rounded-lg border border-[#E5E7EB] cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            const next = checked
                              ? tForm.jenjangAmpuan.filter((item) => item !== j)
                              : [...tForm.jenjangAmpuan, j];
                            setTForm({ ...tForm, jenjangAmpuan: next as Jenjang[] });
                          }}
                          className="accent-[#14532D]"
                        />
                        <span>{j}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {errorMsg && <p className="text-xs text-[#DC2626]">{errorMsg}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTeacherModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#E5E7EB] text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-[#14532D] text-white text-xs font-semibold cursor-pointer"
                >
                  Simpan Guru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Create/Edit Modal */}
      {studentModal && (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] w-full max-w-lg max-h-[92vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <h3 className="text-base font-bold text-[#1A2420]">
                {editStudentId ? 'Edit Data Murid' : 'Tambah Murid & ID Orang Tua'}
              </h3>
              <button
                type="button"
                onClick={() => setStudentModal(false)}
                className="p-1.5 rounded-lg text-[#52605A] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={saveStudent} className="space-y-4">
              {/* Student Photo Upload */}
              <div className="flex items-center gap-4">
                <Avatar name={sForm.nama || 'Murid'} src={sForm.fotoUrl} size="xl" shape="rounded" />
                <div className="flex flex-wrap gap-2">
                  <input
                    ref={studentPhotoRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handlePhotoUpload(f, (url) => setSForm({ ...sForm, fotoUrl: url }));
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => studentPhotoRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs font-semibold text-[#1A2420] hover:bg-[#FAF8F5] cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5 text-[#14532D]" />
                    Unggah Foto Profil Murid
                  </button>
                  {sForm.fotoUrl && (
                    <button
                      type="button"
                      onClick={() => setSForm({ ...sForm, fotoUrl: '' })}
                      className="px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs font-semibold text-[#DC2626] cursor-pointer"
                    >
                      Hapus Foto
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#1A2420] mb-1">
                    Nama Lengkap Murid
                  </label>
                  <input
                    type="text"
                    required
                    value={sForm.nama}
                    onChange={(e) => setSForm({ ...sForm, nama: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E7EB]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1A2420] mb-1">
                    NIS
                  </label>
                  <input
                    type="text"
                    required
                    value={sForm.nis}
                    onChange={(e) => setSForm({ ...sForm, nis: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-[#E5E7EB]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1A2420] mb-1">
                    Jenjang / Kelas
                  </label>
                  <select
                    value={sForm.jenjang}
                    onChange={(e) => setSForm({ ...sForm, jenjang: e.target.value as Jenjang })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E7EB] bg-[#FAF8F5]"
                  >
                    {ALL_JENJANG.map((j) => (
                      <option key={j} value={j}>
                        {j}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1A2420] mb-1">
                    Semester
                  </label>
                  <select
                    value={sForm.semester}
                    onChange={(e) =>
                      setSForm({ ...sForm, semester: Number(e.target.value) as Semester })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E7EB] bg-[#FAF8F5]"
                  >
                    <option value={1}>Semester 1</option>
                    <option value={2}>Semester 2</option>
                  </select>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-[#1A2420] mb-1">
                    Wali Kelas
                  </label>
                  <select
                    value={sForm.waliKelasId}
                    onChange={(e) => setSForm({ ...sForm, waliKelasId: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E7EB] bg-[#FAF8F5]"
                  >
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nama}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1A2420] mb-1">
                    Nama Orang Tua / Wali
                  </label>
                  <input
                    type="text"
                    required
                    value={sForm.namaOrangTua}
                    onChange={(e) => setSForm({ ...sForm, namaOrangTua: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E7EB]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1A2420] mb-1">
                    No. HP Orang Tua
                  </label>
                  <input
                    type="text"
                    value={sForm.noHpOrangTua}
                    onChange={(e) => setSForm({ ...sForm, noHpOrangTua: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E7EB]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1A2420] mb-1">
                    ID Login Orang Tua / Murid
                  </label>
                  <input
                    type="text"
                    required
                    value={sForm.loginId}
                    onChange={(e) => setSForm({ ...sForm, loginId: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-[#E5E7EB]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1A2420] mb-1">
                    PIN Akses Wali Murid
                  </label>
                  <input
                    type="text"
                    required
                    value={sForm.pin}
                    onChange={(e) => setSForm({ ...sForm, pin: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-[#E5E7EB]"
                  />
                </div>
              </div>

              {errorMsg && <p className="text-xs text-[#DC2626]">{errorMsg}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStudentModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#E5E7EB] text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-[#14532D] text-white text-xs font-semibold cursor-pointer"
                >
                  Simpan Murid
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
