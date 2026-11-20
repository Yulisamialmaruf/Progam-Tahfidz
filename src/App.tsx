import { useCallback, useEffect, useState } from 'react';
import {
  Award,
  BookOpen,
  CalendarCheck2,
  FileSpreadsheet,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings2,
  X,
} from 'lucide-react';
import type {
  AuthUser,
  DailyLog,
  InstitutionSettings,
  MateriItem,
  MonthlyEvaluation,
  Semester,
  Student,
  Teacher,
  WeeklyEvaluation,
} from './types';
import { api } from './lib/api';
import { Avatar } from './components/Avatar';
import { LoginView } from './components/LoginView';
import { DashboardView, type NavSection } from './components/DashboardView';
import { MateriView } from './components/MateriView';
import { DailyLogView } from './components/DailyLogView';
import { EvaluationView } from './components/EvaluationView';
import { RaporView } from './components/RaporView';
import { AdminManagementView } from './components/AdminManagementView';

const DEFAULT_SETTINGS: InstitutionSettings = {
  namaYayasan: 'YAYASAN MIFTAHUL HUDA AL MA’RUF',
  aktaNotaris: 'AKTA NOTARIS NO. 52 MOCH. FARCHAN ALI IMRON TANGGAL 08 MEI 2015',
  namaMadrasah: 'RA & MI UNGGULAN AL MA’RUF',
  alamat:
    'Dusun Sumberjo Rt. 004 Rw. 006 Desa Mayahan Kec. Tawangharjo Kab. Grobogan, Prov. Jawatengah, 58191',
  kontak: 'No Telp. 081386292899. Email. Miunggulanalmarufmayahan1@gmail.com',
  logoUrl: '/assets/aistudio/1000435209_80ac9f58.png',
  tahunAjaranAktif: '2026/2027',
  semesterAktif: 1,
  namaKepalaMadrasah: 'Ustadz H. Ahmad Fauzan, S.Pd.I.',
  kotaRapor: 'Grobogan',
};

const ROLE_LABELS: Record<AuthUser['role'], string> = {
  admin: 'Admin Madrasah',
  kepala_program: 'Kepala / Ketua Program',
  wali_kelas: 'Guru Pendamping / Wali Kelas',
  orang_tua: 'Orang Tua / Murid',
};

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = sessionStorage.getItem('almaruf_auth_user');
      return saved ? (JSON.parse(saved) as AuthUser) : null;
    } catch {
      return null;
    }
  });

  const [section, setSection] = useState<NavSection>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [settings, setSettings] = useState<InstitutionSettings>(DEFAULT_SETTINGS);
  const [semesterFilter, setSemesterFilter] = useState<Semester>(1);
  const [materials, setMaterials] = useState<MateriItem[]>([]);
  const [teachers, setTeachers] = useState<Omit<Teacher, 'pin'>[]>([]);
  const [students, setStudents] = useState<Omit<Student, 'pin'>[]>([]);
  const [rawTeachers, setRawTeachers] = useState<Teacher[]>([]);
  const [rawStudents, setRawStudents] = useState<Student[]>([]);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [weeklyEvals, setWeeklyEvals] = useState<WeeklyEvaluation[]>([]);
  const [monthlyEvals, setMonthlyEvals] = useState<MonthlyEvaluation[]>([]);

  const loadData = useCallback(async (roleParam: string) => {
    setLoading(true);
    try {
      const data = await api.bootstrap(roleParam);
      setSettings(data.settings);
      setSemesterFilter(data.settings.semesterAktif || 1);
      setMaterials(data.materials);
      setTeachers(data.teachers);
      setStudents(data.students);
      setRawTeachers(data.rawTeachers || []);
      setRawStudents(data.rawStudents || []);
      setDailyLogs(data.dailyLogs);
      setWeeklyEvals(data.weeklyEvals);
      setMonthlyEvals(data.monthlyEvals);
    } catch {
      // handled gracefully
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(user?.role || '');
  }, [user?.role, loadData]);

  const handleLogin = (loggedUser: AuthUser) => {
    sessionStorage.setItem('almaruf_auth_user', JSON.stringify(loggedUser));
    setUser(loggedUser);
    setSection('dashboard');
  };

  const handleLogout = () => {
    sessionStorage.removeItem('almaruf_auth_user');
    setUser(null);
    setSection('dashboard');
  };

  if (!user) {
    return <LoginView settings={settings} onSuccess={handleLogin} />;
  }

  const navItems: Array<{ id: NavSection; label: string; shortLabel: string; icon: typeof LayoutDashboard }> = [
    { id: 'dashboard', label: 'Beranda Ringkasan', shortLabel: 'Beranda', icon: LayoutDashboard },
    { id: 'materi', label: 'Bank Materi & Audio', shortLabel: 'Materi', icon: BookOpen },
    { id: 'harian', label: 'Catatan Senin–Kamis', shortLabel: 'Harian', icon: CalendarCheck2 },
    { id: 'evaluasi', label: 'Evaluasi Jum’at & Bulan', shortLabel: 'Evaluasi', icon: Award },
    { id: 'rapor', label: 'Laporan & Rapor Resmi', shortLabel: 'Rapor', icon: FileSpreadsheet },
  ];

  if (user.role === 'admin') {
    navItems.push({
      id: 'manajemen',
      label: 'Kelola Guru, Murid & Sandi',
      shortLabel: 'Kelola',
      icon: Settings2,
    });
  }

  const activeNav = navItems.find((n) => n.id === section) || navItems[0];
  const childForParent =
    user.role === 'orang_tua' ? students.find((s) => s.id === user.studentId) : undefined;

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1A2420] flex">
      {/* Desktop Sidebar */}
      <aside className="no-print hidden lg:flex lg:flex-col lg:w-68 bg-white border-r border-[#E5E7EB] shrink-0 sticky top-0 h-screen">
        <div className="p-5 border-b border-[#E5E7EB] flex items-center gap-3">
          <img
            src={settings.logoUrl || DEFAULT_SETTINGS.logoUrl}
            alt="Logo Yayasan Miftahul Huda Al Ma'ruf"
            referrerPolicy="no-referrer"
            className="w-11 h-11 object-contain rounded-xl border border-[#E5E7EB] bg-[#FAF8F5] p-1 shrink-0"
          />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-[#15803D] truncate">
              {settings.namaYayasan}
            </p>
            <h1 className="text-sm font-bold text-[#1A2420] leading-snug">
              Program Tahfidz RA &amp; MI Unggulan Al Ma’ruf
            </h1>
          </div>
        </div>

        <nav className="flex-1 p-3.5 space-y-1 overflow-y-auto" aria-label="Navigasi Utama">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = section === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSection(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-[#14532D] text-white'
                    : 'text-[#52605A] hover:bg-[#FAF8F5] hover:text-[#1A2420]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#E5E7EB] space-y-3">
          <div className="flex items-center gap-3">
            <Avatar name={user.nama} src={user.fotoUrl} size="md" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#1A2420] truncate">{user.nama}</p>
              <p className="text-[11px] text-[#52605A] truncate">{ROLE_LABELS[user.role]}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-[#E5E7EB] text-xs font-semibold text-[#52605A] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Keluar Akun
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="no-print fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 w-72 max-w-[85vw] bg-white h-full flex flex-col border-r border-[#E5E7EB]">
            <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={settings.logoUrl || DEFAULT_SETTINGS.logoUrl}
                  alt="Logo Yayasan"
                  className="w-9 h-9 object-contain rounded-lg border border-[#E5E7EB] p-0.5 shrink-0"
                />
                <span className="text-xs font-bold text-[#1A2420] leading-snug">
                  Program Tahfidz RA &amp; MI Unggulan Al Ma’ruf
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg text-[#52605A] cursor-pointer"
                aria-label="Tutup menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 p-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = section === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSection(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold cursor-pointer ${
                      active
                        ? 'bg-[#14532D] text-white'
                        : 'text-[#52605A] hover:bg-[#FAF8F5]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="p-4 border-t border-[#E5E7EB] space-y-3">
              <div className="flex items-center gap-2.5">
                <Avatar name={user.nama} src={user.fotoUrl} size="sm" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#1A2420] truncate">{user.nama}</p>
                  <p className="text-[11px] text-[#52605A] truncate">{ROLE_LABELS[user.role]}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-[#E5E7EB] text-xs font-semibold text-[#DC2626] cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Keluar Akun
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Header */}
        <header className="no-print bg-white border-b border-[#E5E7EB] px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Buka menu navigasi"
              className="lg:hidden p-2 -ml-2 rounded-xl text-[#1A2420] hover:bg-[#FAF8F5] cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <img
              src={settings.logoUrl || DEFAULT_SETTINGS.logoUrl}
              alt="Logo Yayasan"
              referrerPolicy="no-referrer"
              className="lg:hidden w-8 h-8 object-contain rounded-lg border border-[#E5E7EB] bg-[#FAF8F5] p-0.5 shrink-0"
            />
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-[#1A2420] truncate">
                {activeNav.label}
              </h2>
            </div>
          </div>

          {/* Semester Toggle (2 Semesters in 1 Academic Year) */}
          <div className="flex items-center gap-3 shrink-0">
            <div
              role="group"
              aria-label="Pilih Semester"
              className="flex items-center gap-1 p-1 bg-[#FAF8F5] rounded-xl border border-[#E5E7EB]"
            >
              <button
                type="button"
                onClick={() => setSemesterFilter(1)}
                className={`px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  semesterFilter === 1
                    ? 'bg-[#14532D] text-white'
                    : 'text-[#52605A] hover:text-[#1A2420]'
                }`}
              >
                Sem 1
              </button>
              <button
                type="button"
                onClick={() => setSemesterFilter(2)}
                className={`px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  semesterFilter === 2
                    ? 'bg-[#14532D] text-white'
                    : 'text-[#52605A] hover:text-[#1A2420]'
                }`}
              >
                Sem 2
              </button>
            </div>
          </div>
        </header>

        {/* Viewport Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-10 max-w-7xl w-full mx-auto">
          {loading && materials.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 text-center text-sm text-[#52605A]">
              Memuat data Program Tahfidz RA &amp; MI Unggulan Al Ma’ruf...
            </div>
          ) : (
            <>
              {section === 'dashboard' && (
                <DashboardView
                  user={user}
                  settings={settings}
                  semesterFilter={semesterFilter}
                  students={students}
                  teachers={teachers}
                  materials={materials}
                  dailyLogs={dailyLogs}
                  weeklyEvals={weeklyEvals}
                  monthlyEvals={monthlyEvals}
                  onNavigate={setSection}
                />
              )}

              {section === 'materi' && (
                <MateriView
                  user={user}
                  materials={materials}
                  semesterFilter={semesterFilter}
                  defaultJenjang={childForParent?.jenjang || user.jenjangAmpuan?.[0]}
                  onMaterialsChange={setMaterials}
                />
              )}

              {section === 'harian' && (
                <DailyLogView
                  user={user}
                  settings={settings}
                  semesterFilter={semesterFilter}
                  students={students}
                  materials={materials}
                  dailyLogs={dailyLogs}
                  onLogsChange={setDailyLogs}
                />
              )}

              {section === 'evaluasi' && (
                <EvaluationView
                  user={user}
                  settings={settings}
                  semesterFilter={semesterFilter}
                  students={students}
                  materials={materials}
                  dailyLogs={dailyLogs}
                  weeklyEvals={weeklyEvals}
                  monthlyEvals={monthlyEvals}
                  onWeeklyChange={setWeeklyEvals}
                  onMonthlyChange={setMonthlyEvals}
                />
              )}

              {section === 'rapor' && (
                <RaporView
                  user={user}
                  settings={settings}
                  semesterFilter={semesterFilter}
                  students={students}
                  teachers={teachers}
                  materials={materials}
                  dailyLogs={dailyLogs}
                  weeklyEvals={weeklyEvals}
                  monthlyEvals={monthlyEvals}
                />
              )}

              {section === 'manajemen' && user.role === 'admin' && (
                <AdminManagementView
                  settings={settings}
                  teachers={rawTeachers}
                  students={rawStudents}
                  onSettingsChange={setSettings}
                  onTeachersChange={(next) => {
                    setRawTeachers(next);
                    setTeachers(next.map(({ pin: _p, ...rest }) => rest));
                  }}
                  onStudentsChange={(next) => {
                    setRawStudents(next);
                    setStudents(next.map(({ pin: _p, ...rest }) => rest));
                  }}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Compact <= 64px height) */}
      <nav
        aria-label="Navigasi Bawah Ponsel"
        className={`no-print lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-[#E5E7EB] grid ${
          navItems.length === 6 ? 'grid-cols-6' : 'grid-cols-5'
        }`}
      >
        {navItems.slice(0, user.role === 'admin' ? 6 : 5).map((item) => {
          const Icon = item.icon;
          const active = section === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              className={`py-2 px-1 flex flex-col items-center justify-center gap-1 text-[10px] font-semibold cursor-pointer min-h-[54px] ${
                active ? 'text-[#14532D]' : 'text-[#52605A]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="truncate max-w-full">{item.shortLabel}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
