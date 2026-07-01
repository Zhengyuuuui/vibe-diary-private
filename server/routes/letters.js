/**
 * 时光信箱路由
 * 提供给未来的自己写信功能
 */

const { Router } = require('express');
const { authMiddleware } = require('../middleware/auth');
const router = Router();

/**
 * GET /api/v1/letters/stats/overview
 * 统计：待拆数、已到期数、已拆数
 */
router.get('/stats/overview', authMiddleware, (req, res) => {
  try {
    const db = req.db;
    const userId = req.user.id;

    const total = db.prepare(
      'SELECT COUNT(*) as count FROM future_letters WHERE user_id = ?'
    ).get(userId).count;

    const pending = db.prepare(
      `SELECT COUNT(*) as count FROM future_letters
       WHERE user_id = ? AND is_opened = 0 AND deliver_at > datetime('now', 'localtime')`
    ).get(userId).count;

    const deliverable = db.prepare(
      `SELECT COUNT(*) as count FROM future_letters
       WHERE user_id = ? AND is_opened = 0 AND deliver_at <= datetime('now', 'localtime')`
    ).get(userId).count;

    const opened = db.prepare(
      `SELECT COUNT(*) as count FROM future_letters
       WHERE user_id = ? AND is_opened = 1`
    ).get(userId).count;

    res.json({
      code: 200,
      msg: '获取成功',
      data: {
        total,
        pending,
        deliverable,
        opened
      }
    });
  } catch (error) {
    console.error('获取时光信箱统计失败:', error);
    res.status(500).json({ code: 500, msg: '获取失败', data: null });
  }
});

/**
 * GET /api/v1/letters
 * 列表，支持过滤：未拆/已拆/已到期，分页
 * query: status=pending|opened|deliverable, page, limit
 */
router.get('/', authMiddleware, (req, res) => {
  try {
    const db = req.db;
    const userId = req.user.id;

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const status = req.query.status;

    let sql = 'SELECT * FROM future_letters WHERE user_id = ?';
    const params = [userId];

    if (status === 'pending') {
      sql += ' AND is_opened = 0 AND deliver_at > datetime(\'now\', \'localtime\')';
    } else if (status === 'opened') {
      sql += ' AND is_opened = 1';
    } else if (status === 'deliverable') {
      sql += ' AND is_opened = 0 AND deliver_at <= datetime(\'now\', \'localtime\')';
    }

    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as count');
    const total = db.prepare(countSql).get(...params).count;

    sql += ' ORDER BY deliver_at ASC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const letters = db.prepare(sql).all(...params);

    res.json({
      code: 200,
      msg: '获取成功',
      data: {
        list: letters,
        total,
        page,
        limit
      }
    });
  } catch (error) {
    console.error('获取时光信箱列表失败:', error);
    res.status(500).json({ code: 500, msg: '获取失败', data: null });
  }
});

/**
 * GET /api/v1/letters/:id
 * 详情
 */
router.get('/:id', authMiddleware, (req, res) => {
  try {
    const db = req.db;
    const userId = req.user.id;

    const letter = db.prepare(
      'SELECT * FROM future_letters WHERE id = ? AND user_id = ?'
    ).get(req.params.id, userId);

    if (!letter) {
      return res.status(404).json({
        code: 404,
        msg: '信件不存在',
        data: null
      });
    }

    res.json({
      code: 200,
      msg: '获取成功',
      data: letter
    });
  } catch (error) {
    console.error('获取信件详情失败:', error);
    res.status(500).json({ code: 500, msg: '获取失败', data: null });
  }
});

/**
 * POST /api/v1/letters
 * 创建信件
 * body: { title, content, deliver_at, mood }
 */
router.post('/', authMiddleware, (req, res) => {
  try {
    const db = req.db;
    const userId = req.user.id;

    const { title, content, deliver_at, mood } = req.body;

    // 参数校验
    if (!content || !deliver_at) {
      return res.status(400).json({
        code: 400,
        msg: '信件内容和约定打开时间为必填项',
        data: null
      });
    }

    // 校验 deliver_at 必须是未来时间
    const deliverDate = new Date(deliver_at);
    if (isNaN(deliverDate.getTime())) {
      return res.status(400).json({
        code: 400,
        msg: '约定打开时间格式无效',
        data: null
      });
    }

    if (deliverDate.getTime() <= Date.now()) {
      return res.status(400).json({
        code: 400,
        msg: '约定打开时间必须是未来时间',
        data: null
      });
    }

    const result = db.prepare(`
      INSERT INTO future_letters (user_id, title, content, deliver_at, mood)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      userId,
      title || null,
      content,
      deliver_at,
      mood || null
    );

    res.status(201).json({
      code: 201,
      msg: '信件已封存，等待未来的你开启',
      data: { id: result.lastInsertRowid }
    });
  } catch (error) {
    console.error('创建信件失败:', error);
    res.status(500).json({ code: 500, msg: '创建失败', data: null });
  }
});

/**
 * PUT /api/v1/letters/:id
 * 更新信件（仅未到期可修改）
 * body: { title, content, deliver_at, mood }
 */
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const db = req.db;
    const userId = req.user.id;

    const letter = db.prepare(
      'SELECT * FROM future_letters WHERE id = ? AND user_id = ?'
    ).get(req.params.id, userId);

    if (!letter) {
      return res.status(404).json({
        code: 404,
        msg: '信件不存在',
        data: null
      });
    }

    // 已拆信件不可修改
    if (letter.is_opened) {
      return res.status(403).json({
        code: 403,
        msg: '已拆开的信件不可修改',
        data: null
      });
    }

    const { title, content, deliver_at, mood } = req.body;

    // 校验 deliver_at 必须是未来时间
    if (deliver_at) {
      const deliverDate = new Date(deliver_at);
      if (isNaN(deliverDate.getTime())) {
        return res.status(400).json({
          code: 400,
          msg: '约定打开时间格式无效',
          data: null
        });
      }

      if (deliverDate.getTime() <= Date.now()) {
        return res.status(400).json({
          code: 400,
          msg: '约定打开时间必须是未来时间',
          data: null
        });
      }
    }

    db.prepare(`
      UPDATE future_letters SET
        title = COALESCE(?, title),
        content = COALESCE(?, content),
        deliver_at = COALESCE(?, deliver_at),
        mood = COALESCE(?, mood)
      WHERE id = ? AND user_id = ?
    `).run(
      title || null,
      content || null,
      deliver_at || null,
      mood || null,
      req.params.id,
      userId
    );

    res.json({
      code: 200,
      msg: '更新成功',
      data: null
    });
  } catch (error) {
    console.error('更新信件失败:', error);
    res.status(500).json({ code: 500, msg: '更新失败', data: null });
  }
});

/**
 * DELETE /api/v1/letters/:id
 * 删除信件
 */
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const db = req.db;
    const userId = req.user.id;

    const letter = db.prepare(
      'SELECT * FROM future_letters WHERE id = ? AND user_id = ?'
    ).get(req.params.id, userId);

    if (!letter) {
      return res.status(404).json({
        code: 404,
        msg: '信件不存在',
        data: null
      });
    }

    db.prepare('DELETE FROM future_letters WHERE id = ?').run(req.params.id);

    res.json({
      code: 200,
      msg: '信件已删除',
      data: null
    });
  } catch (error) {
    console.error('删除信件失败:', error);
    res.status(500).json({ code: 500, msg: '删除失败', data: null });
  }
});

/**
 * POST /api/v1/letters/:id/open
 * 拆信，仅到期信件可拆，标记 is_opened=1, opened_at=now
 */
router.post('/:id/open', authMiddleware, (req, res) => {
  try {
    const db = req.db;
    const userId = req.user.id;

    const letter = db.prepare(
      'SELECT * FROM future_letters WHERE id = ? AND user_id = ?'
    ).get(req.params.id, userId);

    if (!letter) {
      return res.status(404).json({
        code: 404,
        msg: '信件不存在',
        data: null
      });
    }

    // 已拆开的信件不可重复拆开
    if (letter.is_opened) {
      return res.status(403).json({
        code: 403,
        msg: '这封信已经拆开过了',
        data: null
      });
    }

    // 未到期不可拆开
    const now = new Date();
    const deliverDate = new Date(letter.deliver_at);
    if (deliverDate.getTime() > now.getTime()) {
      return res.status(403).json({
        code: 403,
        msg: '信件还未到期，请耐心等待',
        data: {
          deliver_at: letter.deliver_at,
          remaining_time: deliverDate.getTime() - now.getTime()
        }
      });
    }

    // 拆信：标记已打开
    db.prepare(`
      UPDATE future_letters SET
        is_opened = 1,
        opened_at = datetime('now', 'localtime')
      WHERE id = ? AND user_id = ?
    `).run(req.params.id, userId);

    // 返回完整信件内容
    const openedLetter = db.prepare(
      'SELECT * FROM future_letters WHERE id = ? AND user_id = ?'
    ).get(req.params.id, userId);

    res.json({
      code: 200,
      msg: '信件已拆开，来自过去的你',
      data: openedLetter
    });
  } catch (error) {
    console.error('拆信失败:', error);
    res.status(500).json({ code: 500, msg: '拆信失败', data: null });
  }
});

module.exports = router;
