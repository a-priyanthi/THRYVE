const app = require('../src/app');
const { initDatabase } = require('../src/config/db');
const { seedDatabase } = require('../src/config/seed');

let isInitialized = false;

function ensureInitialized() {
  if (!isInitialized) {
    try {
      initDatabase();
      seedDatabase();
      isInitialized = true;
    } catch (err) {
      console.error('Database initialization error:', err);
      throw err;
    }
  }
}

// Export serverless handler for Vercel
module.exports = (req, res) => {
  ensureInitialized();
  return app(req, res);
};
