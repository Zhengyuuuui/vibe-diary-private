const { Router } = require('express');
const { sanitizeHtml } = require('../middleware/sanitize');
const { authMiddleware } = require('../middleware/auth');
const router = Router();

router.get('/:diaryId', authMiddleware, (req, res) => {
  try {
    const db = req.db;
    const diary = db.prepare('SELECT * FROM diaries WHERE id = ? AND user_id = ?').get(req.params.diaryId, req.user.id);
    if (!diary) {
      return res.status(404).json({ code: 404, msg: '日记本不存在或无权访问', data: null });
    }
    const pages = db.prepare('SELECT * FROM pages WHERE diary_id = ? ORDER BY page_num').all(req.params.diaryId);
    res.json({ code: 200, msg: '操作成功', data: pages });
  } catch (error) {
    console.error('获取页面列表失败:', error);
    res.status(500).json({ code: 500, msg: '获取失败', data: null });
  }
});

router.post('/:diaryId', authMiddleware, (req, res) => {
  const db = req.db;
  const { content } = req.body;
  const diary = db.prepare('SELECT * FROM diaries WHERE id = ? AND user_id = ?').get(req.params.diaryId, req.user.id);
  if (!diary) {
    return res.status(404).json({ code: 404, msg: '日记本不存在或无权访问', data: null });
  }

  const maxPage = db.prepare('SELECT MAX(page_num) AS max FROM pages WHERE diary_id = ?').get(req.params.diaryId);
  const nextPage = (maxPage.max || 0) + 1;
  const safeContent = typeof content === 'string' ? sanitizeHtml(content) : '';

  const result = db.prepare("INSERT INTO pages (diary_id, content, page_num, updated_at) VALUES (?, ?, ?, datetime('now', 'localtime'))").run(
    req.params.diaryId, safeContent, nextPage
  );
  res.status(201).json({ code: 201, msg: '页面创建成功', data: { id: result.lastInsertRowid } });
});

router.put('/:id', authMiddleware, (req, res) => {
  const db = req.db;
  const { content } = req.body;
  const page = db.prepare('SELECT p.* FROM pages p JOIN diaries d ON p.diary_id = d.id WHERE p.id = ? AND d.user_id = ?').get(req.params.id, req.user.id);
  if (!page) {
    return res.status(404).json({ code: 404, msg: '页面不存在或无权访问', data: null });
  }

  const safeContent = typeof content === 'string' ? sanitizeHtml(content) : page.content;
  db.prepare("UPDATE pages SET content = ?, updated_at = datetime('now', 'localtime') WHERE id = ?").run(safeContent, req.params.id);
  res.json({ code: 200, msg: '保存成功', data: null });
});

router.delete('/:id', authMiddleware, (req, res) => {
  const db = req.db;
  const page = db.prepare('SELECT p.* FROM pages p JOIN diaries d ON p.diary_id = d.id WHERE p.id = ? AND d.user_id = ?').get(req.params.id, req.user.id);
  if (!page) {
    return res.status(404).json({ code: 404, msg: '页面不存在或无权访问', data: null });
  }
  db.prepare('DELETE FROM pages WHERE id = ?').run(req.params.id);
  res.json({ code: 200, msg: '删除成功', data: null });
});

module.exports = router;
