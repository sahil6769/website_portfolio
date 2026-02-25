const express = require('express');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

dotenv.config();

const PORT = process.env.PORT || 3000;

async function initDb() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'portfolio',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  return pool;
}

(async () => {
  try {
    const pool = await initDb();
    const app = express();

    app.use(cors());
    app.use(express.json());

    // Serve static files (VERY IMPORTANT)
    app.use(express.static(__dirname));

    // Home route
    app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'index.html'));
    });

    // Contact API
    app.post('/api/contact', async (req, res) => {
      try {
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        const [result] = await pool.execute(
          'INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)',
          [name.trim(), email.trim(), message.trim()]
        );

        return res.json({ success: true, id: result.insertId });

      } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
      }
    });

    app.listen(PORT, () => {
      console.log(`🚀 Server runnng on http://localhost:${PORT}`);
    });

  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
})();