const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

const uploadsDir = path.join(__dirname, '..', 'uploads', 'avatars');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('只支持 JPG、PNG、GIF 格式'));
    }
    cb(null, true);
  }
});

router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const db = req.db;
  
  if (!username || username.length < 3) {
    return res.status(400).json({
      code: 400,
      msg: '用户名至少3个字符',
      data: null
    });
  }
  
  if (!password || password.length < 6) {
    return res.status(400).json({
      code: 400,
      msg: '密码至少6个字符',
      data: null
    });
  }
  
  try {
    const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existingUser) {
      return res.status(400).json({
        code: 400,
        msg: '用户名已存在',
        data: null
      });
    }
    
    const passwordHash = await bcrypt.hash(password, 10);
    
    const result = db.prepare(
      'INSERT INTO users (username, password_hash, pen_name, bio) VALUES (?, ?, ?, ?)'
    ).run(username, passwordHash, username, '');
    
    const token = jwt.sign(
      { id: result.lastInsertRowid, username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      code: 201,
      msg: '注册成功',
      data: { id: result.lastInsertRowid, username, token }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      code: 500,
      msg: '注册失败',
      data: null
    });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const db = req.db;
  
  if (!username || !password) {
    return res.status(400).json({
      code: 400,
      msg: '请输入用户名和密码',
      data: null
    });
  }
  
  try {
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    
    if (!user) {
      return res.status(401).json({
        code: 401,
        msg: '用户名或密码错误',
        data: null
      });
    }
    
    const isValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isValid) {
      return res.status(401).json({
        code: 401,
        msg: '用户名或密码错误',
        data: null
      });
    }
    
    db.prepare("UPDATE users SET last_login = datetime('now', 'localtime') WHERE id = ?").run(user.id);
    
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      code: 200,
      msg: '登录成功',
      data: { id: user.id, username: user.username, token }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      code: 500,
      msg: '登录失败',
      data: null
    });
  }
});

router.get('/verify', authMiddleware, (req, res) => {
  res.json({
    code: 200,
    msg: 'Token有效',
    data: { id: req.user.id, username: req.user.username }
  });
});

router.get('/profile', authMiddleware, (req, res) => {
  const db = req.db;
  
  try {
    const user = db.prepare(
      'SELECT id, username, pen_name, bio, avatar FROM users WHERE id = ?'
    ).get(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        code: 404,
        msg: '用户不存在',
        data: null
      });
    }
    
    const responseData = {
      id: user.id,
      username: user.username,
      pen_name: user.pen_name || user.username,
      bio: user.bio || '这个家伙很神秘什么都没留下',
      avatar: user.avatar || ''
    };
    
    res.json({
      code: 200,
      msg: '获取成功',
      data: responseData
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      code: 500,
      msg: '获取失败',
      data: null
    });
  }
});

router.put('/profile', authMiddleware, (req, res) => {
  const { pen_name, bio } = req.body;
  const db = req.db;
  
  if (pen_name && pen_name.length > 20) {
    return res.status(400).json({
      code: 400,
      msg: '笔名不能超过20个字符',
      data: null
    });
  }
  
  if (bio && bio.length > 200) {
    return res.status(400).json({
      code: 400,
      msg: '个性签名不能超过200个字符',
      data: null
    });
  }
  
  try {
    db.prepare(
      'UPDATE users SET pen_name = ?, bio = ? WHERE id = ?'
    ).run(pen_name, bio, req.user.id);
    
    res.json({
      code: 200,
      msg: '更新成功',
      data: { pen_name, bio }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      code: 500,
      msg: '更新失败',
      data: null
    });
  }
});

router.post('/avatar', authMiddleware, (req, res) => {
  const db = req.db;
  
  uploadAvatar.single('avatar')(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        code: 400,
        msg: err.message || '上传失败',
        data: null
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        code: 400,
        msg: '请选择头像文件',
        data: null
      });
    }
    
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    
    try {
      db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(avatarUrl, req.user.id);
      
      res.json({
        code: 200,
        msg: '上传成功',
        data: { avatar_url: avatarUrl }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        code: 500,
        msg: '上传失败',
        data: null
      });
    }
  });
});

router.get('/settings', authMiddleware, (req, res) => {
  const db = req.db;
  
  try {
    let settings = db.prepare(
      'SELECT font_size, line_height, theme FROM user_settings WHERE user_id = ?'
    ).get(req.user.id);
    
    if (!settings) {
      db.prepare(
        'INSERT INTO user_settings (user_id) VALUES (?)'
      ).run(req.user.id);
      
      settings = {
        font_size: 16,
        line_height: 'medium',
        theme: 'light'
      };
    }
    
    res.json({
      code: 200,
      msg: '获取成功',
      data: settings
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      code: 500,
      msg: '获取失败',
      data: null
    });
  }
});

router.put('/settings', authMiddleware, (req, res) => {
  const { font_size, line_height, theme } = req.body;
  const db = req.db;
  
  if (font_size && (font_size < 12 || font_size > 24)) {
    return res.status(400).json({
      code: 400,
      msg: '字体大小必须在12-24之间',
      data: null
    });
  }
  
  const validLineHeights = ['compact', 'medium', 'relaxed'];
  if (line_height && !validLineHeights.includes(line_height)) {
    return res.status(400).json({
      code: 400,
      msg: '无效的行间距设置',
      data: null
    });
  }
  
  const validThemes = ['light', 'dark', 'sepia'];
  if (theme && !validThemes.includes(theme)) {
    return res.status(400).json({
      code: 400,
      msg: '无效的主题设置',
      data: null
    });
  }
  
  try {
    const existing = db.prepare(
      'SELECT id FROM user_settings WHERE user_id = ?'
    ).get(req.user.id);
    
    if (existing) {
      db.prepare(
        `UPDATE user_settings 
         SET font_size = COALESCE(?, font_size),
             line_height = COALESCE(?, line_height),
             theme = COALESCE(?, theme),
             updated_at = datetime('now', 'localtime')
         WHERE user_id = ?`
      ).run(font_size || null, line_height || null, theme || null, req.user.id);
    } else {
      db.prepare(
        `INSERT INTO user_settings (user_id, font_size, line_height, theme)
         VALUES (?, ?, ?, ?)`
      ).run(req.user.id, font_size || 16, line_height || 'medium', theme || 'light');
    }
    
    res.json({
      code: 200,
      msg: '更新成功',
      data: { font_size, line_height, theme }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      code: 500,
      msg: '更新失败',
      data: null
    });
  }
});

module.exports = router;
