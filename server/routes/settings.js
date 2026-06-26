const { Router } = require('express');
const { authMiddleware } = require('../middleware/auth');
const router = Router();

// GET /api/v1/settings/ai - 获取 AI 设置状态
router.get('/ai', authMiddleware, (req, res) => {
  try {
    const db = req.db;
    const userId = req.user.id;

    // 查询用户设置
    let settings = db.prepare(
      'SELECT ai_enabled, ai_reflection_enabled, ai_weekly_review_enabled, ai_emotion_trend_enabled FROM user_settings WHERE user_id = ?'
    ).get(userId);

    // 如果用户没有设置记录，创建默认设置
    if (!settings) {
      db.prepare(
        'INSERT INTO user_settings (user_id, ai_enabled, ai_reflection_enabled, ai_weekly_review_enabled, ai_emotion_trend_enabled) VALUES (?, 0, 0, 0, 0)'
      ).run(userId);

      settings = {
        ai_enabled: 0,
        ai_reflection_enabled: 0,
        ai_weekly_review_enabled: 0,
        ai_emotion_trend_enabled: 0
      };
    }

    res.json({
      code: 200,
      msg: '获取成功',
      data: settings
    });
  } catch (error) {
    console.error('获取 AI 设置失败:', error);
    res.status(500).json({ code: 500, msg: '获取失败', data: null });
  }
});

// PUT /api/v1/settings/ai - 更新 AI 设置状态
router.put('/ai', authMiddleware, (req, res) => {
  try {
    const db = req.db;
    const userId = req.user.id;

    const {
      ai_enabled,
      ai_reflection_enabled,
      ai_weekly_review_enabled,
      ai_emotion_trend_enabled
    } = req.body;

    // 验证参数（必须是 0 或 1）
    const validateBoolean = (value) => {
      if (value === undefined || value === null) return null;
      return value === 1 ? 1 : 0;
    };

    // 检查用户是否有设置记录
    const existingSettings = db.prepare(
      'SELECT id FROM user_settings WHERE user_id = ?'
    ).get(userId);

    if (!existingSettings) {
      // 创建新设置记录
      db.prepare(`
        INSERT INTO user_settings (
          user_id, ai_enabled, ai_reflection_enabled, ai_weekly_review_enabled, ai_emotion_trend_enabled
        ) VALUES (?, ?, ?, ?, ?)
      `).run(
        userId,
        validateBoolean(ai_enabled) || 0,
        validateBoolean(ai_reflection_enabled) || 0,
        validateBoolean(ai_weekly_review_enabled) || 0,
        validateBoolean(ai_emotion_trend_enabled) || 0
      );
    } else {
      // 更新现有设置
      db.prepare(`
        UPDATE user_settings SET
          ai_enabled = COALESCE(?, ai_enabled),
          ai_reflection_enabled = COALESCE(?, ai_reflection_enabled),
          ai_weekly_review_enabled = COALESCE(?, ai_weekly_review_enabled),
          ai_emotion_trend_enabled = COALESCE(?, ai_emotion_trend_enabled),
          updated_at = datetime('now', 'localtime')
        WHERE user_id = ?
      `).run(
        validateBoolean(ai_enabled),
        validateBoolean(ai_reflection_enabled),
        validateBoolean(ai_weekly_review_enabled),
        validateBoolean(ai_emotion_trend_enabled),
        userId
      );
    }

    res.json({ code: 200, msg: '更新成功', data: null });
  } catch (error) {
    console.error('更新 AI 设置失败:', error);
    res.status(500).json({ code: 500, msg: '更新失败', data: null });
  }
});

module.exports = router;