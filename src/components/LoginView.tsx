import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, KeyRound, LockKeyhole, LogIn, ShieldCheck, UserCheck, Users, GraduationCap } from 'lucide-react';
import type { AuthUser, InstitutionSettings } from '../types';
import { api } from '../lib/api';

interface LoginViewProps {
  settings: InstitutionSettings;
  onSuccess: (user: AuthUser) => void;
}

const QUICK_ACCOUNTS = [
  {
    label: 'Admin Madrasah',
    sub: 'ADMIN-ALMARUF',
    loginId: 'ADMIN-ALMARUF',
    pass: 'almaruf2026',
    icon: ShieldCheck,
  },
  {
    label: 'Kepala Program',
    sub: 'KEPALA-ALMARUF (Semua Jenjang)',
    loginId: 'KEPALA-ALMARUF',
    pass: '123456',
    icon: UserCheck,
  },
  {
    label: 'Wali Kelas RA A',
    sub: 'GURU-RAA',
    loginId: 'GURU-RAA',
    pass: '123456',
    icon: Users,
  },
  {
    label: 'Orang Tua / Murid',
    sub: 'ORTU-RAA-01 (Aisyah)',
    loginId: 'ORTU-RAA-01',
    pass: '123456',
    icon: GraduationCap,
  },
];

export function LoginView({ settings, onSuccess }: LoginViewProps) {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const { user } = await api.login(loginId, password);
      onSuccess(user);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal masuk.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (id: string, pass: string) => {
    setLoginId(id);
    setPassword(pass);
    setErrorMsg('');
    setLoading(true);
    try {
      const { user } = await api.login(id, pass);
      onSuccess(user);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal masuk.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-4 sm:p-6 lg:p-10">
      <div className="w-full max-w-5xl bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
        {/* Left Identity Panel */}
        <div className="lg:col-span-5 bg-[#14532D] text-white p-7 sm:p-9 flex flex-col justify-between relative overflow-hidden">
          <svg
            aria-hidden="true"
            viewBox="0 0 400 500"
            className="absolute inset-0 w-full h-full object-cover opacity-[0.07] pointer-events-none"
          >
            <defs>
              <pattern id="khatam-grid" width="80" height="80" patternUnits="userSpaceOnUse">
                <path
                  d="M40 4 L52 28 L76 40 L52 52 L40 76 L28 52 L4 40 L28 28 Z"
                  fill="none"
                  stroke="#D4AF37"
                  strokeWidth="1.2"
                />
                <rect
                  x="20"
                  y="20"
                  width="40"
                  height="40"
                  fill="none"
                  stroke="#D4AF37"
                  strokeWidth="0.8"
                />
              </pattern>
            </defs>
            <rect width="400" height="500" fill="url(#khatam-grid)" />
          </svg>

          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-white p-1.5 border border-[#D4AF37]/40 shrink-0 flex items-center justify-center">
                <img
                  src={settings.logoUrl || '/assets/aistudio/1000435209_80ac9f58.png'}
                  alt="Logo Yayasan Miftahul Huda Al Ma'ruf"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <p className="text-xs font-medium text-[#F2D57E] tracking-wide">
                  {settings.namaYayasan}
                </p>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight leading-snug text-white">
                  Program Tahfidz RA &amp; MI Unggulan Al Ma’ruf
                </h1>
              </div>
            </div>

            <div className="h-px bg-white/15" />

            <p className="text-sm text-white/90 leading-relaxed">
              Sistem terpadu pengelolaan kurikulum tahfidz Juz 30 dan doa harian, pencatatan setoran harian (Senin–Kamis), evaluasi mingguan Jum’at, evaluasi bulanan, serta rapor resmi dua semester.
            </p>
          </div>

          <div className="relative z-10 mt-8 pt-6 border-t border-white/15 space-y-1.5 text-xs text-white/80">
            <p className="font-semibold text-[#F2D57E]">
              {settings.namaMadrasah} · TA {settings.tahunAjaranAktif}
            </p>
            <p className="leading-relaxed">{settings.alamat}</p>
            <p>{settings.kontak}</p>
          </div>
        </div>

        {/* Right Login Form Panel */}
        <div className="lg:col-span-7 p-7 sm:p-10 flex flex-col justify-between bg-white">
          <div>
            <div className="mb-6">
              <p className="text-xs font-semibold text-[#14532D] mb-1">
                Portal Akses Terpadu
              </p>
              <h2 className="text-2xl font-bold text-[#1A2420] tracking-tight">
                Masuk ke Akun Anda
              </h2>
              <p className="text-sm text-[#52605A] mt-1">
                Gunakan ID Login dan Kata Sandi / PIN yang ditetapkan oleh Admin Madrasah.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="login-id"
                  className="block text-xs font-semibold text-[#1A2420] mb-1.5"
                >
                  ID Login (Admin / Guru / Wali Murid)
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[#52605A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="login-id"
                    type="text"
                    required
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    placeholder="Contoh: ADMIN-ALMARUF, GURU-RAA, ORTU-RAA-01"
                    className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-[#E5E7EB] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:border-[#14532D] font-mono"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="login-pass"
                  className="block text-xs font-semibold text-[#1A2420] mb-1.5"
                >
                  Kata Sandi / PIN Akses
                </label>
                <div className="relative">
                  <LockKeyhole className="w-4 h-4 text-[#52605A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="login-pass"
                    type={showPass ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi atau PIN"
                    className="w-full pl-10 pr-11 py-3 text-sm rounded-xl border border-[#E5E7EB] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:border-[#14532D]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    aria-label={showPass ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#52605A] hover:text-[#1A2420] cursor-pointer"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div
                  role="alert"
                  className="rounded-xl border border-[#DC2626]/30 bg-[#FEF2F2] px-4 py-3 text-xs font-medium text-[#B91C1C]"
                >
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-5 rounded-xl bg-[#14532D] text-white text-sm font-semibold hover:bg-[#14532D] transition-colors flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>{loading ? 'Memeriksa Akses...' : 'Masuk Aplikasi'}</span>
              </button>
            </form>
          </div>

          {/* Quick Demo Role Access */}
          <div className="mt-7 pt-6 border-t border-[#E5E7EB]">
            <p className="text-xs font-semibold text-[#52605A] mb-3">
              Uji Coba Cepat Peran Pengguna (Demo Data Siap Pakai)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {QUICK_ACCOUNTS.map((acc) => {
                const Icon = acc.icon;
                return (
                  <button
                    key={acc.loginId}
                    type="button"
                    disabled={loading}
                    onClick={() => handleQuickLogin(acc.loginId, acc.pass)}
                    className="flex items-center gap-3 p-3 rounded-xl border border-[#E5E7EB] bg-[#FAF8F5] hover:bg-[#14532D]/5 hover:border-[#14532D]/40 transition-colors text-left cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-lg bg-white border border-[#E5E7EB] flex items-center justify-center text-[#14532D] shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#1A2420] truncate">
                        {acc.label}
                      </p>
                      <p className="text-[11px] font-mono text-[#52605A] truncate">
                        {acc.sub}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
