import { useRef, useState } from 'react';
import { Mic, Square, Upload, Link2, Trash2 } from 'lucide-react';
import { api } from '../lib/api';

interface AudioRecorderProps {
  audioUrl?: string;
  audioLabel?: string;
  onChange: (audioUrl: string, audioLabel: string) => void;
}

export function AudioRecorder({ audioUrl, audioLabel, onChange }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [urlInput, setUrlInput] = useState(audioUrl || '');
  const [errorMsg, setErrorMsg] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = async (file: File) => {
    setErrorMsg('');
    setIsUploading(true);
    try {
      const { url } = await api.uploadFile(file);
      setUrlInput(url);
      onChange(url, audioLabel || file.name.replace(/\.[^/.]+$/, ''));
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal mengunggah berkas audio.');
    } finally {
      setIsUploading(false);
    }
  };

  const startRecording = async () => {
    setErrorMsg('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMsg('Perangkat ini tidak mendukung perekaman mikrofon langsung.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = async () => {
          setIsUploading(true);
          try {
            const { url } = await api.uploadDataUrl(String(reader.result), `rekaman_${Date.now()}.webm`);
            setUrlInput(url);
            onChange(url, audioLabel || 'Rekaman Suara Pembimbing');
          } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : 'Gagal menyimpan rekaman suara.');
          } finally {
            setIsUploading(false);
          }
        };
        reader.readAsDataURL(blob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch {
      setErrorMsg('Izin mikrofon ditolak atau mikrofon tidak tersedia.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-[#E5E7EB] bg-[#FAF8F5] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold text-[#1A2420]">Audio Murottal / Panduan Suara</span>
        {audioUrl && (
          <button
            type="button"
            onClick={() => {
              setUrlInput('');
              onChange('', '');
            }}
            className="inline-flex items-center gap-1 text-xs font-medium text-[#DC2626] hover:underline cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Hapus Audio
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFileUpload(f);
          }}
        />
        <button
          type="button"
          disabled={isUploading || isRecording}
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg border border-[#E5E7EB] bg-white text-[#1A2420] hover:bg-[#F3F6F4] disabled:opacity-50 cursor-pointer whitespace-nowrap"
        >
          <Upload className="w-3.5 h-3.5 text-[#14532D]" />
          {isUploading ? 'Mengunggah...' : 'Unggah MP3 / Audio'}
        </button>

        {!isRecording ? (
          <button
            type="button"
            disabled={isUploading}
            onClick={startRecording}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg border border-[#14532D]/30 bg-[#14532D]/10 text-[#14532D] hover:bg-[#14532D]/15 disabled:opacity-50 cursor-pointer whitespace-nowrap"
          >
            <Mic className="w-3.5 h-3.5" />
            Rekam Suara Langsung
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg bg-[#DC2626] text-white hover:bg-[#B91C1C] cursor-pointer whitespace-nowrap"
          >
            <Square className="w-3.5 h-3.5" />
            Hentikan Rekaman
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div>
          <label className="block text-[11px] font-medium text-[#52605A] mb-1">
            Tautan URL Audio (Opsional)
          </label>
          <div className="relative">
            <Link2 className="w-3.5 h-3.5 text-[#52605A] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                onChange(e.target.value, audioLabel || 'Audio Panduan');
              }}
              placeholder="https://... atau /uploads/..."
              className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-[#E5E7EB] bg-white focus:outline-none focus:border-[#14532D]"
            />
          </div>
        </div>
        <div>
          <label className="block text-[11px] font-medium text-[#52605A] mb-1">
            Label Keterangan Audio
          </label>
          <input
            type="text"
            value={audioLabel || ''}
            onChange={(e) => onChange(urlInput, e.target.value)}
            placeholder="Misal: Panduan Suara Ustadzah"
            className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E7EB] bg-white focus:outline-none focus:border-[#14532D]"
          />
        </div>
      </div>

      {audioUrl && (
        <audio controls src={audioUrl} className="w-full h-9" />
      )}
      {errorMsg && <p className="text-xs text-[#DC2626]">{errorMsg}</p>}
    </div>
  );
}
