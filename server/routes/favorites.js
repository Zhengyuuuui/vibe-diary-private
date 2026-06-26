const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authMiddleware } = require('../middleware/auth');
const router = Router();

const favoritesImagesDir = path.join(__dirname, '..', 'uploads', 'favorites');
if (!fs.existsSync(favoritesImagesDir)) {
  fs.mkdirSync(favoritesImagesDir, { recursive: true });
}

const favoriteImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, favoritesImagesDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const uploadFavoriteImage = multer({
  storage: favoriteImageStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('只支持 JPG、PNG、GIF 格式'));
    }
    cb(null, true);
  }
});

router.post('/upload-image', authMiddleware, (req, res) => {
  uploadFavoriteImage.single('image')(req, res, (err) => {
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
        msg: '请选择图片文件',
        data: null
      });
    }
    
    const imageUrl = `/uploads/favorites/${req.file.filename}`;
    
    res.json({
      code: 200,
      msg: '上传成功',
      data: { image_url: imageUrl }
    });
  });
});

router.get('/stats/overview', authMiddleware, (req, res) => {
  try {
    const db = req.db;
    const userId = req.user.id;

    const total = db.prepare(
      'SELECT COUNT(*) as count FROM favorites WHERE user_id = ?'
    ).get(userId).count;

    const byType = db.prepare(`
      SELECT type, COUNT(*) as count
      FROM favorites
      WHERE user_id = ?
      GROUP BY type
    `).all(userId);

    const byMood = db.prepare(`
      SELECT mood, COUNT(*) as count
      FROM favorites
      WHERE user_id = ? AND mood IS NOT NULL
      GROUP BY mood
    `).all(userId);

    const thisMonth = db.prepare(`
      SELECT COUNT(*) as count
      FROM favorites
      WHERE user_id = ?
      AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now', 'localtime')
    `).get(userId).count;

    const recentTags = db.prepare(`
      SELECT tags
      FROM favorites
      WHERE user_id = ? AND tags IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 20
    `).all(userId);

    const tagFrequency = {};
    recentTags.forEach(row => {
      try {
        const tags = JSON.parse(row.tags);
        tags.forEach(tag => {
          tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
        });
      } catch (e) {}
    });

    const topTags = Object.entries(tagFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    res.json({
      code: 200,
      msg: '获取成功',
      data: {
        total,
        thisMonth,
        byType,
        byMood,
        topTags
      }
    });
  } catch (error) {
    console.error('获取收藏统计失败:', error);
    res.status(500).json({ code: 500, msg: '获取失败', data: null });
  }
});

router.get('/random/inspiration', authMiddleware, (req, res) => {
  try {
    const db = req.db;
    const userId = req.user.id;
    const count = Math.min(10, Math.max(1, parseInt(req.query.count) || 3));

    const favorites = db.prepare(`
      SELECT * FROM favorites
      WHERE user_id = ?
      ORDER BY RANDOM()
      LIMIT ?
    `).all(userId, count);

    const parsedFavorites = favorites.map(fav => ({
      ...fav,
      tags: fav.tags ? JSON.parse(fav.tags) : []
    }));

    res.json({
      code: 200,
      msg: '获取成功',
      data: parsedFavorites
    });
  } catch (error) {
    console.error('获取随机灵感失败:', error);
    res.status(500).json({ code: 500, msg: '获取失败', data: null });
  }
});

router.get('/search/query', authMiddleware, (req, res) => {
  try {
    const db = req.db;
    const userId = req.user.id;
    const query = req.query.q;

    if (!query || query.trim().length === 0) {
      return res.json({
        code: 200,
        msg: '获取成功',
        data: []
      });
    }

    const searchPattern = `%${query.trim()}%`;

    const favorites = db.prepare(`
      SELECT * FROM favorites
      WHERE user_id = ?
      AND (
        title LIKE ? OR
        content LIKE ? OR
        source LIKE ? OR
        tags LIKE ?
      )
      ORDER BY created_at DESC
      LIMIT 50
    `).all(userId, searchPattern, searchPattern, searchPattern, searchPattern);

    const parsedFavorites = favorites.map(fav => ({
      ...fav,
      tags: fav.tags ? JSON.parse(fav.tags) : []
    }));

    res.json({
      code: 200,
      msg: '获取成功',
      data: parsedFavorites
    });
  } catch (error) {
    console.error('搜索收藏失败:', error);
    res.status(500).json({ code: 500, msg: '搜索失败', data: null });
  }
});

router.get('/', authMiddleware, (req, res) => {
  try {
    const db = req.db;
    const userId = req.user.id;

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const type = req.query.type;
    const mood = req.query.mood;
    const search = req.query.search;

    let sql = 'SELECT * FROM favorites WHERE user_id = ?';
    const params = [userId];

    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }

    if (mood) {
      sql += ' AND mood = ?';
      params.push(mood);
    }

    if (search) {
      sql += ' AND (title LIKE ? OR content LIKE ? OR source LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as count');
    const total = db.prepare(countSql).get(...params).count;

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const favorites = db.prepare(sql).all(...params);

    const parsedFavorites = favorites.map(fav => ({
      ...fav,
      tags: fav.tags ? JSON.parse(fav.tags) : []
    }));

    res.json({
      code: 200,
      msg: '获取成功',
      data: {
        list: parsedFavorites,
        total,
        page,
        limit
      }
    });
  } catch (error) {
    console.error('获取收藏列表失败:', error);
    res.status(500).json({ code: 500, msg: '获取失败', data: null });
  }
});

router.get('/:id', authMiddleware, (req, res) => {
  try {
    const db = req.db;
    const userId = req.user.id;

    const favorite = db.prepare(
      'SELECT * FROM favorites WHERE id = ? AND user_id = ?'
    ).get(req.params.id, userId);

    if (!favorite) {
      return res.status(404).json({
        code: 404,
        msg: '收藏不存在',
        data: null
      });
    }

    res.json({
      code: 200,
      msg: '获取成功',
      data: {
        ...favorite,
        tags: favorite.tags ? JSON.parse(favorite.tags) : []
      }
    });
  } catch (error) {
    console.error('获取收藏详情失败:', error);
    res.status(500).json({ code: 500, msg: '获取失败', data: null });
  }
});

router.post('/', authMiddleware, (req, res) => {
  const db = req.db;
  const userId = req.user.id;
  
  const {
    type,
    title,
    content,
    source,
    image,
    badge,
    tags,
    mood,
    diary_id,
    page_id
  } = req.body;
  
  if (!type || !content) {
    return res.status(400).json({
      code: 400,
      msg: '类型和内容为必填项',
      data: null
    });
  }
  
  const validTypes = ['quote', 'image', 'vertical', 'featured', 'minimal'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({
      code: 400,
      msg: '无效的类型',
      data: null
    });
  }
  
  const result = db.prepare(`
    INSERT INTO favorites (
      user_id, type, title, content, source, image, badge, 
      tags, mood, diary_id, page_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    userId,
    type,
    title || null,
    content,
    source || null,
    image || null,
    badge || null,
    tags ? JSON.stringify(tags) : null,
    mood || null,
    diary_id || null,
    page_id || null
  );
  
  res.status(201).json({
    code: 201,
    msg: '创建成功',
    data: { id: result.lastInsertRowid }
  });
});

router.put('/:id', authMiddleware, (req, res) => {
  const db = req.db;
  const userId = req.user.id;
  
  const favorite = db.prepare(
    'SELECT * FROM favorites WHERE id = ? AND user_id = ?'
  ).get(req.params.id, userId);
  
  if (!favorite) {
    return res.status(404).json({
      code: 404,
      msg: '收藏不存在',
      data: null
    });
  }
  
  const {
    type,
    title,
    content,
    source,
    image,
    badge,
    tags,
    mood
  } = req.body;
  
  db.prepare(`
    UPDATE favorites SET
      type = COALESCE(?, type),
      title = COALESCE(?, title),
      content = COALESCE(?, content),
      source = COALESCE(?, source),
      image = COALESCE(?, image),
      badge = COALESCE(?, badge),
      tags = COALESCE(?, tags),
      mood = COALESCE(?, mood),
      updated_at = datetime('now', 'localtime')
    WHERE id = ? AND user_id = ?
  `).run(
    type || null,
    title || null,
    content || null,
    source || null,
    image || null,
    badge || null,
    tags ? JSON.stringify(tags) : null,
    mood || null,
    req.params.id,
    userId
  );
  
  res.json({
    code: 200,
    msg: '更新成功',
    data: null
  });
});

router.delete('/:id', authMiddleware, (req, res) => {
  const db = req.db;
  const userId = req.user.id;
  
  const favorite = db.prepare(
    'SELECT * FROM favorites WHERE id = ? AND user_id = ?'
  ).get(req.params.id, userId);
  
  if (!favorite) {
    return res.status(404).json({
      code: 404,
      msg: '收藏不存在',
      data: null
    });
  }
  
  db.prepare('DELETE FROM favorites WHERE id = ?').run(req.params.id);
  
  res.json({
    code: 200,
    msg: '删除成功',
    data: null
  });
});

module.exports = router;
