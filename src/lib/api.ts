import type {
  AuthUser,
  BootstrapPayload,
  DailyLog,
  InstitutionSettings,
  MateriItem,
  MonthlyEvaluation,
  Student,
  Teacher,
  WeeklyEvaluation,
} from '../types';

async function handleJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = 'Terjadi kesalahan pada server.';
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      // ignore parse failure
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export const api = {
  async login(loginId: string, password: string): Promise<{ user: AuthUser }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId, password }),
    });
    return handleJson(res);
  },

  async bootstrap(role: string): Promise<BootstrapPayload> {
    const res = await fetch(`/api/bootstrap?role=${encodeURIComponent(role)}`);
    return handleJson(res);
  },

  async uploadFile(file: File): Promise<{ url: string }> {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Gagal membaca berkas.'));
      reader.readAsDataURL(file);
    });
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataUrl, filename: file.name }),
    });
    return handleJson(res);
  },

  async uploadDataUrl(dataUrl: string, filename: string): Promise<{ url: string }> {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataUrl, filename }),
    });
    return handleJson(res);
  },

  async updateSettings(payload: {
    settings?: Partial<InstitutionSettings>;
    adminName?: string;
    currentPassword?: string;
    newPassword?: string;
  }): Promise<{ settings: InstitutionSettings; adminInfo: { adminId: string; adminName: string } }> {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleJson(res);
  },

  async createMateri(payload: Omit<MateriItem, 'id'>): Promise<MateriItem> {
    const res = await fetch('/api/materials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleJson(res);
  },

  async updateMateri(id: string, payload: Partial<MateriItem>): Promise<MateriItem> {
    const res = await fetch(`/api/materials/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleJson(res);
  },

  async deleteMateri(id: string): Promise<void> {
    const res = await fetch(`/api/materials/${id}`, { method: 'DELETE' });
    await handleJson(res);
  },

  async createTeacher(payload: Omit<Teacher, 'id'>): Promise<Teacher> {
    const res = await fetch('/api/teachers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleJson(res);
  },

  async updateTeacher(id: string, payload: Partial<Teacher>): Promise<Teacher> {
    const res = await fetch(`/api/teachers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleJson(res);
  },

  async deleteTeacher(id: string): Promise<void> {
    const res = await fetch(`/api/teachers/${id}`, { method: 'DELETE' });
    await handleJson(res);
  },

  async createStudent(payload: Omit<Student, 'id'>): Promise<Student> {
    const res = await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleJson(res);
  },

  async updateStudent(id: string, payload: Partial<Student>): Promise<Student> {
    const res = await fetch(`/api/students/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleJson(res);
  },

  async deleteStudent(id: string): Promise<void> {
    const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
    await handleJson(res);
  },

  async createDailyLog(payload: Omit<DailyLog, 'id' | 'predikat' | 'createdAt'>): Promise<DailyLog> {
    const res = await fetch('/api/daily-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleJson(res);
  },

  async deleteDailyLog(id: string): Promise<void> {
    const res = await fetch(`/api/daily-logs/${id}`, { method: 'DELETE' });
    await handleJson(res);
  },

  async saveWeeklyEval(payload: Omit<WeeklyEvaluation, 'id' | 'nilaiAkhir' | 'createdAt'>): Promise<WeeklyEvaluation> {
    const res = await fetch('/api/weekly-evals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleJson(res);
  },

  async saveMonthlyEval(payload: Omit<MonthlyEvaluation, 'id' | 'createdAt'>): Promise<MonthlyEvaluation> {
    const res = await fetch('/api/monthly-evals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleJson(res);
  },
};
