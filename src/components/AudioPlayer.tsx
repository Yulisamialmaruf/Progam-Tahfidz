import { useEffect, useRef, useState } from 'react';
import { Pause, Play, Volume2, RotateCcw, SkipBack, SkipForward, ListMusic } from 'lucide-react';
import type { AudioTrack } from '../types';

interface AudioPlayerProps {
  audioUrl?: string;
  audioLabel?: string;
  playlist?: AudioTrack[];
  externalSelect?: { index: number; play: boolean; nonce: number } | null;
  onTrackChange?: (index: number) => void;
  title: string;
  arabicText: string;
}

export function AudioPlayer({
  audioUrl,
  audioLabel,
  playlist,
  externalSelect,
  onTrackChange,
  title,
  arabicText,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const autoPlayNextRef = useRef(false);
  const [trackIndex, setTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [errorMsg, setErrorMsg] = useState('');
  const [audioFailed, setAudioFailed] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const hasPlaylist = Boolean(playlist && playlist.length > 0);
  const activeTrack = hasPlaylist ? playlist![Math.min(trackIndex, playlist!.length - 1)] : null;
  const effectiveAudioUrl = activeTrack ? activeTrack.audioUrl : audioUrl;
  const effectiveAudioLabel = activeTrack
    ? activeTrack.audioLabel || activeTrack.title
    : audioLabel;

  useEffect(() => {
    setTrackIndex(0);
    onTrackChange?.(0);
    autoPlayNextRef.current = false;
    setIsPlaying(false);
    setProgress(0);
    setDuration(0);
    setErrorMsg('');
    setAudioFailed(false);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [audioUrl, title, playlist]);

  useEffect(() => {
    if (!externalSelect || !playlist || externalSelect.index < 0 || externalSelect.index >= playlist.length) {
      return;
    }
    autoPlayNextRef.current = externalSelect.play;
    setIsPlaying(false);
    setProgress(0);
    setDuration(0);
    setErrorMsg('');
    setAudioFailed(false);
    setTrackIndex(externalSelect.index);
    onTrackChange?.(externalSelect.index);
  }, [externalSelect]);

  useEffect(() => {
    if (!effectiveAudioUrl || !autoPlayNextRef.current || !audioRef.current) return;
    autoPlayNextRef.current = false;
    audioRef.current.playbackRate = playbackRate;
    audioRef.current
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false));
  }, [trackIndex, effectiveAudioUrl, playbackRate]);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const formatTime = (sec: number) => {
    if (!Number.isFinite(sec) || sec <= 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const selectTrack = (nextIdx: number, shouldPlay = true) => {
    if (!playlist || nextIdx < 0 || nextIdx >= playlist.length) return;
    autoPlayNextRef.current = shouldPlay;
    setIsPlaying(false);
    setProgress(0);
    setDuration(0);
    setErrorMsg('');
    setAudioFailed(false);
    setTrackIndex(nextIdx);
    onTrackChange?.(nextIdx);
  };

  const togglePlayAudioFile = async () => {
    if (!audioRef.current) return;
    setErrorMsg('');
    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.playbackRate = playbackRate;
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch {
      setAudioFailed(true);
      setErrorMsg('Tautan audio belum dapat diakses langsung; gunakan panduan suara otomatis di bawah.');
      setIsPlaying(false);
    }
  };

  const toggleSpeechFallback = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setErrorMsg('Fitur pemutar suara otomatis tidak didukung peramban ini.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const voices = window.speechSynthesis.getVoices();
    const hasArabicVoice = voices.some((v) => v.lang.toLowerCase().startsWith('ar'));

    const speechSource = activeTrack?.teksArab || arabicText;
    const utterance = new SpeechSynthesisUtterance(
      hasArabicVoice ? speechSource.replace(/[۝﴿﴾٠-٩]/g, ' ').replace(/\s+/g, ' ').trim() : title,
    );
    utterance.lang = hasArabicVoice ? 'ar-SA' : 'id-ID';
    utterance.rate = playbackRate === 0.75 ? 0.78 : 0.92;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => {
      setIsSpeaking(false);
      setErrorMsg('Peramban belum menyediakan suara pembacaan. Admin dapat mengunggah rekaman MP3.');
    };

    setErrorMsg('');
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleSpeedToggle = () => {
    const next = playbackRate === 1 ? 0.75 : 1;
    setPlaybackRate(next);
    if (audioRef.current) {
      audioRef.current.playbackRate = next;
    }
  };

  if (effectiveAudioUrl && !audioFailed) {
    return (
      <div className="rounded-xl border border-[#E5E7EB] bg-[#FAF8F5] p-3.5 space-y-3">
        <audio
          ref={audioRef}
          src={effectiveAudioUrl}
          preload="metadata"
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime)}
          onEnded={() => {
            if (hasPlaylist && trackIndex + 1 < playlist!.length) {
              selectTrack(trackIndex + 1, true);
            } else {
              setIsPlaying(false);
              setProgress(0);
            }
          }}
          onError={() => {
            setIsPlaying(false);
            setAudioFailed(true);
            setErrorMsg('Tautan audio eksternal tidak dapat dimuat. Beralih ke panduan suara otomatis.');
          }}
        />
        <div className="flex items-center gap-2.5 sm:gap-3">
          {hasPlaylist && (
            <button
              type="button"
              onClick={() => selectTrack(trackIndex - 1, isPlaying)}
              disabled={trackIndex === 0}
              aria-label="Surah sebelumnya"
              className="w-9 h-9 rounded-lg border border-[#E5E7EB] bg-white text-[#1A2420] flex items-center justify-center hover:bg-[#F3F6F4] disabled:opacity-40 cursor-pointer shrink-0"
              title="Surah sebelumnya"
            >
              <SkipBack className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={togglePlayAudioFile}
            aria-label={isPlaying ? `Jeda audio ${title}` : `Putar audio ${title}`}
            className="w-11 h-11 rounded-xl bg-[#14532D] text-white flex items-center justify-center hover:bg-[#15803D] transition-colors shrink-0 cursor-pointer"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>

          {hasPlaylist && (
            <button
              type="button"
              onClick={() => selectTrack(trackIndex + 1, isPlaying)}
              disabled={trackIndex >= playlist!.length - 1}
              aria-label="Surah berikutnya"
              className="w-9 h-9 rounded-lg border border-[#E5E7EB] bg-white text-[#1A2420] flex items-center justify-center hover:bg-[#F3F6F4] disabled:opacity-40 cursor-pointer shrink-0"
              title="Surah berikutnya"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
              <span className="font-semibold text-[#1A2420] truncate flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-[#15803D] shrink-0" />
                {effectiveAudioLabel || 'Audio Murottal / Panduan'}
              </span>
              <span className="font-mono tabular-nums text-[#52605A] shrink-0">
                {formatTime(progress)} / {formatTime(duration)}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={progress}
              onChange={(e) => {
                const val = Number(e.target.value);
                setProgress(val);
                if (audioRef.current) audioRef.current.currentTime = val;
              }}
              aria-label="Posisi audio"
              className="w-full accent-[#14532D] h-1.5 bg-[#E5E7EB] rounded-lg cursor-pointer"
            />
          </div>

          <button
            type="button"
            onClick={handleSpeedToggle}
            className="px-2.5 py-2 text-xs font-mono font-medium rounded-lg border border-[#E5E7EB] bg-white text-[#1A2420] hover:bg-[#F3F6F4] shrink-0 cursor-pointer"
            title="Ubah kecepatan bacaan"
          >
            {playbackRate}x
          </button>
        </div>

        {hasPlaylist && (
          <div className="pt-2.5 border-t border-[#E5E7EB] space-y-2">
            <div className="flex items-center justify-between gap-2 text-[11px] text-[#52605A]">
              <span className="font-semibold text-[#14532D] flex items-center gap-1.5">
                <ListMusic className="w-3.5 h-3.5" />
                Daftar Audio Muraja&apos;ah ({playlist!.length} Surah)
              </span>
              <span className="font-mono">
                {trackIndex + 1} / {playlist!.length} · Lanjut otomatis
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
              {playlist!.map((track, idx) => {
                const active = idx === trackIndex;
                return (
                  <button
                    key={track.audioUrl + idx}
                    type="button"
                    onClick={() => selectTrack(idx, true)}
                    className={`text-left px-2.5 py-2 rounded-lg border text-xs transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                      active
                        ? 'bg-[#14532D] text-white border-[#14532D]'
                        : 'bg-white text-[#1A2420] border-[#E5E7EB] hover:bg-[#F3F6F4]'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="font-semibold truncate">
                        {idx + 1}. {track.title}
                      </p>
                      {track.subtitle && (
                        <p
                          className={`text-[11px] truncate ${
                            active ? 'text-white/80' : 'text-[#52605A]'
                          }`}
                        >
                          {track.subtitle}
                        </p>
                      )}
                    </div>
                    <Volume2
                      className={`w-3.5 h-3.5 shrink-0 ${
                        active ? 'text-[#FDE68A]' : 'text-[#C59B27]'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {errorMsg && <p className="text-xs text-[#B45309]">{errorMsg}</p>}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-[#FAF8F5] p-3.5 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={toggleSpeechFallback}
            aria-label={isSpeaking ? `Hentikan pembacaan ${title}` : `Putar panduan suara ${title}`}
            className="w-11 h-11 rounded-xl bg-[#14532D] text-white flex items-center justify-center hover:bg-[#15803D] transition-colors shrink-0 cursor-pointer"
          >
            {isSpeaking ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#1A2420] flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-[#C59B27] shrink-0" />
              <span>{isSpeaking ? 'Sedang Membacakan Materi...' : 'Putar Panduan Suara Otomatis'}</span>
            </p>
            <p className="text-xs text-[#52605A] truncate">
              {effectiveAudioUrl
                ? 'Audio cadangan aktif · Admin dapat mengganti file/tautan MP3'
                : 'Pembacaan teks standar · Admin dapat mengunggah MP3/rekaman guru'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {isSpeaking && (
            <button
              type="button"
              onClick={toggleSpeechFallback}
              className="p-2 text-xs rounded-lg border border-[#E5E7EB] bg-white text-[#52605A] hover:text-[#1A2420] cursor-pointer"
              title="Ulangi"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={handleSpeedToggle}
            className="px-2.5 py-2 text-xs font-mono font-medium rounded-lg border border-[#E5E7EB] bg-white text-[#1A2420] hover:bg-[#F3F6F4] cursor-pointer"
          >
            {playbackRate}x
          </button>
        </div>
      </div>
      {errorMsg && <p className="text-xs text-[#B45309]">{errorMsg}</p>}
    </div>
  );
}
