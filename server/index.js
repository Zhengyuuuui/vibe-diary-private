const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const initDb = require('./database');
const diariesRouter = require('./routes/diaries');
const pagesRouter = require('./routes/pages');
const authRouter = require('./routes/auth');
const favoritesRouter = require('./routes/favorites');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '100kb' }));

const dbPath = path.join(__dirname, 'data', 'vibe.db');
const db = initDb(dbPath);

const uploadsDir = path.join(__dirname, 'uploads', 'avatars');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use((req, res, next) => {
  req.db = db;
  next();
});

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/diaries', diariesRouter);
app.use('/api/v1/pages', pagesRouter);
app.use('/api/v1/favorites', favoritesRouter);

app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ code: 500, msg: '服务器内部错误', data: null });
});

app.listen(PORT, () => {
  console.log(`氛围日记服务启动于 http://localhost:${PORT}`);
});

module.exports = app;
