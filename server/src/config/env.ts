import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function parseDatabaseConfig() {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) {
    try {
      const parsed = new URL(databaseUrl);
      return {
        DATABASE_URL: databaseUrl,
        DB_HOST: parsed.hostname,
        DB_PORT: parseInt(parsed.port || '3306', 10),
        DB_USER: decodeURIComponent(parsed.username || 'root'),
        DB_PASSWORD: decodeURIComponent(parsed.password || ''),
        DB_NAME: parsed.pathname ? parsed.pathname.replace(/^\//, '') : 'HoaDonLoThuoc',
        DB_SSL: process.env.DB_SSL === 'true' || databaseUrl.includes('ssl') || databaseUrl.includes('ssl-mode'),
      };
    } catch (e) {
      console.warn('[Env] DATABASE_URL không hợp lệ, chuyển sang dùng các biến DB_* riêng lẻ.');
    }
  }

  return {
    DATABASE_URL: undefined,
    DB_HOST: process.env.DB_HOST || '127.0.0.1',
    DB_PORT: parseInt(process.env.DB_PORT || '3306', 10),
    DB_NAME: process.env.DB_NAME || 'HoaDonLoThuoc',
    DB_USER: process.env.DB_USER || 'root',
    DB_PASSWORD: process.env.DB_PASSWORD || '',
    DB_SSL: process.env.DB_SSL === 'true',
  };
}

const dbConfig = parseDatabaseConfig();

export const env = {
  // Database configuration (Hỗ trợ cả Local và Cloud MySQL với SSL)
  ...dbConfig,

  // Server configuration
  PORT: parseInt(process.env.PORT || '5000', 10),
  HOST: process.env.HOST || '0.0.0.0',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',

  // Google Sheets Synchronization configuration
  GOOGLE_SHEETS_SYNC_ENABLED: process.env.GOOGLE_SHEETS_SYNC_ENABLED === 'true',
  GOOGLE_APPS_SCRIPT_URL: process.env.GOOGLE_APPS_SCRIPT_URL || '',
  SHEETS_SYNC_SECRET: process.env.SHEETS_SYNC_SECRET || 'mint_pharma_secure_sync_secret_token_2026',
};
