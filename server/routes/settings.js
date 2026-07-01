const { Router } = require('express');
const { authMiddleware } = require('../middleware/auth');
const { encrypt, decrypt, isValidEncryptedText } = require('../utils/encryption');
const router = Router();

// GET /api/v1/settings/ai - 获取 AI 设置状态
router.get('/ai', authMiddleware, (req, res) => {
  try {
    const db = req.db;
    const userId = req.user.id;

    // 查询用户设置
    let settings = db.prepare(
      'SELECT ai_enabled, ai_reflection_enabled, ai_weekly_review_enabled, ai_emotion_trend_enabled, ai_provider FROM user_settings WHERE user_id = ?'
    ).get(userId);

    // 如果用户没有设置记录，创建默认设置
    if (!settings) {
      db.prepare(
        'INSERT INTO user_settings (user_id, ai_enabled, ai_reflection_enabled, ai_weekly_review_enabled, ai_emotion_trend_enabled, ai_provider) VALUES (?, 0, 0, 0, 0, \'deepseek\')'
      ).run(userId);

      settings = {
        ai_enabled: 0,
        ai_reflection_enabled: 0,
        ai_weekly_review_enabled: 0,
        ai_emotion_trend_enabled: 0,
        ai_provider: 'deepseek'
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
      ai_emotion_trend_enabled,
      ai_provider
    } = req.body;

    // 验证参数（必须是 0 或 1）
    const validateBoolean = (value) => {
      if (value === undefined || value === null) return null;
      return value === 1 ? 1 : 0;
    };

    // 验证供应商类型参数（必须是有效的供应商）
    const validateProvider = (value) => {
      if (!value) return null;
      const validProviders = ['deepseek', 'openai', 'anthropic'];
      return validProviders.includes(value) ? value : null;
    };

    // 检查用户是否有设置记录
    const existingSettings = db.prepare(
      'SELECT id FROM user_settings WHERE user_id = ?'
    ).get(userId);

    if (!existingSettings) {
      // 创建新设置记录
      db.prepare(`
        INSERT INTO user_settings (
          user_id, ai_enabled, ai_reflection_enabled, ai_weekly_review_enabled, ai_emotion_trend_enabled, ai_provider
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        userId,
        validateBoolean(ai_enabled) || 0,
        validateBoolean(ai_reflection_enabled) || 0,
        validateBoolean(ai_weekly_review_enabled) || 0,
        validateBoolean(ai_emotion_trend_enabled) || 0,
        validateProvider(ai_provider) || 'deepseek'
      );
    } else {
      // 更新现有设置
      db.prepare(`
        UPDATE user_settings SET
          ai_enabled = COALESCE(?, ai_enabled),
          ai_reflection_enabled = COALESCE(?, ai_reflection_enabled),
          ai_weekly_review_enabled = COALESCE(?, ai_weekly_review_enabled),
          ai_emotion_trend_enabled = COALESCE(?, ai_emotion_trend_enabled),
          ai_provider = COALESCE(?, ai_provider),
          updated_at = datetime('now', 'localtime')
        WHERE user_id = ?
      `).run(
        validateBoolean(ai_enabled),
        validateBoolean(ai_reflection_enabled),
        validateBoolean(ai_weekly_review_enabled),
        validateBoolean(ai_emotion_trend_enabled),
        validateProvider(ai_provider),
        userId
      );
    }

    res.json({ code: 200, msg: '更新成功', data: null });
  } catch (error) {
    console.error('更新 AI 设置失败:', error);
    res.status(500).json({ code: 500, msg: '更新失败', data: null });
  }
});

// GET /api/v1/settings/ai-api-key - 获取 API Key 配置状态
router.get('/ai-api-key', authMiddleware, (req, res) => {
  try {
    const db = req.db;
    const userId = req.user.id;

    // 查询用户设置
    let settings = db.prepare(
      'SELECT ai_api_key FROM user_settings WHERE user_id = ?'
    ).get(userId);

    // 如果用户没有设置记录，创建默认设置
    if (!settings) {
      db.prepare(
        'INSERT INTO user_settings (user_id, ai_enabled, ai_reflection_enabled, ai_weekly_review_enabled, ai_emotion_trend_enabled, ai_api_key) VALUES (?, 0, 0, 0, 0, NULL)'
      ).run(userId);

      settings = {
        ai_api_key: null
      };
    }

    // 返回是否已配置（不返回实际值）
    res.json({
      code: 200,
      msg: '获取成功',
      data: {
        has_api_key: settings.ai_api_key ? true : false
      }
    });
  } catch (error) {
    console.error('获取 API Key 配置状态失败:', error);
    res.status(500).json({ code: 500, msg: '获取失败', data: null });
  }
});

// PUT /api/v1/settings/ai-api-key - 更新 API Key
router.put('/ai-api-key', authMiddleware, (req, res) => {
  try {
    const db = req.db;
    const userId = req.user.id;

    const { api_key } = req.body;

    // 验证参数
    if (!api_key || typeof api_key !== 'string' || api_key.trim() === '') {
      return res.status(400).json({
        code: 400,
        msg: 'API Key 无效',
        data: null
      });
    }

    // 加密 API Key
    const encryptedApiKey = encrypt(api_key.trim());

    // 检查用户是否有设置记录
    const existingSettings = db.prepare(
      'SELECT id FROM user_settings WHERE user_id = ?'
    ).get(userId);

    if (!existingSettings) {
      // 创建新设置记录
      db.prepare(`
        INSERT INTO user_settings (
          user_id, ai_enabled, ai_reflection_enabled, ai_weekly_review_enabled, ai_emotion_trend_enabled, ai_api_key
        ) VALUES (?, 0, 0, 0, 0, ?)
      `).run(userId, encryptedApiKey);
    } else {
      // 更新现有设置
      db.prepare(`
        UPDATE user_settings SET
          ai_api_key = ?,
          updated_at = datetime('now', 'localtime')
        WHERE user_id = ?
      `).run(encryptedApiKey, userId);
    }

    res.json({ code: 200, msg: '更新成功', data: null });
  } catch (error) {
    console.error('更新 API Key 失败:', error);
    res.status(500).json({ code: 500, msg: '更新失败', data: null });
  }
});

// DELETE /api/v1/settings/ai-api-key - 删除 API Key
router.delete('/ai-api-key', authMiddleware, (req, res) => {
  try {
    const db = req.db;
    const userId = req.user.id;

    // 更新设置，清空 API Key
    db.prepare(`
      UPDATE user_settings SET
        ai_api_key = NULL,
        updated_at = datetime('now', 'localtime')
      WHERE user_id = ?
    `).run(userId);

    res.json({ code: 200, msg: '删除成功', data: null });
  } catch (error) {
    console.error('删除 API Key 失败:', error);
    res.status(500).json({ code: 500, msg: '删除失败', data: null });
  }
});

module.exports = router;