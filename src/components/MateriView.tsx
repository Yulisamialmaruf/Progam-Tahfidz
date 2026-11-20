import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { BookOpen, Edit3, Play, Plus, Search, Trash2, Volume2, X } from 'lucide-react';
import {
  ALL_JENJANG,
  type AuthUser,
  type Jenjang,
  type KategoriMateri,
  type MateriItem,
  type Semester,
} from '../types';
import { api } from '../lib/api';
import { AudioPlayer } from './AudioPlayer';
import { AudioRecorder } from './AudioRecorder';

interface MateriViewProps {
  user: AuthUser;
  materials: MateriItem[];
  semesterFilter: Semester;
  defaultJenjang?: Jenjang;
  onMaterialsChange: (next: MateriItem[]) => void;
}

const EMPTY_FORM: Omit<MateriItem, 'id'> = {
  kategori: 'Juz 30',
  judul: '',
  subJudul: '',
  jenjang: 'RA A',
  semester: 1,
  urutan: 1,
  teksArab: '',
  arti: '',
  catatanTajwid: '',
  audioUrl: '',
  audioLabel: '',
};

export function MateriView({
  user,
  materials,
  semesterFilter,
  defaultJenjang,
  onMaterialsChange,
}: MateriViewProps) {
  const isAdmin = user.role === 'admin';
  const [kategori, setKategori] = useState<'Semua' | KategoriMateri>('Semua');
  const [jenjangFilter, setJenjangFilter] = useState<'Semua' | Jenjang>(defaultJenjang || 'Semua');
  const [semFilter, setSemFilter] = useState<'Semua' | Semester>(semesterFilter);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string>(materials[0]?.id || '');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<MateriItem, 'id'>>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [activeTrackIdx, setActiveTrackIdx] = useState(0);
  const [playlistViewMode, setPlaylistViewMode] = useState<'single' | 'all'>('single');
  const [externalTrackSelect, setExternalTrackSelect] = useState<{
    index: number;
    play: boolean;
    nonce: number;
  } | null>(null);
  const detailRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setSemFilter(semesterFilter);
  }, [semesterFilter]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return materials
      .filter((m) => (kategori === 'Semua' ? true : m.kategori === kategori))
      .filter((m) => (jenjangFilter === 'Semua' ? true : m.jenjang === jenjangFilter))
      .filter((m) => (semFilter === 'Semua' ? true : m.semester === semFilter))
      .filter(
        (m) =>
          !q ||
          m.judul.toLowerCase().includes(q) ||
          m.subJudul.toLowerCase().includes(q) ||
          m.arti.toLowerCase().includes(q) ||
          m.audioPlaylist?.some((t) => t.title.toLowerCase().includes(q)),
      )
      .sort((a, b) => a.urutan - b.urutan);
  }, [materials, kategori, jenjangFilter, semFilter, search]);

  const activeMateri =
    filtered.find((m) => m.id === selectedId) || filtered[0] || null;

  useEffect(() => {
    setActiveTrackIdx(0);
    setExternalTrackSelect(null);
    setPlaylistViewMode('single');
  }, [activeMateri?.id]);

  const activePlaylist = activeMateri?.audioPlaylist;
  const activeTrack =
    activePlaylist && activePlaylist.length > 0
      ? activePlaylist[Math.min(activeTrackIdx, activePlaylist.length - 1)]
      : null;

  const openCreateModal = () => {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      jenjang: jenjangFilter === 'Semua' ? 'RA A' : jenjangFilter,
      semester: semFilter === 'Semua' ? 1 : semFilter,
      urutan: materials.length + 1,
    });
    setErrorMsg('');
    setModalOpen(true);
  };

  const openEditModal = (item: MateriItem) => {
    setEditingId(item.id);
    setForm({
      kategori: item.kategori,
      judul: item.judul,
      subJudul: item.subJudul,
      jenjang: item.jenjang,
      semester: item.semester,
      urutan: item.urutan,
      teksArab: item.teksArab,
      arti: item.arti,
      catatanTajwid: item.catatanTajwid,
      audioUrl: item.audioUrl || '',
      audioLabel: item.audioLabel || '',
      audioPlaylist: item.audioPlaylist,
    });
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    try {
      if (editingId) {
        const updated = await api.updateMateri(editingId, form);
        onMaterialsChange(materials.map((m) => (m.id === editingId ? updated : m)));
        setSelectedId(updated.id);
      } else {
        const created = await api.createMateri(form);
        onMaterialsChange([...materials, created]);
        setSelectedId(created.id);
      }
      setModalOpen(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal menyimpan materi.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async (item: MateriItem) => {
    try {
      await api.deleteMateri(item.id);
      const next = materials.filter((m) => m.id !== item.id);
      onMaterialsChange(next);
      setConfirmDeleteId(null);
      if (selectedId === item.id) {
        setSelectedId(next[0]?.id || '');
      }
    } catch {
      setConfirmDeleteId(null);
    }
  };

  const handleSelectMateri = (id: string) => {
    setSelectedId(id);
    setConfirmDeleteId(null);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="space-y-5">
      {/* Filter Toolbar */}
      <section className="bg-white rounded-2xl border border-[#E5E7EB] p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#1A2420]">
              Bank Rangkuman Materi &amp; Audio Panduan
            </h2>
            <p className="text-xs text-[#52605A]">
              Kurikulum berjenjang Juz 30 serta Doa Harian &amp; Bacaan Ibadah (Semester 1 &amp; 2)
            </p>
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#14532D] text-white text-xs font-semibold hover:bg-[#15803D] cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              Tambah Materi Baru
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Category Segmented Tabs */}
          <div className="md:col-span-4 flex items-center gap-1 p-1 bg-[#FAF8F5] rounded-xl border border-[#E5E7EB]">
            {(['Semua', 'Juz 30', 'Doa Harian'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setKategori(tab)}
                className={`flex-1 py-2 px-2.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  kategori === tab
                    ? 'bg-white text-[#14532D] border border-[#E5E7EB]'
                    : 'text-[#52605A] hover:text-[#1A2420]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="md:col-span-3">
            <select
              aria-label="Filter Jenjang"
              value={jenjangFilter}
              onChange={(e) => setJenjangFilter(e.target.value as 'Semua' | Jenjang)}
              className="w-full px-3 py-2.5 text-xs font-medium rounded-xl border border-[#E5E7EB] bg-[#FAF8F5] text-[#1A2420] focus:outline-none focus:border-[#14532D]"
            >
              <option value="Semua">Semua Jenjang (RA A – MI 6)</option>
              {ALL_JENJANG.map((j) => (
                <option key={j} value={j}>
                  {j}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              aria-label="Filter Semester"
              value={semFilter}
              onChange={(e) =>
                setSemFilter(e.target.value === 'Semua' ? 'Semua' : (Number(e.target.value) as Semester))
              }
              className="w-full px-3 py-2.5 text-xs font-medium rounded-xl border border-[#E5E7EB] bg-[#FAF8F5] text-[#1A2420] focus:outline-none focus:border-[#14532D]"
            >
              <option value="Semua">Semua Semester</option>
              <option value={1}>Semester 1</option>
              <option value={2}>Semester 2</option>
            </select>
          </div>

          <div className="md:col-span-3 relative">
            <Search className="w-4 h-4 text-[#52605A] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari surah atau doa..."
              className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-[#E5E7EB] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:border-[#14532D]"
            />
          </div>
        </div>
      </section>

      {/* Master-Detail Split Layout */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* List Column */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center justify-between bg-[#FAF8F5]">
            <span className="text-xs font-semibold text-[#52605A]">
              Daftar Materi ({filtered.length})
            </span>
          </div>
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#52605A]">
              Tidak ada materi yang sesuai filter.
            </div>
          ) : (
            <div className="divide-y divide-[#E5E7EB] max-h-[340px] lg:max-h-[620px] overflow-y-auto">
              {filtered.map((item) => {
                const isSelected = activeMateri?.id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectMateri(item.id)}
                    className={`w-full text-left px-4 py-3.5 transition-colors cursor-pointer flex items-start justify-between gap-3 ${
                      isSelected ? 'bg-[#14532D]/6' : 'hover:bg-[#FAF8F5]'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-[#52605A]">
                        {item.kategori} · {item.jenjang} · Sem {item.semester}
                      </p>
                      <p
                        className={`text-sm font-semibold mt-0.5 truncate ${
                          isSelected ? 'text-[#14532D]' : 'text-[#1A2420]'
                        }`}
                      >
                        {item.judul}
                      </p>
                      <p className="text-xs text-[#52605A] truncate mt-0.5">
                        {item.subJudul}
                      </p>
                    </div>
                    {(item.audioUrl || (item.audioPlaylist && item.audioPlaylist.length > 0)) && (
                      <Volume2
                        className="w-4 h-4 text-[#C59B27] shrink-0 mt-1"
                        aria-label="Memiliki berkas audio"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Detail Reader Column */}
        <div
          ref={detailRef}
          className="lg:col-span-7 bg-white rounded-2xl border border-[#E5E7EB] p-5 sm:p-7"
        >
          {activeMateri ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
                <div>
                  <p className="text-xs font-medium text-[#15803D]">
                    {activeMateri.kategori} · {activeMateri.jenjang} · Semester {activeMateri.semester}
                  </p>
                  <h3 className="text-xl sm:text-2xl font-bold text-[#1A2420] mt-1">
                    {activeMateri.judul}
                  </h3>
                  <p className="text-xs text-[#52605A] mt-0.5">{activeMateri.subJudul}</p>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditModal(activeMateri)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E5E7EB] bg-[#FAF8F5] text-xs font-semibold text-[#1A2420] hover:bg-[#F3F6F4] cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#14532D]" />
                      Edit
                    </button>
                    {confirmDeleteId === activeMateri.id ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleConfirmDelete(activeMateri)}
                          className="px-3 py-2 rounded-xl bg-[#DC2626] text-white text-xs font-semibold hover:bg-[#B91C1C] cursor-pointer"
                        >
                          Yakin Hapus
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs font-semibold text-[#52605A] cursor-pointer"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(activeMateri.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#DC2626]/25 bg-[#FEF2F2] text-xs font-semibold text-[#DC2626] hover:bg-[#FEE2E2] cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Hapus
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Audio Player */}
              <AudioPlayer
                audioUrl={activeMateri.audioUrl}
                audioLabel={activeMateri.audioLabel}
                playlist={activeMateri.audioPlaylist}
                externalSelect={externalTrackSelect}
                onTrackChange={setActiveTrackIdx}
                title={activeMateri.judul}
                arabicText={activeTrack?.teksArab || activeMateri.teksArab}
              />

              {/* Per-Surah / Full Playlist Reader */}
              {activePlaylist && activePlaylist.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-[#14532D]">
                      Teks Arab &amp; Terjemahan Per Surat ({activePlaylist.length} Surat)
                    </p>
                    <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#FAF8F5] border border-[#E5E7EB]">
                      <button
                        type="button"
                        onClick={() => setPlaylistViewMode('single')}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          playlistViewMode === 'single'
                            ? 'bg-white text-[#14532D] border border-[#E5E7EB]'
                            : 'text-[#52605A] hover:text-[#1A2420]'
                        }`}
                      >
                        Per Surat (Aktif)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPlaylistViewMode('all')}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          playlistViewMode === 'all'
                            ? 'bg-white text-[#14532D] border border-[#E5E7EB]'
                            : 'text-[#52605A] hover:text-[#1A2420]'
                        }`}
                      >
                        Semua Surat Lengkap
                      </button>
                    </div>
                  </div>

                  {playlistViewMode === 'single' && activeTrack ? (
                    <>
                      <div className="rounded-2xl bg-[#FAF8F5] border border-[#E5E7EB] p-5 sm:p-6 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E5E7EB]">
                          <div>
                            <h4 className="text-sm font-bold text-[#14532D]">
                              {activeTrackIdx + 1}. {activeTrack.title}
                            </h4>
                            {activeTrack.subtitle && (
                              <p className="text-xs text-[#52605A]">{activeTrack.subtitle}</p>
                            )}
                          </div>
                          <span className="text-[11px] font-mono text-[#52605A]">
                            Surat {activeTrackIdx + 1} dari {activePlaylist.length}
                          </span>
                        </div>
                        <p className="font-arabic text-2xl sm:text-3xl text-[#1A2420] text-right leading-[2.3] whitespace-pre-line">
                          {activeTrack.teksArab || activeMateri.teksArab}
                        </p>
                      </div>

                      <div className="space-y-4 text-sm">
                        <div>
                          <h4 className="text-xs font-semibold text-[#52605A] mb-1">
                            Arti / Terjemahan — {activeTrack.title}
                          </h4>
                          <p className="text-[#1A2420] leading-relaxed">
                            {activeTrack.arti || activeMateri.arti}
                          </p>
                        </div>
                        {activeMateri.catatanTajwid && (
                          <div className="pt-3 border-t border-[#E5E7EB]">
                            <h4 className="text-xs font-semibold text-[#14532D] mb-1">
                              Catatan Tajwid &amp; Adab Pembimbing
                            </h4>
                            <p className="text-xs text-[#52605A] leading-relaxed">
                              {activeMateri.catatanTajwid}
                            </p>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      {activePlaylist.map((track, idx) => {
                        const isPlayingTrack = idx === activeTrackIdx;
                        return (
                          <div
                            key={track.audioUrl + idx}
                            className={`rounded-2xl border p-4 sm:p-5 space-y-3 ${
                              isPlayingTrack
                                ? 'bg-[#FAF8F5] border-[#14532D]/40'
                                : 'bg-[#FAF8F5] border-[#E5E7EB]'
                            }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#E5E7EB]">
                              <div>
                                <h4 className="text-sm font-bold text-[#1A2420]">
                                  {idx + 1}. {track.title}
                                </h4>
                                {track.subtitle && (
                                  <p className="text-xs text-[#52605A]">{track.subtitle}</p>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setExternalTrackSelect({
                                    index: idx,
                                    play: true,
                                    nonce: Date.now(),
                                  })
                                }
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                                  isPlayingTrack
                                    ? 'bg-[#14532D] text-white'
                                    : 'bg-white text-[#14532D] border border-[#E5E7EB] hover:bg-[#F3F6F4]'
                                }`}
                              >
                                <Play className="w-3.5 h-3.5" />
                                {isPlayingTrack ? 'Sedang Dipilih' : 'Putar Audio'}
                              </button>
                            </div>
                            <p className="font-arabic text-2xl text-[#1A2420] text-right leading-[2.3] whitespace-pre-line">
                              {track.teksArab || activeMateri.teksArab}
                            </p>
                            {track.arti && (
                              <div className="pt-2 border-t border-[#E5E7EB]">
                                <p className="text-xs text-[#52605A] leading-relaxed">
                                  {track.arti}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {activeMateri.catatanTajwid && (
                        <div className="pt-3 border-t border-[#E5E7EB]">
                          <h4 className="text-xs font-semibold text-[#14532D] mb-1">
                            Catatan Tajwid &amp; Adab Pembimbing
                          </h4>
                          <p className="text-xs text-[#52605A] leading-relaxed">
                            {activeMateri.catatanTajwid}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Arabic Text */}
                  <div className="rounded-2xl bg-[#FAF8F5] border border-[#E5E7EB] p-5 sm:p-6">
                    <p className="font-arabic text-2xl sm:text-3xl text-[#1A2420] text-right leading-[2.3] whitespace-pre-line">
                      {activeMateri.teksArab}
                    </p>
                  </div>

                  {/* Meaning & Tajwid Notes */}
                  <div className="space-y-4 text-sm">
                    <div>
                      <h4 className="text-xs font-semibold text-[#52605A] mb-1">
                        Arti / Terjemahan
                      </h4>
                      <p className="text-[#1A2420] leading-relaxed">{activeMateri.arti}</p>
                    </div>
                    {activeMateri.catatanTajwid && (
                      <div className="pt-3 border-t border-[#E5E7EB]">
                        <h4 className="text-xs font-semibold text-[#14532D] mb-1">
                          Catatan Tajwid &amp; Adab Pembimbing
                        </h4>
                        <p className="text-xs text-[#52605A] leading-relaxed">
                          {activeMateri.catatanTajwid}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-[#52605A] space-y-2">
              <BookOpen className="w-8 h-8 mx-auto text-[#52605A]/50" />
              <p className="text-sm">Pilih materi di sebelah kiri untuk membaca dan memutar audio.</p>
            </div>
          )}
        </div>
      </section>

      {/* Admin Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] w-full max-w-2xl max-h-[92vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <h3 className="text-lg font-bold text-[#1A2420]">
                {editingId ? 'Edit Materi Tahfidz / Doa' : 'Tambah Materi Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-lg text-[#52605A] hover:bg-[#FAF8F5] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1A2420] mb-1">
                    Kategori
                  </label>
                  <select
                    value={form.kategori}
                    onChange={(e) => setForm({ ...form, kategori: e.target.value as KategoriMateri })}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-[#E5E7EB] bg-[#FAF8F5]"
                  >
                    <option value="Juz 30">Juz 30</option>
                    <option value="Doa Harian">Doa Harian</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1A2420] mb-1">
                    Jenjang
                  </label>
                  <select
                    value={form.jenjang}
                    onChange={(e) => setForm({ ...form, jenjang: e.target.value as Jenjang })}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-[#E5E7EB] bg-[#FAF8F5]"
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
                    value={form.semester}
                    onChange={(e) => setForm({ ...form, semester: Number(e.target.value) as Semester })}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-[#E5E7EB] bg-[#FAF8F5]"
                  >
                    <option value={1}>Semester 1</option>
                    <option value={2}>Semester 2</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#1A2420] mb-1">
                    Judul Materi / Surah / Doa
                  </label>
                  <input
                    type="text"
                    required
                    value={form.judul}
                    onChange={(e) => setForm({ ...form, judul: e.target.value })}
                    placeholder="Contoh: Surah Al-Ikhlas atau Doa Sebelum Tidur"
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-[#E5E7EB]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1A2420] mb-1">
                    Sub Judul / Keterangan
                  </label>
                  <input
                    type="text"
                    value={form.subJudul}
                    onChange={(e) => setForm({ ...form, subJudul: e.target.value })}
                    placeholder="QS. 112 · 4 Ayat"
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-[#E5E7EB]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A2420] mb-1">
                  Teks Arab
                </label>
                <textarea
                  rows={3}
                  required
                  value={form.teksArab}
                  onChange={(e) => setForm({ ...form, teksArab: e.target.value })}
                  placeholder="Tulis atau tempel teks Arab..."
                  className="w-full px-3 py-2.5 text-lg font-arabic rounded-xl border border-[#E5E7EB]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A2420] mb-1">
                  Arti / Terjemahan Bahasa Indonesia
                </label>
                <textarea
                  rows={2}
                  value={form.arti}
                  onChange={(e) => setForm({ ...form, arti: e.target.value })}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-[#E5E7EB]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A2420] mb-1">
                  Catatan Tajwid / Adab
                </label>
                <input
                  type="text"
                  value={form.catatanTajwid}
                  onChange={(e) => setForm({ ...form, catatanTajwid: e.target.value })}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-[#E5E7EB]"
                />
              </div>

              <AudioRecorder
                audioUrl={form.audioUrl}
                audioLabel={form.audioLabel}
                onChange={(audioUrl, audioLabel) => setForm({ ...form, audioUrl, audioLabel })}
              />

              {errorMsg && <p className="text-xs text-[#DC2626]">{errorMsg}</p>}

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#E5E7EB] text-xs font-semibold text-[#52605A] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-[#14532D] text-white text-xs font-semibold hover:bg-[#15803D] disabled:opacity-60 cursor-pointer"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Materi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
