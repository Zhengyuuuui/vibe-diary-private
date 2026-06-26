# 后端 AI 隐私开关功能开发任务

你是 Vibe Diary 后端开发 Agent。

## 任务目标
实现 AI 权限与隐私开关功能的后端部分（P0 级别）

## 任务范围
1. 数据库迁移：添加 AI 相关字段到 user_settings 表
2. 后端 API 开发：实现 AI 设置的获取和更新接口

## 设计文档位置
/Users/zhengyusheng/Desktop/diary备份/功能开发文档管理/VIBE_DIARY_AI_ROADMAP.md

## 产品原则
- **Privacy First**：默认关闭所有 AI 功能
- **AI Optional**：用户可以随时开启或关闭
- **Record First**：不强制用户使用 AI

---

## 第一部分：数据库迁移

### 数据库设计要求

在 `user_settings` 表添加以下字段：

```sql
ALTER TABLE user_settings ADD COLUMN ai_enabled BOOLEAN DEFAULT 0;
ALTER TABLE user_settings ADD COLUMN ai_reflection_enabled BOOLEAN DEFAULT 0;
ALTER TABLE user_settings ADD COLUMN ai_weekly_review_enabled BOOLEAN DEFAULT 0;
ALTER TABLE user_settings ADD COLUMN ai_emotion_trend_enabled BOOLEAN DEFAULT 0;
```

**字段说明：**
- `ai_enabled`：AI 功能总开关（默认关闭）
- `ai_reflection_enabled`：AI Reflection 功能开关（默认关闭）
- `ai_weekly_review_enabled`：AI Weekly Review 功能开关（默认关闭）
- `ai_emotion_trend_enabled`：情绪趋势分析功能开关（默认关闭）

### 迁移策略

1. 在 `server/database.js` 中添加迁移函数 `migrateUserSettingsAI()`
2. 使用 `PRAGMA table_info(user_settings)` 检查字段是否存在
3. 使用 `ALTER TABLE` 添加字段，避免重复添加
4. 默认值全部为 0（关闭），符合 Privacy First 原则
5. 在 `initDb()` 函数中调用迁移函数

### 迁移代码示例

```javascript
// server/database.js

function migrateUserSettingsAI(db) {
  try {
    const tableInfo = db.prepare('PRAGMA table_info(user_settings)').all();
    const columns = tableInfo.map(col => col.name);
    
    console.log('📋 user_settings 表当前字段:', columns);
    
    // 添加 ai_enabled 字段
    if (!columns.includes('ai_enabled')) {
      console.log('⏳ 开始添加 ai_enabled 字段...');
      db.exec('ALTER TABLE user_settings ADD COLUMN ai_enabled BOOLEAN DEFAULT 0');
      console.log('✅ ai_enabled 字段添加成功');
    }
    
    // 添加 ai_reflection_enabled 字段
    if (!columns.includes('ai_reflection_enabled')) {
      console.log('⏳ 开始添加 ai_reflection_enabled 字段...');
      db.exec('ALTER TABLE user_settings ADD COLUMN ai_reflection_enabled BOOLEAN DEFAULT 0');
      console.log('✅ ai_reflection_enabled 字段添加成功');
    }
    
    // 添加 ai_weekly_review_enabled 字段
    if (!columns.includes('ai_weekly_review_enabled')) {
      console.log('⏳ 开始添加 ai_weekly_review_enabled 字段...');
      db.exec('ALTER TABLE user_settings ADD COLUMN ai_weekly_review_enabled BOOLEAN DEFAULT 0');
      console.log('✅ ai_weekly_review_enabled 字段添加成功');
    }
    
    // 添加 ai_emotion_trend_enabled 字段
    if (!columns.includes('ai_emotion_trend_enabled')) {
      console.log('⏳ 开始添加 ai_emotion_trend_enabled 字段...');
      db.exec('ALTER TABLE user_settings ADD COLUMN ai_emotion_trend_enabled BOOLEAN DEFAULT 0');
      console.log('✅ ai_emotion_trend_enabled 字段添加成功');
    }
    
    // 验证迁移结果
    const newTableInfo = db.prepare('PRAGMA table_info(user_settings)').all();
    const newColumns = newTableInfo.map(col => col.name);
    console.log('📋 user_settings 表迁移后字段:', newColumns);
    
    // 检查数据
    const sampleData = db.prepare('SELECT id, ai_enabled, ai_reflection_enabled, ai_weekly_review_enabled, ai_emotion_trend_enabled FROM user_settings LIMIT 3').all();
    console.log('📊 AI 设置示例数据:', sampleData);
    
  } catch (error) {
    console.error('❌ AI 设置字段迁移失败:', error.message);
    console.error('❌ 错误堆栈:', error.stack);
  }
}

// 在 initDb() 函数中调用
function initDb(dbPath) {
  // ... 现有代码 ...
  
  migrateOldUsers(db);
  migrateUserProfiles(db);
  migrateDiariesToUsers(db);
  migratePagesUpdatedAt(db);
  migrateFavoritesTable(db);
  
  // 新增：AI 设置字段迁移
  migrateUserSettingsAI(db);
  
  console.log('✅ 所有迁移完成');
  return db;
}
```

---

## 第二部分：后端 API 开发

### API 端点设计

需要创建两个新端点：

1. **GET /api/v1/settings/ai** - 获取 AI 设置状态
2. **PUT /api/v1/settings/ai** - 更新 AI 设置状态

### API 路由文件

创建新文件 `server/routes/settings.js`（如果不存在）或在现有文件中添加：

```javascript
// server/routes/settings.js

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
```

### 注册路由

修改 `server/index.js`，注册新的路由：

```javascript
// server/index.js

const settingsRouter = require('./routes/settings');

// 在现有路由注册后添加
app.use('/api/v1/settings', settingsRouter);
```

---

## 第三部分：前端 API 函数（可选）

如果需要，可以在 `client/src/api/index.js` 中添加 API 函数：

```javascript
// client/src/api/index.js

// 获取 AI 设置状态
export function getAISettings() {
  return request('/settings/ai');
}

// 更新 AI 设置状态
export function updateAISettings(data) {
  return request('/settings/ai', {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}
```

---

## 开发要求

### 禁止事项
- 不修改任何前端代码（前端由前端 Agent 负责）
- 不修改现有数据库表结构（只添加字段）
- 不删除现有数据
- 不修改现有 API 端点

### 必须事项
- 所有字段默认值必须为 0（关闭）
- 所有 API 必须使用 `authMiddleware` 进行认证
- 所有数据库操作必须有 try-catch 异常处理
- 所有字段添加前必须检查是否已存在

### 测试要求
1. 启动服务，检查数据库迁移日志
2. 使用 Postman/curl 测试 GET /api/v1/settings/ai
3. 使用 Postman/curl 测试 PUT /api/v1/settings/ai
4. 验证默认关闭状态
5. 验证用户隔离（不同用户有不同的设置）

---

## 验证标准

修复成功后：
1. 数据库包含 AI 相关字段（ai_enabled 等）
2. API 端点正常工作
3. 默认关闭状态
4. 用户隔离正常
5. 异常处理完善

请开始开发。