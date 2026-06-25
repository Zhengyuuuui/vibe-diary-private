const { Router } = require('express');
const { sanitizeHtml } = require('../middleware/sanitize');
const { authMiddleware } = require('../middleware/auth');
const router = Router();

router.get('/', authMiddleware, (req, res) => {
  const db = req.db;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(20, Math.max(1, parseInt(req.query.limit) || 20));
  const offset = (page - 1) * limit;

  const total = db.prepare('SELECT COUNT(*) AS count FROM diaries WHERE user_id = ?').get(req.user.id).count;
  const diaries = db.prepare('SELECT * FROM diaries WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?').all(req.user.id, limit, offset);

  const diariesWithPageCount = diaries.map(diary => {
    const pageCount = db.prepare('SELECT COUNT(*) AS count FROM pages WHERE diary_id = ?').get(diary.id).count;
    return { ...diary, page_count: pageCount };
  });

  res.json({
    code: 200,
    msg: '操作成功',
    data: { list: diariesWithPageCount, total, page, limit }
  });
});

router.get('/stats', authMiddleware, (req, res) => {
  const db = req.db;
  const userId = req.user.id;

  const weeklyPages = db.prepare(`
    SELECT COUNT(*) as count 
    FROM pages p 
    JOIN diaries d ON p.diary_id = d.id 
    WHERE d.user_id = ? 
    AND p.updated_at >= datetime('now', '-7 days', 'localtime')
  `).get(userId).count;

  const streakDays = db.prepare(`
    SELECT COUNT(DISTINCT date(updated_at)) as days
    FROM pages p
    JOIN diaries d ON p.diary_id = d.id
    WHERE d.user_id = ?
    AND p.updated_at >= datetime('now', '-30 days', 'localtime')
    ORDER BY date(updated_at) DESC
  `).get(userId).days;

  const totalPages = db.prepare(`
    SELECT COUNT(*) as count
    FROM pages p
    JOIN diaries d ON p.diary_id = d.id
    WHERE d.user_id = ?
  `).get(userId).count;

  res.json({
    code: 200,
    msg: '获取成功',
    data: {
      weekly_pages: weeklyPages,
      streak_days: streakDays,
      total_pages: totalPages
    }
  });
});

router.get('/random-fragment', authMiddleware, (req, res) => {
  try {
    const db = req.db;
    const userId = req.user.id;

    const page = db.prepare(`
      SELECT p.id as page_id, p.content, p.updated_at, p.diary_id, d.title as diary_title
      FROM pages p
      JOIN diaries d ON p.diary_id = d.id
      WHERE d.user_id = ? AND p.content IS NOT NULL AND p.content != ''
      ORDER BY RANDOM()
      LIMIT 1
    `).get(userId);

    if (!page) {
      return res.json({
        code: 200,
        msg: '暂无日记',
        data: null
      });
    }

    const content = page.content || '';
    const fragment = content.substring(0, 100);
    const hasMore = content.length > 100;

    res.json({
      code: 200,
      msg: '获取成功',
      data: {
        diary_id: page.diary_id,
        diary_title: page.diary_title,
        page_id: page.page_id,
        content: fragment,
        created_at: page.updated_at,
        has_more: hasMore
      }
    });
  } catch (error) {
    console.error('random-fragment error:', error);
    res.json({
      code: 200,
      msg: '暂无日记',
      data: null
    });
  }
});

router.get('/on-this-day', authMiddleware, (req, res) => {
  try {
    const db = req.db;
    const userId = req.user.id;

    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const targetDate = `${month}-${day}`;

    const currentYear = today.getFullYear();
    const years = [currentYear - 1, currentYear - 2, currentYear - 3];

    for (const year of years) {
      const targetFullDate = `${year}-${targetDate}`;
      
      const page = db.prepare(`
        SELECT p.id as page_id, p.content, p.updated_at, p.diary_id, d.title as diary_title
        FROM pages p
        JOIN diaries d ON p.diary_id = d.id
        WHERE d.user_id = ? 
        AND p.content IS NOT NULL 
        AND p.content != ''
        AND date(p.updated_at) = date(?)
        ORDER BY p.updated_at DESC
        LIMIT 1
      `).get(userId, targetFullDate);

      if (page) {
        const content = page.content || '';
        const fragment = content.substring(0, 100);
        const hasMore = content.length > 100;

        return res.json({
          code: 200,
          msg: '获取成功',
          data: {
            diary_id: page.diary_id,
            diary_title: page.diary_title,
            page_id: page.page_id,
            content: fragment,
            created_at: page.updated_at,
            year: year,
            has_more: hasMore
          }
        });
      }
    }

    res.json({
      code: 200,
      msg: '暂无记录',
      data: null
    });
  } catch (error) {
    console.error('on-this-day error:', error);
    res.json({
      code: 200,
      msg: '暂无记录',
      data: null
    });
  }
});

router.get('/:id', authMiddleware, (req, res) => {
  const db = req.db;
  const diary = db.prepare('SELECT * FROM diaries WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!diary) {
    return res.status(404).json({ code: 404, msg: '日记本不存在或无权访问', data: null });
  }
  const pages = db.prepare('SELECT * FROM pages WHERE diary_id = ? ORDER BY page_num').all(req.params.id);
  res.json({ code: 200, msg: '操作成功', data: { ...diary, pages } });
});

router.post('/', authMiddleware, (req, res) => {
  const db = req.db;
  const { title, cover_style } = req.body;
  if (!title || title.length > 20) {
    return res.status(400).json({ code: 400, msg: '标题必填且不超过20字', data: null });
  }
  const validStyles = ['leather', 'linen', 'pattern'];
  const style = validStyles.includes(cover_style) ? cover_style : 'leather';

  const result = db.prepare(
    'INSERT INTO diaries (user_id, title, cover_style) VALUES (?, ?, ?)'
  ).run(req.user.id, sanitizeHtml(title), style);

  db.prepare('INSERT INTO pages (diary_id, content, page_num) VALUES (?, ?, ?)').run(result.lastInsertRowid, '', 1);

  res.status(201).json({ code: 201, msg: '创建成功', data: { id: result.lastInsertRowid } });
});

router.put('/:id', authMiddleware, (req, res) => {
  const db = req.db;
  const { title, cover_style } = req.body;
  const diary = db.prepare('SELECT * FROM diaries WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!diary) {
    return res.status(404).json({ code: 404, msg: '日记本不存在或无权访问', data: null });
  }

  const validStyles = ['leather', 'linen', 'pattern'];
  const newTitle = title ? sanitizeHtml(title) : diary.title;
  const newStyle = validStyles.includes(cover_style) ? cover_style : diary.cover_style;

  db.prepare('UPDATE diaries SET title = ?, cover_style = ? WHERE id = ?').run(newTitle, newStyle, req.params.id);
  res.json({ code: 200, msg: '更新成功', data: null });
});

router.delete('/:id', authMiddleware, (req, res) => {
  const db = req.db;
  const diary = db.prepare('SELECT * FROM diaries WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!diary) {
    return res.status(404).json({ code: 404, msg: '日记本不存在或无权访问', data: null });
  }
  db.prepare('DELETE FROM pages WHERE diary_id = ?').run(req.params.id);
  db.prepare('DELETE FROM diaries WHERE id = ?').run(req.params.id);
  res.json({ code: 200, msg: '删除成功', data: null });
});

module.exports = router;
