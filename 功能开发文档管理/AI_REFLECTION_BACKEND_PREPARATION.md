# 后端 AI Reflection 功能准备情况排查报告

更新时间：2026-06-25

---

## 排查目标

排查后端 AI Reflection 功能的准备情况，为后续开发提供依据。

---

## 1. 现有 API 路由结构

### 已有端点

**认证相关（auth.js）**
- POST /api/v1/auth/register - 用户注册
- POST /api/v1/auth/login - 用户登录
- GET /api/v1/auth/verify - 验证 token
- GET /api/v1/auth/profile - 获取用户信息
- PUT /api/v1/auth/profile - 更新用户信息
- POST /api/v1/auth/avatar - 上传头像
- GET /api/v1/auth/settings - 获取用户设置
- PUT /api/v1/auth/settings - 更新用户设置

**日记相关（diaries.js）**
- GET /api/v1/diaries - 获取日记列表（支持分页）
- GET /api/v1/diaries/stats - 获取统计数据（包括最近 7 天页面数量）
- GET /api/v1/diaries/random-fragment - 获取随机日记片段
- GET /api/v1/diaries/on-this-day - 获取历史上的今天
- GET /api/v1/diaries/:id - 获取日记详情
- POST /api/v1/diaries - 创建日记
- PUT /api/v1/diaries/:id - 更新日记
- DELETE /api/v1/diaries/:id - 删除日记

**页面相关（pages.js）**
- GET /api/v1/pages/:diaryId - 获取页面列表
- POST /api/v1/pages/:diaryId - 创建页面
- PUT /api/v1/pages/:id - 更新页面
- DELETE /api/v1/pages/:id - 删除页面

**收藏相关（favorites.js）**
- GET /api/v1/favorites - 获取收藏列表（支持搜索、分页、筛选）
- GET /api/v1/favorites/stats/overview - 获取收藏统计
- GET /api/v1/favorites/random/inspiration - 获取随机灵感
- GET /api/v1/favorites/search/query - 搜索收藏
- GET /api/v1/favorites/:id - 获取收藏详情
- POST /api/v1/favorites - 创建收藏
- POST /api/v1/favorites/upload-image - 上传收藏图片
- PUT /api/v1/favorites/:id - 更新收藏
- DELETE /api/v1/favorites/:id - 删除收藏

**AI 设置相关（settings.js）**
- GET /api/v1/settings/ai - 获取 AI 设置状态
- PUT /api/v1/settings/ai - 更新 AI 设置状态

### 结论

✅ **现有 API 结构完善**，已具备用户认证、数据隔离、日记管理等基础能力。

⚠️ **缺失 AI Reflection 端点**，需要新增 POST /api/v1/ai/reflection。

---

## 2. 数据库查询能力

### 已有能力

**diaries.js 第 37-43 行：获取最近 7 天页面数量**
```javascript
const weeklyPages = db.prepare(`
  SELECT COUNT(*) as count 
  FROM pages p 
  JOIN diaries d ON p.diary_id = d.id 
  WHERE d.user_id = ? 
  AND p.updated_at >= datetime('now', '-7 days', 'localtime')
`).get(userId).count;
```

**diaries.js 第 81-88 行：获取随机日记片段**
```javascript
const page = db.prepare(`
  SELECT p.id as page_id, p.content, p.updated_at, p.diary_id, d.title as diary_title
  FROM pages p
  JOIN diaries d ON p.diary_id = d.id
  WHERE d.user_id = ? AND p.content IS NOT NULL AND p.content != ''
  ORDER BY RANDOM()
  LIMIT 1
`).get(userId);
```

### 缺失能力

❌ **缺少获取最近 7 天日记内容的端点**。

AI Reflection 需要获取最近 7 天的日记内容（不仅仅是数量），用于发送给 DeepSeek API 进行分析。

### 需要新增的数据库查询

```javascript
// 获取最近 7 天的日记内容
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
```

---

## 3. 现有中间件和工具函数

### 已有中间件

✅ **authMiddleware**（auth.js）
- JWT 认证，验证用户身份
- 已完善，可用于 AI Reflection 端点

✅ **sanitizeHtml**（sanitize.js）
- HTML 清理，防止 XSS 攻击
- 已完善，可用于清理日记内容

### 缺失工具函数

❌ **缺少 AI 相关工具函数**：
1. DeepSeek API 调用函数
2. AI 错误处理函数
3. AI 日志记录函数
4. AI 结果解析函数

---

## 4. 环境变量配置情况

### 已有环境变量

✅ **JWT_SECRET**
- 已配置，用于 JWT 认证
- 已完善

✅ **ALLOWED_ORIGINS**
- 已配置，用于 CORS 限制
- 已完善（支持开发环境自动允许 localhost）

### 缺失环境变量

❌ **缺少 DeepSeek API Key 配置**：

需要新增：
```env
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_API_URL=https://api.deepseek.com/v1
```

---

## 5. 缺失的功能模块

### 5.1 AI 服务集成

❌ **缺少 DeepSeek API 集成**。

需要新增：
- server/services/ai.js（AI 服务模块）
- DeepSeek API 调用函数（OpenAI 格式接口）
- 错误处理和重试机制
- 日志记录

### 5.2 AI Reflection 端点

❌ **缺少 AI Reflection API 端点**。

需要新增：
- server/routes/ai.js（AI 路由文件）
- POST /api/v1/ai/reflection（AI Reflection 端点）
- 数据库查询：获取最近 7 天日记内容
- AI 设置验证：检查 ai_enabled 和 ai_reflection_enabled
- 调用 DeepSeek API 进行分析
- 返回分析结果

### 5.3 环境变量配置

❌ **缺少 DeepSeek API Key 配置**。

需要新增：
- server/.env 文件中添加 DEEPSEEK_API_KEY
- server/.env 文件中添加 DEEPSEEK_API_URL

### 5.4 数据库查询

❌ **缺少获取最近 7 天日记内容的端点**。

可以在 diaries.js 中新增端点，或在 ai.js 中直接查询。

---

## 6. 开发建议和优先级

### 优先级 P0：环境变量配置

**任务**：配置 DeepSeek API Key 和 URL

**工作量**：极低（2 分钟）

**文件**：server/.env

**代码**：
```env
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_API_URL=https://api.deepseek.com/v1
```

---

### 优先级 P1：AI 服务模块

**任务**：创建 AI 服务模块，集成 DeepSeek API

**工作量**：中等（30-60 分钟）

**文件**：server/services/ai.js

**功能**：
1. DeepSeek API 调用函数
2. 错误处理和重试机制
3. 日志记录
4. 结果解析

---

### 优先级 P1：AI Reflection 端点

**任务**：创建 AI Reflection API 端点

**工作量**：中等（30-60 分钟）

**文件**：server/routes/ai.js

**功能**：
1. 数据库查询：获取最近 7 天日记内容
2. AI 设置验证：检查 ai_enabled 和 ai_reflection_enabled
3. 调用 DeepSeek API 进行分析
4. 返回分析结果
5. 异常处理

---

### 优先级 P2：数据库查询优化

**任务**：优化数据库查询，支持 AI Reflection

**工作量**：低（10-20 分钟）

**文件**：server/routes/ai.js 或 server/routes/diaries.js

**功能**：
1. 获取最近 7 天日记内容
2. 支持分页和限制
3. 支持内容长度限制（避免发送过多数据给 AI）

---

## 7. 开发工作量估算

| 任务 | 优先级 | 工作量 | 文件 | 状态 |
|---|---|---|---|---|
| 环境变量配置 | P0 | 2 分钟 | server/.env | ❌ 未完成 |
| AI 服务模块 | P1 | 30-60 分钟 | server/services/ai.js | ❌ 未完成 |
| AI Reflection 端点 | P1 | 30-60 分钟 | server/routes/ai.js | ❌ 未完成 |
| 数据库查询优化 | P2 | 10-20 分钟 | server/routes/ai.js | ❌ 未完成 |
| 路由注册 | P1 | 2 分钟 | server/index.js | ❌ 未完成 |

**总工作量**：约 1-2 小时

---

## 8. 现有代码结构分析

### 优点

✅ **用户认证完善**：authMiddleware 已实现，支持 JWT 认证。

✅ **数据隔离完善**：所有端点都使用 authMiddleware，确保用户数据隔离。

✅ **数据库查询能力强**：已有获取统计数据、随机日记片段的能力。

✅ **异常处理完善**：所有端点都有 try-catch 异常处理。

✅ **AI 隐私开关已实现**：ai_enabled 和 ai_reflection_enabled 字段已添加。

✅ **代码结构清晰**：路由、中间件、数据库分离，易于扩展。

### 需要改进的地方

⚠️ **缺少 AI 服务模块**：需要创建 server/services/ai.js。

⚠️ **缺少 AI 路由文件**：需要创建 server/routes/ai.js。

⚠️ **缺少 DeepSeek API Key 配置**：需要添加环境变量。

⚠️ **缺少获取最近 7 天日记内容的端点**：需要新增数据库查询。

---

## 9. 开发风险提示

### 风险 1：DeepSeek API 限流

**风险**：DeepSeek API 可能有限流限制。

**建议**：实现重试机制和错误处理。

### 风险 2：日记内容过长

**风险**：用户最近 7 天的日记内容可能过长，超过 DeepSeek API 的输入限制。

**建议**：实现内容长度限制（如限制最多 3000 字）。

### 风险 3：AI 功能滥用

**风险**：用户可能频繁调用 AI Reflection，导致 API 调用过多。

**建议**：实现调用频率限制（如每天最多 3 次）。

### 风险 4：AI 结果质量

**风险**：DeepSeek API 可能返回质量不佳的结果。

**建议**：实现结果验证和过滤机制。

---

## 10. 推荐开发顺序

1. **配置 DeepSeek API Key**（P0，2 分钟）
2. **创建 AI 服务模块**（P1，30-60 分钟）
3. **创建 AI Reflection 端点**（P1，30-60 分钟）
4. **测试 AI Reflection 功能**（P1，10-20 分钟）
5. **优化数据库查询**（P2，10-20 分钟）
6. **实现调用频率限制**（P2，10-20 分钟）

---

## 11. 总结

后端 AI Reflection 功能的准备情况：

✅ **已具备**：
1. 用户认证和数据隔离
2. AI 隐私开关（ai_enabled 和 ai_reflection_enabled）
3. 数据库查询能力（统计数据、随机日记片段）
4. 异常处理机制
5. 清晰的代码结构

❌ **缺失**：
1. DeepSeek API Key 配置
2. AI 服务模块（DeepSeek API 调用）
3. AI Reflection 端点
4. 获取最近 7 天日记内容的数据库查询

**开发建议**：先完成 P0 级别的环境变量配置，然后依次完成 P1 级别的 AI 服务模块和 AI Reflection 端点。

**总工作量**：约 1-2 小时。

---

## 12. Stable Assets 确认

### 稳定的资产（无需修改）

✅ **AI 隐私开关**：ai_enabled 和 ai_reflection_enabled 字段已添加。

✅ **用户数据隔离**：authMiddleware 已实现，确保用户数据隔离。

✅ **pages 表结构**：无需新增数据库字段，现有字段满足需求。

✅ **server/routes/settings.js**：已存在，可用于 AI 设置管理。

✅ **server/database.js**：已完善，无需修改。

✅ **server/middleware/auth.js**：已完善，无需修改。

✅ **server/middleware/sanitize.js**：已完善，无需修改。

---

**排查完成时间**：2026-06-25

**排查结果**：后端已具备基础能力，需要新增 AI 服务模块和 AI Reflection 端点。