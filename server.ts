import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import type {
  AuthUser,
  DailyLog,
  MateriItem,
  MonthlyEvaluation,
  Student,
  Teacher,
  WeeklyEvaluation,
} from './src/types.ts';
import {
  getUploadDir,
  loadDatabase,
  resetDatabase,
  saveDatabase,
  saveUploadedFile,
} from './server/store.ts';
import { computePredikat } from './server/seedData.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '30mb' }));
  app.use('/uploads', express.static(getUploadDir()));

  // Authentication by Role & Admin-assigned ID
  app.post('/api/auth/login', (req, res) => {
    const { loginId, password } = req.body as { loginId?: string; password?: string };
    const cleanId = (loginId || '').trim().toUpperCase();
    const cleanPass = (password || '').trim();

    if (!cleanId) {
      res.status(400).json({ error: 'ID Login wajib diisi.' });
      return;
    }

    const db = loadDatabase();

    // 1. Admin check
    if (cleanId === db.adminConfig.adminId.toUpperCase()) {
      if (cleanPass !== db.adminConfig.adminPassword) {
        res.status(401).json({ error: 'Kata sandi Admin Madrasah tidak sesuai.' });
        return;
      }
      const user: AuthUser = {
        id: 'admin',
        loginId: db.adminConfig.adminId,
        nama: db.adminConfig.adminName,
        role: 'admin',
      };
      res.json({ user });
      return;
    }

    // 2. Teacher (Kepala Program / Wali Kelas) check
    const teacher = db.teachers.find((t) => t.loginId.toUpperCase() === cleanId && t.aktif);
    if (teacher) {
      if (cleanPass && teacher.pin && cleanPass !== teacher.pin) {
        res.status(401).json({ error: 'PIN / Kata sandi Guru tidak sesuai.' });
        return;
      }
      if (!cleanPass && teacher.pin) {
        res.status(401).json({ error: 'Masukkan PIN akses yang diberikan Admin Madrasah.' });
        return;
      }
      const user: AuthUser = {
        id: teacher.id,
        loginId: teacher.loginId,
        nama: teacher.nama,
        role: teacher.role,
        fotoUrl: teacher.fotoUrl,
        jenjangAmpuan: teacher.jenjangAmpuan,
      };
      res.json({ user });
      return;
    }

    // 3. Parent / Student check
    const student = db.students.find((s) => s.loginId.toUpperCase() === cleanId);
    if (student) {
      if (cleanPass !== student.pin) {
        res.status(401).json({ error: 'PIN akses Orang Tua / Murid tidak sesuai.' });
        return;
      }
      const user: AuthUser = {
        id: `parent-${student.id}`,
        loginId: student.loginId,
        nama: `${student.namaOrangTua} (Wali ${student.nama})`,
        role: 'orang_tua',
        fotoUrl: student.fotoUrl,
        studentId: student.id,
      };
      res.json({ user });
      return;
    }

    res.status(404).json({ error: 'ID Login tidak ditemukan. Hubungi Admin Madrasah.' });
  });

  // Bootstrap data
  app.get('/api/bootstrap', (req, res) => {
    const role = (req.query.role as string) || '';
    const db = loadDatabase();
    const isAdmin = role === 'admin';

    res.json({
      settings: db.settings,
      materials: db.materials,
      teachers: db.teachers.map(({ pin: _pin, ...rest }) => rest),
      students: db.students.map(({ pin: _pin, ...rest }) => rest),
      dailyLogs: db.dailyLogs,
      weeklyEvals: db.weeklyEvals,
      monthlyEvals: db.monthlyEvals,
      adminInfo: isAdmin
        ? { adminId: db.adminConfig.adminId, adminName: db.adminConfig.adminName }
        : undefined,
      rawTeachers: isAdmin ? db.teachers : undefined,
      rawStudents: isAdmin ? db.students : undefined,
    });
  });

  // Upload image/audio asset
  app.post('/api/upload', (req, res) => {
    try {
      const { dataUrl, filename } = req.body as { dataUrl: string; filename: string };
      if (!dataUrl) {
        res.status(400).json({ error: 'Berkas kosong.' });
        return;
      }
      const url = saveUploadedFile(dataUrl, filename || 'berkas');
      res.json({ url });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Gagal mengunggah berkas.' });
    }
  });

  // Update Institution Settings & Admin Password
  app.put('/api/settings', (req, res) => {
    const db = loadDatabase();
    const { settings, adminName, currentPassword, newPassword } = req.body as {
      settings?: Partial<typeof db.settings>;
      adminName?: string;
      currentPassword?: string;
      newPassword?: string;
    };

    if (newPassword) {
      if (currentPassword !== db.adminConfig.adminPassword) {
        res.status(400).json({ error: 'Kata sandi lama tidak cocok.' });
        return;
      }
      if (newPassword.trim().length < 5) {
        res.status(400).json({ error: 'Kata sandi baru minimal 5 karakter.' });
        return;
      }
      db.adminConfig.adminPassword = newPassword.trim();
    }

    if (adminName && adminName.trim()) {
      db.adminConfig.adminName = adminName.trim();
    }

    if (settings) {
      db.settings = { ...db.settings, ...settings };
    }

    saveDatabase(db);
    res.json({
      settings: db.settings,
      adminInfo: { adminId: db.adminConfig.adminId, adminName: db.adminConfig.adminName },
    });
  });

  // Materials CRUD
  app.post('/api/materials', (req, res) => {
    const db = loadDatabase();
    const payload = req.body as Omit<MateriItem, 'id'>;
    const newItem: MateriItem = {
      ...payload,
      id: `mat-${Date.now()}`,
      urutan: Number(payload.urutan) || db.materials.length + 1,
    };
    db.materials.push(newItem);
    saveDatabase(db);
    res.json(newItem);
  });

  app.put('/api/materials/:id', (req, res) => {
    const db = loadDatabase();
    const idx = db.materials.findIndex((m) => m.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Materi tidak ditemukan.' });
      return;
    }
    db.materials[idx] = { ...db.materials[idx], ...req.body, id: req.params.id };
    saveDatabase(db);
    res.json(db.materials[idx]);
  });

  app.delete('/api/materials/:id', (req, res) => {
    const db = loadDatabase();
    db.materials = db.materials.filter((m) => m.id !== req.params.id);
    saveDatabase(db);
    res.json({ ok: true });
  });

  // Teachers CRUD
  app.post('/api/teachers', (req, res) => {
    const db = loadDatabase();
    const payload = req.body as Omit<Teacher, 'id'>;
    const duplicate = db.teachers.some(
      (t) => t.loginId.toUpperCase() === payload.loginId.trim().toUpperCase(),
    );
    if (duplicate) {
      res.status(400).json({ error: 'ID Login Guru sudah digunakan.' });
      return;
    }
    const newTeacher: Teacher = {
      ...payload,
      id: `guru-${Date.now()}`,
      loginId: payload.loginId.trim().toUpperCase(),
      pin: payload.pin?.trim() || '123456',
    };
    db.teachers.push(newTeacher);
    saveDatabase(db);
    res.json(newTeacher);
  });

  app.put('/api/teachers/:id', (req, res) => {
    const db = loadDatabase();
    const idx = db.teachers.findIndex((t) => t.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Data guru tidak ditemukan.' });
      return;
    }
    const updated = {
      ...db.teachers[idx],
      ...req.body,
      id: req.params.id,
    };
    if (updated.loginId) {
      updated.loginId = updated.loginId.trim().toUpperCase();
    }
    db.teachers[idx] = updated;
    saveDatabase(db);
    res.json(updated);
  });

  app.delete('/api/teachers/:id', (req, res) => {
    const db = loadDatabase();
    db.teachers = db.teachers.filter((t) => t.id !== req.params.id);
    saveDatabase(db);
    res.json({ ok: true });
  });

  // Students CRUD
  app.post('/api/students', (req, res) => {
    const db = loadDatabase();
    const payload = req.body as Omit<Student, 'id'>;
    const duplicate = db.students.some(
      (s) => s.loginId.toUpperCase() === payload.loginId.trim().toUpperCase(),
    );
    if (duplicate) {
      res.status(400).json({ error: 'ID Login Orang Tua / Murid sudah digunakan.' });
      return;
    }
    const newStudent: Student = {
      ...payload,
      id: `std-${Date.now()}`,
      loginId: payload.loginId.trim().toUpperCase(),
      pin: payload.pin?.trim() || '123456',
    };
    db.students.push(newStudent);
    saveDatabase(db);
    res.json(newStudent);
  });

  app.put('/api/students/:id', (req, res) => {
    const db = loadDatabase();
    const idx = db.students.findIndex((s) => s.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Data murid tidak ditemukan.' });
      return;
    }
    const updated = {
      ...db.students[idx],
      ...req.body,
      id: req.params.id,
    };
    if (updated.loginId) {
      updated.loginId = updated.loginId.trim().toUpperCase();
    }
    db.students[idx] = updated;
    saveDatabase(db);
    res.json(updated);
  });

  app.delete('/api/students/:id', (req, res) => {
    const db = loadDatabase();
    db.students = db.students.filter((s) => s.id !== req.params.id);
    db.dailyLogs = db.dailyLogs.filter((l) => l.studentId !== req.params.id);
    db.weeklyEvals = db.weeklyEvals.filter((w) => w.studentId !== req.params.id);
    db.monthlyEvals = db.monthlyEvals.filter((m) => m.studentId !== req.params.id);
    saveDatabase(db);
    res.json({ ok: true });
  });

  // Daily Logs (Senin - Kamis)
  app.post('/api/daily-logs', (req, res) => {
    const db = loadDatabase();
    const payload = req.body as Omit<DailyLog, 'id' | 'predikat' | 'createdAt'>;
    const nilai = Number(payload.nilai) || 0;
    const item: DailyLog = {
      ...payload,
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      nilai,
      predikat: computePredikat(nilai),
      createdAt: new Date().toISOString(),
    };
    db.dailyLogs.unshift(item);
    saveDatabase(db);
    res.json(item);
  });

  app.delete('/api/daily-logs/:id', (req, res) => {
    const db = loadDatabase();
    db.dailyLogs = db.dailyLogs.filter((l) => l.id !== req.params.id);
    saveDatabase(db);
    res.json({ ok: true });
  });

  // Weekly Evaluations (Jum'at)
  app.post('/api/weekly-evals', (req, res) => {
    const db = loadDatabase();
    const payload = req.body as Omit<WeeklyEvaluation, 'id' | 'nilaiAkhir' | 'createdAt'>;
    const nilaiAkhir = Math.round(
      (Number(payload.nilaiKelancaran) + Number(payload.nilaiTajwid) + Number(payload.nilaiAdab)) / 3,
    );
    const existingIdx = db.weeklyEvals.findIndex(
      (w) =>
        w.studentId === payload.studentId &&
        w.semester === payload.semester &&
        w.mingguKe === payload.mingguKe,
    );
    const item: WeeklyEvaluation = {
      ...payload,
      id: existingIdx >= 0 ? db.weeklyEvals[existingIdx].id : `wk-${Date.now()}`,
      nilaiAkhir,
      createdAt: new Date().toISOString(),
    };
    if (existingIdx >= 0) {
      db.weeklyEvals[existingIdx] = item;
    } else {
      db.weeklyEvals.unshift(item);
    }
    saveDatabase(db);
    res.json(item);
  });

  app.delete('/api/weekly-evals/:id', (req, res) => {
    const db = loadDatabase();
    db.weeklyEvals = db.weeklyEvals.filter((w) => w.id !== req.params.id);
    saveDatabase(db);
    res.json({ ok: true });
  });

  // Monthly Evaluations
  app.post('/api/monthly-evals', (req, res) => {
    const db = loadDatabase();
    const payload = req.body as Omit<MonthlyEvaluation, 'id' | 'createdAt'>;
    const existingIdx = db.monthlyEvals.findIndex(
      (m) =>
        m.studentId === payload.studentId &&
        m.semester === payload.semester &&
        m.bulan === payload.bulan,
    );
    const item: MonthlyEvaluation = {
      ...payload,
      id: existingIdx >= 0 ? db.monthlyEvals[existingIdx].id : `mo-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    if (existingIdx >= 0) {
      db.monthlyEvals[existingIdx] = item;
    } else {
      db.monthlyEvals.push(item);
    }
    saveDatabase(db);
    res.json(item);
  });

  app.delete('/api/monthly-evals/:id', (req, res) => {
    const db = loadDatabase();
    db.monthlyEvals = db.monthlyEvals.filter((m) => m.id !== req.params.id);
    saveDatabase(db);
    res.json({ ok: true });
  });

  app.post('/api/reset-demo', (_req, res) => {
    const db = resetDatabase();
    res.json({ ok: true, count: db.students.length });
  });

  // Vite / Static Serving
  if (process.env.NODE_ENV === 'production') {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
  });
}

startServer();
