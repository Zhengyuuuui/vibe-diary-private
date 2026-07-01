const { Router } = require('express');
const { sanitizeHtml } = require('../middleware/sanitize');
const { authMiddleware } = require('../middleware/auth');
const router = Router();

router.get('/', authMiddleware, (req, res) => {
  try {
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
  } catch (error) {
    console.error('获取日记列表失败:', error);
    res.status(500).json({ code: 500, msg: '获取失败', data: null });
  }
});

router.get('/stats', authMiddleware, (req, res) => {
  try {
    const db = req.db;
    const userId = req.user.id;

    // 1. 总日记数
    const totalDiaries = db.prepare('SELECT COUNT(*) AS count FROM diaries WHERE user_id = ?').get(userId).count;

    // 2. 总页数
    const totalPages = db.prepare(`
      SELECT COUNT(*) as count
      FROM pages p
      JOIN diaries d ON p.diary_id = d.id
      WHERE d.user_id = ?
    `).get(userId).count;

    // 3. 计算连续记录天数（真正的连续天数，断档归零）
    const streakResult = calculateStreakDays(db, userId);

    // 4. 使用年数（基于 users.created_at）
    const user = db.prepare('SELECT created_at FROM users WHERE id = ?').get(userId);
    const yearsOfUse = calculateYearsOfUse(user?.created_at);

    // 5. 里程碑判断
    const milestones = checkMilestones(totalPages, streakResult.streak_days, yearsOfUse);

    res.json({
      code: 200,
      msg: '获取成功',
      data: {
        total_entries: totalDiaries,
        total_pages: totalPages,
        streak_days: streakResult.streak_days,
        max_streak_days: streakResult.max_streak_days,
        years_of_use: yearsOfUse,
        milestones: milestones,
        weekly_pages: streakResult.weekly_pages
      }
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    res.status(500).json({ code: 500, msg: '获取失败', data: null });
  }
});

/**
 * 计算连续记录天数
 * @param {Object} db - 数据库实例
 * @param {number} userId - 用户ID
 * @returns {Object} - { streak_days, max_streak_days, weekly_pages }
 */
function calculateStreakDays(db, userId) {
  // 获取用户所有有记录的日期（按日期降序排列）
  const recordDates = db.prepare(`
    SELECT DISTINCT DATE(p.updated_at) as record_date
    FROM pages p
    JOIN diaries d ON p.diary_id = d.id
    WHERE d.user_id = ?
    AND p.updated_at IS NOT NULL
    ORDER BY record_date DESC
  `).all(userId);

  if (recordDates.length === 0) {
    return { streak_days: 0, max_streak_days: 0, weekly_pages: 0 };
  }

  // 计算本周页数
  const weeklyPages = db.prepare(`
    SELECT COUNT(*) as count 
    FROM pages p 
    JOIN diaries d ON p.diary_id = d.id 
    WHERE d.user_id = ? 
    AND p.updated_at >= datetime('now', '-7 days', 'localtime')
  `).get(userId).count;

  // 计算当前连续天数
  const today = new Date().toISOString().split('T')[0];
  let streakDays = 0;
  let currentDate = new Date(today);

  for (const record of recordDates) {
    const recordDate = record.record_date;
    if (!recordDate) continue;

    const expectedDate = currentDate.toISOString().split('T')[0];

    if (recordDate === expectedDate) {
      streakDays++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else if (recordDate === new Date(currentDate.getTime() - 86400000).toISOString().split('T')[0]) {
      // 允许昨天（用户今天还没记录，但昨天记录了）
      streakDays++;
      currentDate.setDate(currentDate.getDate() - 2);
    } else {
      // 断档，停止计数
      break;
    }
  }

  // 计算历史最长连续天数
  let maxStreakDays = 0;
  let tempStreak = 1;
  const dateStrings = recordDates.map(r => r.record_date).filter(d => d);

  for (let i = 1; i < dateStrings.length; i++) {
    const prevDate = new Date(dateStrings[i - 1]);
    const currDate = new Date(dateStrings[i]);
    const diffDays = Math.floor((prevDate - currDate) / 86400000);

    if (diffDays === 1) {
      tempStreak++;
      maxStreakDays = Math.max(maxStreakDays, tempStreak);
    } else {
      tempStreak = 1;
    }
  }
  maxStreakDays = Math.max(maxStreakDays, streakDays, 1);

  return { streak_days: streakDays, max_streak_days: maxStreakDays, weekly_pages: weeklyPages };
}

/**
 * 计算使用年数
 * @param {string} createdAt - 用户创建时间
 * @returns {number} - 使用年数（小数）
 */
function calculateYearsOfUse(createdAt) {
  if (!createdAt) return 0;

  const createdDate = new Date(createdAt);
  const now = new Date();
  const diffMs = now - createdDate;
  const years = diffMs / (365.25 * 24 * 60 * 60 * 1000);

  return Math.round(years * 10) / 10; // 保留1位小数
}

/**
 * 检查里程碑达成情况
 * @param {number} totalPages - 总页数
 * @param {number} streakDays - 连续天数
 * @param {number} yearsOfUse - 使用年数
 * @returns {Array} - 里程碑列表
 */
function checkMilestones(totalPages, streakDays, yearsOfUse) {
  const milestoneDefinitions = [
    { id: 'pages_100', name: '第100页', type: 'pages', target: 100, icon: '📖' },
    { id: 'pages_365', name: '第365页', type: 'pages', target: 365, icon: '📚' },
    { id: 'pages_1000', name: '第1000页', type: 'pages', target: 1000, icon: '🏆' },
    { id: 'streak_30', name: '连续30天', type: 'streak', target: 30, icon: '🔥' },
    { id: 'streak_100', name: '连续100天', type: 'streak', target: 100, icon: '💪' },
    { id: 'streak_365', name: '连续365天', type: 'streak', target: 365, icon: '⭐' },
    { id: 'years_1', name: '使用满1年', type: 'years', target: 1, icon: '🎂' },
    { id: 'years_3', name: '使用满3年', type: 'years', target: 3, icon: '🎉' },
    { id: 'years_5', name: '使用满5年', type: 'years', target: 5, icon: '🌟' }
  ];

  return milestoneDefinitions.map(milestone => {
    let current = 0;
    let achieved = false;

    switch (milestone.type) {
      case 'pages':
        current = totalPages;
        achieved = totalPages >= milestone.target;
        break;
      case 'streak':
        current = streakDays;
        achieved = streakDays >= milestone.target;
        break;
      case 'years':
        current = yearsOfUse;
        achieved = yearsOfUse >= milestone.target;
        break;
    }

    const progress = Math.min(100, Math.round((current / milestone.target) * 100));

    return {
      id: milestone.id,
      name: milestone.name,
      type: milestone.type,
      target: milestone.target,
      current: current,
      progress: progress,
      achieved: achieved,
      icon: milestone.icon
    };
  });
}

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
  try {
    const db = req.db;
    const diary = db.prepare('SELECT * FROM diaries WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!diary) {
      return res.status(404).json({ code: 404, msg: '日记本不存在或无权访问', data: null });
    }
    const pages = db.prepare('SELECT * FROM pages WHERE diary_id = ? ORDER BY page_num').all(req.params.id);
    res.json({ code: 200, msg: '操作成功', data: { ...diary, pages } });
  } catch (error) {
    console.error('获取日记详情失败:', error);
    res.status(500).json({ code: 500, msg: '获取失败', data: null });
  }
});

router.post('/', authMiddleware, (req, res) => {
  const db = req.db;
  const { title, cover_style } = req.body;

  if (!title || title.length > 20) {
    return res.status(400).json({ code: 400, msg: '标题必填且不超过20字', data: null });
  }

  const validStyles = ['leather', 'linen', 'pattern'];
  const style = validStyles.includes(cover_style) ? cover_style : 'leather';

  try {
    // 使用事务包装创建日记和页面操作，确保数据一致性
    const createDiary = db.transaction((userId, title, style) => {
      const result = db.prepare(
        'INSERT INTO diaries (user_id, title, cover_style) VALUES (?, ?, ?)'
      ).run(userId, title, style);

      db.prepare('INSERT INTO pages (diary_id, content, page_num) VALUES (?, ?, ?)').run(result.lastInsertRowid, '', 1);

      return result.lastInsertRowid;
    });

    const diaryId = createDiary(req.user.id, sanitizeHtml(title), style);
    res.status(201).json({ code: 201, msg: '创建成功', data: { id: diaryId } });
  } catch (error) {
    console.error('创建日记失败:', error);
    res.status(500).json({ code: 500, msg: '创建失败', data: null });
  }
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

  try {
    // 使用事务包装删除操作，pages 会通过 CASCADE 自动删除
    const deleteDiary = db.transaction((diaryId) => {
      db.prepare('DELETE FROM diaries WHERE id = ?').run(diaryId);
    });

    deleteDiary(req.params.id);
    res.json({ code: 200, msg: '删除成功', data: null });
  } catch (error) {
    console.error('删除日记失败:', error);
    res.status(500).json({ code: 500, msg: '删除失败', data: null });
  }
});

module.exports = router;
