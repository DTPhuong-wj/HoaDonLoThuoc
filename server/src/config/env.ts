import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const env = {
  // Database configuration
  DB_HOST: process.env.DB_HOST || '127.0.0.1',
  DB_PORT: parseInt(process.env.DB_PORT || '3306', 10),
  DB_NAME: process.env.DB_NAME || 'HoaDonLoThuoc',
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',

  // Server configuration
  PORT: parseInt(process.env.PORT || '5000', 10),
  HOST: process.env.HOST || '0.0.0.0',

  // Google Sheets Two-Way Synchronization configuration (Section 9)
  GOOGLE_SHEETS_SYNC_ENABLED: process.env.GOOGLE_SHEETS_SYNC_ENABLED === 'true',
  GOOGLE_APPS_SCRIPT_URL: process.env.GOOGLE_APPS_SCRIPT_URL || '',
  SHEETS_SYNC_SECRET: process.env.SHEETS_SYNC_SECRET || 'mint_pharma_secure_sync_secret_token_2026',
};
