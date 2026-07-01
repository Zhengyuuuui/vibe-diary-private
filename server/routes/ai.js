/**
 * AI 功能路由
 * 提供 AI Reflection 等 AI 功能的 API 端点
 */

const { Router } = require('express');
const { authMiddleware } = require('../middleware/auth');
const { analyzeReflection, getFallbackMessage } = require('../services/ai-service');
const { decrypt, isValidEncryptedText } = require('../utils/encryption');
const router = Router();

/**
 * POST /api/v1/ai/reflection
 * AI Reflection 功能：分析用户最近 7 天的日记内容
 *
 * 请求：
 * - Headers: Authorization: Bearer <token>
 * - Body: 无需 body（自动获取最近 7 天日记）
 *
 * 返回：
 * - 成功：{ code: 200, msg: '分析成功', data: { reflection: '...' } }
 * - 失败：{ code: 500, msg: 'AI 服务不可用', data: { fallback_message: '...' } }
 */
router.post('/reflection', authMiddleware, async (req, res) => {
  try {
    const db = req.db;
    const userId = req.user.id;
    const forceRefresh = req.query.force_refresh === 'true';

    // 1. 检查 AI 设置状态、API Key、供应商类型和缓存字段
    const settings = db.prepare(
      'SELECT ai_enabled, ai_reflection_enabled, ai_api_key, ai_provider, ai_reflection_cache, ai_reflection_updated_at FROM user_settings WHERE user_id = ?'
    ).get(userId);

    // 如果用户没有设置记录，创建默认设置（默认关闭）
    if (!settings) {
      db.prepare(
        'INSERT INTO user_settings (user_id, ai_enabled, ai_reflection_enabled, ai_weekly_review_enabled, ai_emotion_trend_enabled, ai_api_key, ai_provider) VALUES (?, 0, 0, 0, 0, NULL, \'deepseek\')'
      ).run(userId);

      return res.status(403).json({
        code: 403,
        msg: 'AI 功能未开启，请在设置中开启 AI Reflection 功能',
        data: null
      });
    }

    // 检查 ai_enabled 和 ai_reflection_enabled 状态
    if (!settings.ai_enabled || !settings.ai_reflection_enabled) {
      return res.status(403).json({
        code: 403,
        msg: 'AI 功能未开启，请在设置中开启 AI Reflection 功能',
        data: {
          ai_enabled: settings.ai_enabled,
          ai_reflection_enabled: settings.ai_reflection_enabled
        }
      });
    }

    // 检查用户是否配置了 API Key
    let customApiKey = null;
    if (settings.ai_api_key && isValidEncryptedText(settings.ai_api_key)) {
      try {
        customApiKey = decrypt(settings.ai_api_key);
        console.log('✅ 使用用户自定义 API Key');
      } catch (error) {
        console.error('❌ 解密用户 API Key 失败:', error.message);
        return res.status(500).json({
          code: 500,
          msg: 'API Key 解密失败，请重新配置',
          data: null
        });
      }
    } else if (!settings.ai_api_key) {
      return res.status(400).json({
        code: 400,
        msg: '请先配置 AI API Key，在设置中添加您的 API Key',
        data: {
          has_api_key: false
        }
      });
    }

    // 🆕 缓存判断逻辑：同一天内非强制刷新时返回缓存
    if (!forceRefresh && settings.ai_reflection_cache && settings.ai_reflection_updated_at) {
      try {
        // 判断缓存是否为今天（同一天）
        const cacheDate = new Date(settings.ai_reflection_updated_at);
        const today = new Date();
        const isSameDay =
          cacheDate.getFullYear() === today.getFullYear() &&
          cacheDate.getMonth() === today.getMonth() &&
          cacheDate.getDate() === today.getDate();

        if (isSameDay) {
          // 缓存命中：解析缓存数据并返回
          const cachedData = JSON.parse(settings.ai_reflection_cache);
          console.log('📦 AI Reflection 缓存命中，user_id:', userId, '缓存时间:', settings.ai_reflection_updated_at);

          return res.json({
            code: 200,
            msg: '分析成功（来自缓存）',
            data: {
              ...cachedData,
              from_cache: true,
              cache_updated_at: settings.ai_reflection_updated_at
            }
          });
        }
      } catch (cacheError) {
        // 缓存解析失败，降级为重新分析
        console.warn('⚠️ AI Reflection 缓存解析失败，降级为重新分析:', cacheError.message);
      }
    }

    // 2. 获取最近 7 天的日记内容
    const recentPages = db.prepare(`
      SELECT
        p.id as page_id,
        p.content,
        p.updated_at,
        p.diary_id,
        d.title as diary_title
      FROM pages p
      JOIN diaries d ON p.diary_id = d.id
      WHERE d.user_id = ?
      AND p.content IS NOT NULL
      AND p.content != ''
      AND p.updated_at >= datetime('now', '-7 days', 'localtime')
      ORDER BY p.updated_at DESC
    `).all(userId);

    // 检查是否有日记内容
    if (!recentPages || recentPages.length === 0) {
      return res.json({
        code: 200,
        msg: '最近 7 天暂无日记内容',
        data: {
          reflection: '最近 7 天你还没有写下日记。开始记录你的生活，AI 会帮助你回顾和发现美好。',
          has_content: false
        }
      });
    }

    // 3. 格式化日记内容（限制长度，避免发送过多数据给 AI）
    let diaryContent = '最近 7 天的日记内容：\n\n';
    let totalLength = 0;
    const maxLength = 3000; // 限制最多 3000 字

    recentPages.forEach((page, index) => {
      const content = page.content.substring(0, 300); // 每篇日记最多 300 字
      const date = new Date(page.updated_at).toLocaleDateString('zh-CN');
      const title = page.diary_title;

      diaryContent += `【${title}】${date}\n${content}\n\n`;

      totalLength += content.length;

      // 达到长度限制后停止
      if (totalLength >= maxLength) {
        return;
      }
    });

    // 添加统计信息
    diaryContent += `\n统计信息：\n`;
    diaryContent += `- 日记数量：${recentPages.length} 篇\n`;
    diaryContent += `- 总字数：约 ${totalLength} 字\n`;

    // 4. 调用 AI 服务进行分析（传入用户自定义 API Key 和供应商类型）
    const provider = settings.ai_provider || 'deepseek';
    const result = await analyzeReflection(diaryContent, customApiKey, provider);

    // 5. 返回结果
    if (result.success) {
      // 🆕 构建返回数据（用于缓存存储和返回）
      const responseData = {
        reflection: result.reflection,          // 完整文本(兼容旧逻辑)
        keywords: result.keywords,              // 关键词数组
        observation: result.observation,        // AI 观察文本
        mood: result.mood,                      // 情绪状态
        mood_label: result.mood_label,          // 情绪状态中文标签
        weekly_highlight: result.weekly_highlight,  // 本周亮点文本
        emotion_trend: result.emotion_trend,    // 情绪趋势数据
        model: result.model,
        provider: provider,
        usage: result.usage,
        has_content: true,
        pages_count: recentPages.length
      };

      // 🆕 存储缓存到数据库
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
      db.prepare(`
        UPDATE user_settings SET
          ai_reflection_cache = ?,
          ai_reflection_updated_at = ?
        WHERE user_id = ?
      `).run(JSON.stringify(responseData), now, userId);
      console.log('💾 AI Reflection 缓存已更新，user_id:', userId, '更新时间:', now);

      res.json({
        code: 200,
        msg: '分析成功',
        data: {
          ...responseData,
          from_cache: false,
          cache_updated_at: now
        }
      });
    } else {
      // AI 服务失败，返回降级提示
      res.json({
        code: 200,
        msg: 'AI 服务暂时不可用',
        data: getFallbackMessage()
      });
    }

  } catch (error) {
    console.error('❌ AI Reflection 分析失败:', error);

    // 异常处理：返回友好提示
    res.status(500).json({
      code: 500,
      msg: 'AI Reflection 分析失败',
      data: {
        fallback_message: '抱歉，AI 服务暂时不可用。请稍后再试，或继续写下你的日记。',
        error: error.message
      }
    });
  }
});

module.exports = router;