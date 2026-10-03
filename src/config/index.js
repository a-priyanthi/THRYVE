const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const ROOT_DIR = path.resolve(__dirname, '../..');

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

const config = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'thryve_super_secret_jwt_key_2026_collaborative',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  DB_PATH: process.env.DB_PATH || (isServerless ? '/tmp/thryve.db' : path.join(ROOT_DIR, 'thryve.db')),
  UPLOAD_DIR: process.env.UPLOAD_DIR || (isServerless ? '/tmp/uploads' : path.join(ROOT_DIR, 'uploads')),
  PUBLIC_DIR: path.join(ROOT_DIR, 'public'),
  MAX_FILE_SIZE: 50 * 1024 * 1024 // 50MB
};

module.exports = config;
