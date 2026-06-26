// 在最开头加载环境变量
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const initDb = require('./database');
const diariesRouter = require('./routes/diaries');
const pagesRouter = require('./routes/pages');
const authRouter = require('./routes/auth');
const favoritesRouter = require('./routes/favorites');
const settingsRouter = require('./routes/settings');

// 验证 JWT_SECRET 是否设置
if (!process.env.JWT_SECRET) {
  console.error('错误: JWT_SECRET 环境变量未设置');
  console.error('请在 server/.env 文件中设置 JWT_SECRET');
  console.error('生成方式: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

// CORS 配置：开发环境允许所有 localhost 端口，生产环境限制可信域名
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];

app.use(cors({
  origin: (origin, callback) => {
    // 允许无 origin 的请求（如移动应用、服务器间调用）
    if (!origin) return callback(null, true);

    // 开发环境：允许所有 localhost 端口
    const isLocalhost = /^http:\/\/localhost:\d+$/.test(origin);

    // 生产环境：检查可信域名列表
    const isAllowed = allowedOrigins.includes(origin);

    if (isLocalhost || isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('不允许的来源'));
    }
  },
  credentials: true
}));

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
app.use('/api/v1/settings', settingsRouter);

app.use((err, req, res, _next) => {
  // 根据环境区分处理错误日志，生产环境不泄露堆栈
  if (process.env.NODE_ENV === 'production') {
    console.error('Error:', err.message);
  } else {
    console.error(err.stack);
  }
  res.status(500).json({ code: 500, msg: '服务器内部错误', data: null });
});

app.listen(PORT, () => {
  console.log(`氛围日记服务启动于 http://localhost:${PORT}`);
});

module.exports = app;
