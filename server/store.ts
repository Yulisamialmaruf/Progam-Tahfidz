import fs from 'fs';
import path from 'path';
import type { AppDatabase } from '../src/types.ts';
import { createSeedDatabase } from './seedData.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'tahfidz-db.json');

export function ensureDirectories(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

export function getUploadDir(): string {
  ensureDirectories();
  return UPLOAD_DIR;
}

export function loadDatabase(): AppDatabase {
  ensureDirectories();
  if (!fs.existsSync(DB_FILE)) {
    const seed = createSeedDatabase();
    saveDatabase(seed);
    return seed;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw) as AppDatabase;
  } catch {
    const seed = createSeedDatabase();
    saveDatabase(seed);
    return seed;
  }
}

export function saveDatabase(db: AppDatabase): void {
  ensureDirectories();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

export function resetDatabase(): AppDatabase {
  const seed = createSeedDatabase();
  saveDatabase(seed);
  return seed;
}

export function saveUploadedFile(dataUrl: string, originalName: string): string {
  ensureDirectories();
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error('Format berkas tidak valid.');
  }
  const mime = match[1];
  const base64Data = match[2];
  const buffer = Buffer.from(base64Data, 'base64');

  const safeExtFromName = path.extname(originalName).replace(/[^a-zA-Z0-9.]/g, '');
  let ext = safeExtFromName;
  if (!ext) {
    if (mime.includes('png')) ext = '.png';
    else if (mime.includes('jpeg') || mime.includes('jpg')) ext = '.jpg';
    else if (mime.includes('webp')) ext = '.webp';
    else if (mime.includes('mpeg') || mime.includes('mp3')) ext = '.mp3';
    else if (mime.includes('wav')) ext = '.wav';
    else if (mime.includes('webm')) ext = '.webm';
    else if (mime.includes('ogg')) ext = '.ogg';
    else if (mime.includes('mp4') || mime.includes('m4a')) ext = '.m4a';
    else ext = '.bin';
  }

  const fileName = `almaruf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
  const filePath = path.join(UPLOAD_DIR, fileName);
  fs.writeFileSync(filePath, buffer);
  return `/uploads/${fileName}`;
}
